import type { Priority, Status, Ticket } from "../lib/types";
import { cn, slaLabel, slaState } from "../lib/utils";

export const STATUS_DOT: Record<Status, string> = {
  New: "bg-accent",
  "In Progress": "bg-violet",
  Pending: "bg-amber",
  Resolved: "bg-green",
  Closed: "bg-faint",
};

export const STATUS_TEXT: Record<Status, string> = {
  New: "text-accent",
  "In Progress": "text-violet",
  Pending: "text-amber",
  Resolved: "text-green",
  Closed: "text-faint",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_TEXT[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {status}
    </span>
  );
}

const PRIORITY_STYLES: Record<Priority, string> = {
  Urgent: "text-red border-red/30 bg-red/10",
  High: "text-amber border-amber/30 bg-amber/10",
  Normal: "text-muted border-border bg-panel-soft",
  Low: "text-faint border-border bg-panel-soft",
};

export function PriorityTag({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}

export function PriorityRail({ priority }: { priority: Priority }) {
  const color =
    priority === "Urgent" ? "bg-red" : priority === "High" ? "bg-amber" : priority === "Normal" ? "bg-violet/60" : "bg-faint";
  return <span className={cn("inline-block h-6 w-1 shrink-0 rounded-full", color)} aria-hidden />;
}

export function Avatar({ initials, className, title }: { initials: string; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full border border-border bg-panel-soft font-mono text-[9px] font-semibold text-muted",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function SlaPill({ ticket }: { ticket: Ticket }) {
  const state = slaState(ticket);
  const styles =
    state === "breached"
      ? "text-red bg-red/10 border-red/30"
      : state === "at-risk"
        ? "text-amber bg-amber/10 border-amber/30"
        : state === "done"
          ? "text-green bg-green/10 border-green/30"
          : "text-muted bg-panel-soft border-border";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px]", styles)}>
      {state === "at-risk" || state === "breached" ? (
        <span className={cn("size-1.5 rounded-full", state === "breached" ? "bg-red" : "bg-amber", "animate-pulseDot")} />
      ) : null}
      {slaLabel(ticket)}
    </span>
  );
}
