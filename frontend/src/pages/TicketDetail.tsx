import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { Avatar, PriorityTag, SlaPill, StatusBadge } from "../components/Badges";
import { EmptyState } from "../components/EmptyState";
import { useStaff } from "../lib/staff";
import { useTickets } from "../lib/store";
import { PRIORITIES, STATUSES, type Priority, type Status } from "../lib/types";
import { cn, fullTimestamp, relativeTime } from "../lib/utils";

const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted";
const fieldClass =
  "w-full rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent";

export default function TicketDetail() {
  const { ticketId = "" } = useParams();
  const navigate = useNavigate();
  const { tickets, setStatus, setAssignee, setPriority, addNote } = useTickets();
  const { staff, staffById } = useStaff();
  const [note, setNote] = useState("");

  const ticket = tickets.find((t) => t.id === ticketId);

  if (!ticket) {
    return (
      <Shell title="Ticket Detail" action={false}>
        <div className="p-8">
          <EmptyState title="That ticket no longer exists" note="It may have been removed from the queue." />
          <div className="mt-2 text-center">
            <Link to="/tickets" className="text-xs font-medium text-accent hover:underline">
              ← Back to all tickets
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const assignee = staffById(ticket.assigneeId);
  const currentStep = STATUSES.indexOf(ticket.status);

  function onNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim() || !ticket) return;
    addNote(ticket.id, note.trim());
    setNote("");
  }

  return (
    <Shell title={`Ticket #${ticket.ref}`} action={false}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-5 sm:p-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <button
            onClick={() => navigate("/tickets")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-accent"
          >
            ← Back to all tickets
          </button>

          <section className="rounded-xl2 border border-border bg-panel p-6 shadow-glow">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] text-faint">
                  #{ticket.ref} · {ticket.category}
                </p>
                <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">{ticket.subject}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PriorityTag priority={ticket.priority} />
                  <SlaPill ticket={ticket} />
                </div>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <ol className="mb-6 flex items-center">
              {STATUSES.map((s, i) => (
                <li key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={cn("size-3 rounded-full", i <= currentStep ? "bg-accent" : "border-2 border-border bg-panel")} />
                    <span className={cn("whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide", i <= currentStep ? "text-ink" : "text-faint")}>
                      {s}
                    </span>
                  </div>
                  {i < STATUSES.length - 1 ? (
                    <span className={cn("mx-2 -mt-5 h-px flex-1", i < currentStep ? "bg-accent" : "bg-border")} />
                  ) : null}
                </li>
              ))}
            </ol>

            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">{ticket.description}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-faint">Requested by</dt>
                <dd className="mt-1 font-medium">{ticket.requestedBy}</dd>
              </div>
              <div>
                <dt className="text-faint">Priority</dt>
                <dd className="mt-1 font-medium">{ticket.priority}</dd>
              </div>
              <div>
                <dt className="text-faint">Created</dt>
                <dd className="mt-1 font-medium" title={fullTimestamp(ticket.createdAt)}>
                  {relativeTime(ticket.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-faint">Last update</dt>
                <dd className="mt-1 font-medium" title={fullTimestamp(ticket.updatedAt)}>
                  {relativeTime(ticket.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl2 border border-border bg-panel p-6 shadow-glow">
            <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-muted">Activity</h2>
            <ol className="space-y-4">
              {ticket.history
                .slice()
                .reverse()
                .map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className={cn("mt-1.5 h-full w-0.5 shrink-0 rounded-full", event.kind === "note" ? "bg-accent" : "bg-border")} />
                    <div>
                      <p className="text-sm">{event.text}</p>
                      <p className="mt-0.5 text-[11px] text-faint">
                        {event.actor} · {relativeTime(event.at)}
                      </p>
                    </div>
                  </li>
                ))}
            </ol>

            <form onSubmit={onNote} className="mt-6 border-t border-border pt-6">
              <label className={labelClass} htmlFor="note">
                Add an update
              </label>
              <textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Share progress or ask the requester for details..."
                className={fieldClass}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!note.trim()}
                  className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Post update
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl2 border border-border bg-panel p-6 shadow-glow">
            <label className={labelClass} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              value={ticket.status}
              onChange={(e) => setStatus(ticket.id, e.target.value as Status)}
              className={fieldClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className={cn(labelClass, "mt-5")} htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              value={ticket.priority}
              onChange={(e) => setPriority(ticket.id, e.target.value as Priority)}
              className={fieldClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <label className={cn(labelClass, "mt-5")} htmlFor="assignee">
              Owner
            </label>
            <select
              id="assignee"
              value={ticket.assigneeId ?? ""}
              onChange={(e) => setAssignee(ticket.id, e.target.value || null)}
              className={fieldClass}
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {assignee ? (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-panel-soft px-3 py-2">
                <Avatar initials={assignee.initials} />
                <div className="text-xs">
                  <p className="font-medium">{assignee.name}</p>
                  <p className="text-faint">{assignee.role}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-md bg-panel-soft px-3 py-2 text-[11px] italic text-faint">
                No owner yet — assign someone so this doesn't stall.
              </p>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
