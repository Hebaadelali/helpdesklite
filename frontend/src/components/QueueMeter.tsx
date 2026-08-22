import { STATUSES, type Ticket } from "../lib/types";
import { STATUS_DOT, STATUS_TEXT } from "./Badges";

export function QueueMeter({ tickets }: { tickets: Ticket[] }) {
  const total = tickets.length || 1;
  const counts = STATUSES.map((status) => ({
    status,
    count: tickets.filter((t) => t.status === status).length,
  }));

  return (
    <div className="rounded-xl2 border border-border bg-panel p-6 shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted">Queue health</h2>
        <span className="font-mono text-[10px] text-faint">{tickets.length} total tickets</span>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-panel-soft">
        {counts.map(({ status, count }) =>
          count === 0 ? null : (
            <div
              key={status}
              className={`${STATUS_DOT[status]} h-full transition-all first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${status}: ${count}`}
            />
          ),
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
            <div>
              <p className={`font-mono text-sm font-semibold ${STATUS_TEXT[status]}`}>{count}</p>
              <p className="text-[10px] text-faint">{status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
