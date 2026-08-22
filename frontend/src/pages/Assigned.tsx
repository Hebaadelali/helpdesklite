import { Shell } from "../components/Shell";
import { TicketTable } from "../components/TicketTable";
import { useAuth } from "../lib/auth";
import { useTickets } from "../lib/store";
import { OPEN_STATUSES } from "../lib/types";
import { slaState } from "../lib/utils";

export default function Assigned() {
  const { tickets } = useTickets();
  const { staff, user } = useAuth();
  const mine = tickets.filter((t) => t.assigneeId === staff?.id);
  const open = mine.filter((t) => OPEN_STATUSES.includes(t.status));
  const done = mine.filter((t) => !OPEN_STATUSES.includes(t.status));
  const breached = open.filter((t) => slaState(t) === "breached").length;
  const firstName = (staff?.name ?? user?.name ?? "").split(" ")[0];

  return (
    <Shell title="Assigned to Me">
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Personal queue</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Assigned to {firstName}</h1>
          <p className="mt-1 text-sm text-muted">
            {open.length} open{breached ? `, ${breached} past SLA` : ""}.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl2 border border-border bg-panel shadow-glow">
          <div className="border-b border-border bg-panel-soft/50 px-6 py-4 font-display text-xs font-bold uppercase tracking-widest text-muted">
            Open — {open.length}
          </div>
          <TicketTable tickets={open} />
        </section>
        <section className="overflow-hidden rounded-xl2 border border-border bg-panel shadow-glow">
          <div className="border-b border-border bg-panel-soft/50 px-6 py-4 font-display text-xs font-bold uppercase tracking-widest text-muted">
            Resolved &amp; closed — {done.length}
          </div>
          <TicketTable tickets={done} dense />
        </section>
      </div>
    </Shell>
  );
}
