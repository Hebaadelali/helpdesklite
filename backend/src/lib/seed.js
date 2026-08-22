import "dotenv/config";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "./db.js";
import { computeSlaDeadline } from "./constants.js";

function upsertUser({ name, email, password, role }) {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return existing.id;
  const id = nanoid();
  const initials = name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  db.prepare(
    "INSERT INTO users (id, name, email, passwordHash, role, initials) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, name, email, bcrypt.hashSync(password, 10), role, initials);
  return id;
}

const DEMO_PASSWORD = "HelpDeskDemo@2026!";

const employeeId = upsertUser({ name: "Demo Employee", email: "demo.employee@helpdesklite.local", password: DEMO_PASSWORD, role: "Employee" });
const agentId = upsertUser({ name: "Demo Agent", email: "demo.agent@helpdesklite.local", password: DEMO_PASSWORD, role: "Support Agent" });
upsertUser({ name: "Demo Manager", email: "demo.manager@helpdesklite.local", password: DEMO_PASSWORD, role: "Manager" });

const ticketCount = db.prepare("SELECT COUNT(*) AS n FROM tickets").get().n;
if (ticketCount === 0) {
  const samples = [
    { subject: "Can't connect to office Wi-Fi", description: "I can't connect to the company Wi-Fi and I have a meeting in 30 minutes.", category: "Technical / Network", priority: "Urgent" },
    { subject: "Need access to shared drive", description: "Please grant me access to the Marketing shared drive.", category: "Permissions / Access", priority: "Normal" },
    { subject: "Laptop battery not charging", description: "My laptop battery stopped charging since yesterday.", category: "Hardware / IT Support", priority: "High" },
  ];
  const now = new Date();
  for (const [i, s] of samples.entries()) {
    const id = nanoid();
    db.prepare(
      `INSERT INTO tickets (id, ref, subject, description, category, priority, status, assigneeId, requestedById, createdAt, updatedAt, resolvedAt, slaDeadline)
       VALUES (?, ?, ?, ?, ?, ?, 'New', ?, ?, ?, ?, NULL, ?)`
    ).run(id, `HD-${1001 + i}`, s.subject, s.description, s.category, s.priority, i === 0 ? agentId : null, employeeId, now.toISOString(), now.toISOString(), computeSlaDeadline(s.priority, now));
    db.prepare("INSERT INTO ticket_events (id, ticketId, actor, text, kind) VALUES (?, ?, ?, ?, 'system')").run(
      nanoid(), id, "Demo Employee", `Ticket created (${s.priority} priority).`
    );
  }
  console.log("Seeded 3 sample tickets.");
}

console.log("Seed complete. Demo accounts (password: " + DEMO_PASSWORD + "):");
console.log("  Employee:      demo.employee@helpdesklite.local");
console.log("  Support Agent: demo.agent@helpdesklite.local");
console.log("  Manager:       demo.manager@helpdesklite.local");
