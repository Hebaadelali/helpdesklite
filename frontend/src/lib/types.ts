export const STATUSES = ["New", "In Progress", "Pending", "Resolved", "Closed"] as const;
export type Status = (typeof STATUSES)[number];

export const OPEN_STATUSES: Status[] = ["New", "In Progress", "Pending"];

export const CATEGORIES = [
  "Technical / Network",
  "Hardware / IT Support",
  "Permissions / Access",
  "Software / Accounts",
  "Facilities",
  "HR / People",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

// SLA target, in hours, before a ticket at this priority is considered at risk / breached.
export const SLA_HOURS: Record<Priority, number> = {
  Urgent: 4,
  High: 8,
  Normal: 24,
  Low: 72,
};

export type StaffMember = {
  id: string;
  name: string;
  initials: string;
  role: string;
};

export type TicketEvent = {
  id: string;
  at: string;
  actor: string;
  text: string;
  kind: "system" | "note";
};

export type Ticket = {
  id: string;
  ref: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  assigneeId: string | null;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  history: TicketEvent[];
  /** Populated by the API; the current assignee's display name, if any. */
  assigneeName?: string | null;
};

export type NewTicketInput = {
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  requestedBy: string;
  assigneeId: string | null;
};
