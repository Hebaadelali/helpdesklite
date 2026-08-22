import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { CATEGORIES, PRIORITIES, STATUSES, computeSlaDeadline, slaState } from "../lib/constants.js";
import { suggestPriorityAndCategory } from "../lib/aiSuggest.js";

export const ticketsRouter = Router();
ticketsRouter.use(requireAuth);

function nextRef() {
  const row = db.prepare("SELECT COUNT(*) AS n FROM tickets").get();
  return `HD-${1000 + row.n + 1}`;
}

function addEvent(ticketId, actor, text, kind = "system") {
  db.prepare(
    "INSERT INTO ticket_events (id, ticketId, actor, text, kind) VALUES (?, ?, ?, ?, ?)"
  ).run(nanoid(), ticketId, actor, text, kind);
}

const userName = (id) => (id ? db.prepare("SELECT name FROM users WHERE id = ?").get(id)?.name ?? null : null);

function serializeTicket(t) {
  const history = db
    .prepare("SELECT id, at, actor, text, kind FROM ticket_events WHERE ticketId = ? ORDER BY at ASC")
    .all(t.id);
  return {
    ...t,
    requestedBy: userName(t.requestedById),
    assigneeName: userName(t.assigneeId),
    sla: slaState(t),
    history,
  };
}

// POST /api/tickets/suggest — live AI priority + category suggestion while typing.
// Never requires elevated role: any authenticated employee can call it.
ticketsRouter.post("/suggest", async (req, res) => {
  const { subject = "", description = "" } = req.body || {};
  if (!subject && !description) return res.status(400).json({ error: "subject or description required" });
  const suggestion = await suggestPriorityAndCategory({ subject, description });
  res.json(suggestion);
});

// POST /api/tickets — create a ticket (Employee, or anyone submitting on their own behalf)
ticketsRouter.post("/", (req, res) => {
  const { subject, description, category, priority } = req.body || {};
  if (!subject || !description) return res.status(400).json({ error: "subject and description are required" });
  if (category && !CATEGORIES.includes(category)) return res.status(400).json({ error: "Invalid category" });
  if (priority && !PRIORITIES.includes(priority)) return res.status(400).json({ error: "Invalid priority" });

  const finalPriority = priority || "Normal";
  const id = nanoid();
  const now = new Date();
  const ticket = {
    id,
    ref: nextRef(),
    subject,
    description,
    category: category || "Software / Accounts",
    priority: finalPriority,
    status: "New",
    assigneeId: null,
    requestedById: req.user.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    resolvedAt: null,
    slaDeadline: computeSlaDeadline(finalPriority, now),
  };

  db.prepare(
    `INSERT INTO tickets (id, ref, subject, description, category, priority, status, assigneeId, requestedById, createdAt, updatedAt, resolvedAt, slaDeadline)
     VALUES (@id, @ref, @subject, @description, @category, @priority, @status, @assigneeId, @requestedById, @createdAt, @updatedAt, @resolvedAt, @slaDeadline)`
  ).run(ticket);

  addEvent(id, req.user.name, `Ticket ${ticket.ref} created (${ticket.priority} priority).`);
  res.status(201).json(serializeTicket(ticket));
});

// GET /api/tickets — list, scoped by role.
// Employee: only their own tickets. Support Agent / Manager: everything.
ticketsRouter.get("/", (req, res) => {
  const { status, category, assigneeId, q } = req.query;
  let sql = "SELECT * FROM tickets WHERE 1=1";
  const params = [];

  if (req.user.role === "Employee") {
    sql += " AND requestedById = ?";
    params.push(req.user.id);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (assigneeId) {
    sql += " AND assigneeId = ?";
    params.push(assigneeId);
  }
  if (q) {
    sql += " AND (subject LIKE ? OR ref LIKE ? OR description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY createdAt DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeTicket));
});

// GET /api/tickets/:id
ticketsRouter.get("/:id", (req, res) => {
  const t = db.prepare("SELECT * FROM tickets WHERE id = ?").get(req.params.id);
  if (!t) return res.status(404).json({ error: "Ticket not found" });
  if (req.user.role === "Employee" && t.requestedById !== req.user.id) {
    return res.status(403).json({ error: "You can only view your own tickets" });
  }
  res.json(serializeTicket(t));
});

// PATCH /api/tickets/:id/assign — Support Agent / Manager only
ticketsRouter.patch("/:id/assign", requireRole("Support Agent", "Manager"), (req, res) => {
  const t = db.prepare("SELECT * FROM tickets WHERE id = ?").get(req.params.id);
  if (!t) return res.status(404).json({ error: "Ticket not found" });

  const { assigneeId } = req.body || {};
  db.prepare("UPDATE tickets SET assigneeId = ?, updatedAt = ? WHERE id = ?").run(
    assigneeId || null,
    new Date().toISOString(),
    t.id
  );
  addEvent(t.id, req.user.name, assigneeId ? `Assigned to ${userName(assigneeId) ?? "someone"}.` : "Unassigned.");
  res.json(serializeTicket(db.prepare("SELECT * FROM tickets WHERE id = ?").get(t.id)));
});

// PATCH /api/tickets/:id/priority — Support Agent / Manager only
ticketsRouter.patch("/:id/priority", requireRole("Support Agent", "Manager"), (req, res) => {
  const t = db.prepare("SELECT * FROM tickets WHERE id = ?").get(req.params.id);
  if (!t) return res.status(404).json({ error: "Ticket not found" });

  const { priority } = req.body || {};
  if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: "Invalid priority" });

  const now = new Date();
  // Recompute the SLA deadline from now, at the new priority's SLA budget,
  // so escalating a ticket actually tightens its deadline going forward.
  const slaDeadline = computeSlaDeadline(priority, now);
  db.prepare("UPDATE tickets SET priority = ?, slaDeadline = ?, updatedAt = ? WHERE id = ?").run(
    priority,
    slaDeadline,
    now.toISOString(),
    t.id
  );
  addEvent(t.id, req.user.name, `Priority changed to ${priority}.`);
  res.json(serializeTicket(db.prepare("SELECT * FROM tickets WHERE id = ?").get(t.id)));
});

// PATCH /api/tickets/:id/status — Support Agent / Manager only
ticketsRouter.patch("/:id/status", requireRole("Support Agent", "Manager"), (req, res) => {
  const t = db.prepare("SELECT * FROM tickets WHERE id = ?").get(req.params.id);
  if (!t) return res.status(404).json({ error: "Ticket not found" });

  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const now = new Date().toISOString();
  const resolvedAt = status === "Resolved" || status === "Closed" ? now : null;
  db.prepare("UPDATE tickets SET status = ?, updatedAt = ?, resolvedAt = ? WHERE id = ?").run(status, now, resolvedAt, t.id);
  addEvent(t.id, req.user.name, `Status changed to ${status}.`);
  res.json(serializeTicket(db.prepare("SELECT * FROM tickets WHERE id = ?").get(t.id)));
});

// POST /api/tickets/:id/notes — progress note, Support Agent / Manager only
ticketsRouter.post("/:id/notes", requireRole("Support Agent", "Manager"), (req, res) => {
  const t = db.prepare("SELECT * FROM tickets WHERE id = ?").get(req.params.id);
  if (!t) return res.status(404).json({ error: "Ticket not found" });

  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });

  addEvent(t.id, req.user.name, text, "note");
  db.prepare("UPDATE tickets SET updatedAt = ? WHERE id = ?").run(new Date().toISOString(), t.id);
  res.status(201).json(serializeTicket(db.prepare("SELECT * FROM tickets WHERE id = ?").get(t.id)));
});

// GET /api/tickets/meta/dashboard — Manager-only aggregate view
ticketsRouter.get("/meta/dashboard", requireRole("Manager", "Support Agent"), (req, res) => {
  const all = db.prepare("SELECT * FROM tickets").all().map(serializeTicket);
  const openStatuses = ["New", "In Progress", "Pending"];

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, all.filter((t) => t.status === s).length]));
  const unassigned = all.filter((t) => openStatuses.includes(t.status) && !t.assigneeId).length;
  const breached = all.filter((t) => t.sla === "breached").length;
  const atRisk = all.filter((t) => t.sla === "at_risk").length;

  const workload = {};
  for (const t of all) {
    if (!t.assigneeId || !openStatuses.includes(t.status)) continue;
    workload[t.assigneeId] = (workload[t.assigneeId] || 0) + 1;
  }

  res.json({
    byStatus,
    unassigned,
    slaBreached: breached,
    slaAtRisk: atRisk,
    workload,
    recent: all.slice(0, 10),
  });
});
