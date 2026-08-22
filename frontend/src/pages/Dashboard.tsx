import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shell } from "../components/Shell";
import { Stat } from "../components/Stat";
import { QueueMeter } from "../components/QueueMeter";
import { TicketTable } from "../components/TicketTable";
import { useStaff } from "../lib/staff";
import { useTickets } from "../lib/store";
import { CATEGORIES, OPEN_STATUSES } from "../lib/types";
import { slaState } from "../lib/utils";

export default function Dashboard() {
  const { tickets } = useTickets();
  const { staff } = useStaff();

  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status));
  const unassigned = open.filter((t) => !t.assigneeId);
  const breached = open.filter((t) => slaState(t) === "breached");
  const resolved = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed");
  const recent = [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  const workload = staff.map((s) => ({
    name: s.name.split(" ")[0],
    open: open.filter((t) => t.assigneeId === s.id).length,
  }));

  const byCategory = CATEGORIES.map((c) => ({
    name: c.split(" / ")[0],
    count: tickets.filter((t) => t.category === c).length,
  }));

  return (
    <Shell title="Dispatch">
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Live overview</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Today's queue at a glance</h1>
          <p className="mt-1 text-sm text-muted">
            {open.length} open request{open.length === 1 ? "" : "s"}
            {breached.length ? `, ${breached.length} past their SLA target` : ", all within SLA"}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Open tickets" value={String(open.length)} note="Across all categories" />
          <Stat
            label="Unassigned"
            value={String(unassigned.length)}
            note={unassigned.length ? "Needs an owner" : "All requests owned"}
            tone={unassigned.length ? "warn" : "good"}
          />
          <Stat
            label="SLA breached"
            value={String(breached.length)}
            note={breached.length ? "Needs attention now" : "Nothing overdue"}
            tone={breached.length ? "bad" : "good"}
          />
          <Stat label="Resolved / Closed" value={String(resolved.length)} note="Completed requests" tone="good" />
        </div>

        <QueueMeter tickets={tickets} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl2 border border-border bg-panel p-6 shadow-glow">
            <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-muted">
              Open workload by owner
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={workload} layout="vertical" margin={{ left: 4, right: 12 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--panel-soft)" }}
                  contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="open" radius={[0, 4, 4, 0]} fill="var(--accent)" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl2 border border-border bg-panel p-6 shadow-glow">
            <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-muted">Requests by category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byCategory} margin={{ left: -18 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} interval={0} angle={-18} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--panel-soft)" }}
                  contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={22}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "var(--accent)" : "var(--violet)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl2 border border-border bg-panel shadow-glow">
          <div className="flex items-center justify-between border-b border-border bg-panel-soft/50 px-6 py-4">
            <span className="font-display text-xs font-bold uppercase tracking-widest text-muted">Recent activity</span>
            <Link to="/tickets" className="text-xs font-medium text-accent hover:underline">
              View all tickets →
            </Link>
          </div>
          <TicketTable tickets={recent} dense />
        </div>
      </div>
    </Shell>
  );
}
