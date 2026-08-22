import { Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { StatusBadge } from "../components/Badges";
import { CATEGORIES, OPEN_STATUSES } from "../lib/types";
import { useTickets } from "../lib/store";
import { relativeTime } from "../lib/utils";

export default function Categories() {
  const { tickets } = useTickets();

  return (
    <Shell title="Categories">
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Request breakdown</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Categories</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {CATEGORIES.map((category) => {
            const inCategory = tickets.filter((t) => t.category === category);
            const open = inCategory.filter((t) => OPEN_STATUSES.includes(t.status));
            const share = tickets.length ? Math.round((inCategory.length / tickets.length) * 100) : 0;
            return (
              <section key={category} className="rounded-xl2 border border-border bg-panel p-6 shadow-glow">
                <div className="mb-1 flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold">{category}</h2>
                  <span className="font-mono text-xs text-faint">
                    {open.length} open / {inCategory.length} total
                  </span>
                </div>
                <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-panel-soft">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
                </div>
                {inCategory.length === 0 ? (
                  <p className="text-xs text-faint">No requests in this category yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {inCategory.slice(0, 4).map((ticket) => (
                      <li key={ticket.id} className="flex items-center justify-between gap-4 py-2.5">
                        <Link to={`/tickets/${ticket.id}`} className="truncate text-xs font-medium hover:text-accent">
                          {ticket.subject}
                        </Link>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[10px] text-faint">{relativeTime(ticket.updatedAt)}</span>
                          <StatusBadge status={ticket.status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
