// Kept identical to src/lib/types.ts on the frontend so both sides agree.

export const ROLES = ["Employee", "Support Agent", "Manager"];

export const STATUSES = ["New", "In Progress", "Pending", "Resolved", "Closed"];
export const OPEN_STATUSES = ["New", "In Progress", "Pending"];

export const CATEGORIES = [
  "Technical / Network",
  "Hardware / IT Support",
  "Permissions / Access",
  "Software / Accounts",
  "Facilities",
  "HR / People",
];

export const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

export const SLA_HOURS = {
  Urgent: 4,
  High: 8,
  Normal: 24,
  Low: 72,
};

export function computeSlaDeadline(priority, fromDate = new Date()) {
  const hours = SLA_HOURS[priority] ?? SLA_HOURS.Normal;
  const deadline = new Date(fromDate.getTime() + hours * 60 * 60 * 1000);
  return deadline.toISOString();
}

export function slaState(ticket, now = new Date()) {
  if (ticket.status === "Resolved" || ticket.status === "Closed") return "met";
  const deadline = new Date(ticket.slaDeadline).getTime();
  const remainingMs = deadline - now.getTime();
  if (remainingMs < 0) return "breached";
  if (remainingMs < 2 * 60 * 60 * 1000) return "at_risk"; // < 2h left
  return "on_track";
}
