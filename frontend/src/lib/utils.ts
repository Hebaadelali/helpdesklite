import { SLA_HOURS, type Priority, type Ticket } from "./types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ago(mins: number) {
  return new Date(Date.now() - mins * 60000).toISOString();
}

export function fullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type SlaState = "ok" | "at-risk" | "breached" | "done";

/** Hours remaining before SLA breach; negative once breached. */
export function slaHoursRemaining(ticket: Ticket): number {
  const budgetMs = SLA_HOURS[ticket.priority] * 3600_000;
  const elapsedMs = Date.now() - new Date(ticket.createdAt).getTime();
  return (budgetMs - elapsedMs) / 3600_000;
}

export function slaState(ticket: Ticket): SlaState {
  if (ticket.status === "Resolved" || ticket.status === "Closed") return "done";
  const remaining = slaHoursRemaining(ticket);
  if (remaining < 0) return "breached";
  if (remaining < SLA_HOURS[ticket.priority] * 0.25) return "at-risk";
  return "ok";
}

export function slaLabel(ticket: Ticket): string {
  const state = slaState(ticket);
  if (state === "done") return "SLA met";
  const remaining = slaHoursRemaining(ticket);
  if (state === "breached") {
    const over = Math.abs(remaining);
    return over < 1 ? `Breached ${Math.round(over * 60)}m ago` : `Breached ${Math.round(over)}h ago`;
  }
  return remaining < 1 ? `${Math.round(remaining * 60)}m left` : `${Math.round(remaining)}h left`;
}

export const PRIORITY_WEIGHT: Record<Priority, number> = { Urgent: 3, High: 2, Normal: 1, Low: 0 };

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
