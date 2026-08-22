import { useMemo, useState } from "react";
import { Shell } from "../components/Shell";
import { TicketTable } from "../components/TicketTable";
import { useTickets } from "../lib/store";
import { CATEGORIES, OPEN_STATUSES, PRIORITIES, STATUSES, type Priority, type Status, type Ticket } from "../lib/types";
import { PRIORITY_WEIGHT } from "../lib/utils";
import { cn } from "../lib/utils";

const TABS = ["Open", ...STATUSES, "All"] as const;
type SortKey = "updated" | "priority" | "created";

const PAGE_SIZE = 8;

export default function Tickets() {
  const { tickets } = useTickets();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Open");
  const [category, setCategory] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = tickets
      .filter((t) => {
        if (tab === "All") return true;
        if (tab === "Open") return OPEN_STATUSES.includes(t.status);
        return t.status === (tab as Status);
      })
      .filter((t) => category === "all" || t.category === category)
      .filter((t) => priority === "all" || t.priority === (priority as Priority))
      .filter((t) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          t.subject.toLowerCase().includes(q) ||
          t.ref.toLowerCase().includes(q) ||
          t.requestedBy.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      });

    return [...list].sort((a, b) => {
      if (sort === "priority") return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [tickets, tab, category, priority, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function updateFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  function exportCsv() {
    const header = ["Ref", "Subject", "Category", "Priority", "Status", "Requester", "Created", "Updated"];
    const rows = filtered.map((t: Ticket) => [
      t.ref,
      t.subject,
      t.category,
      t.priority,
      t.status,
      t.requestedBy,
      t.createdAt,
      t.updatedAt,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "helpdesk-tickets.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell title="All Tickets">
      <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Ticket queue</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">All tickets</h1>
          </div>
          <button
            onClick={exportCsv}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-xl2 border border-border bg-panel shadow-glow">
          <div className="space-y-3 border-b border-border bg-panel-soft/50 px-6 py-4">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateFilter(setTab)(t)}
                  className={cn(
                    "pb-1 text-xs transition-colors",
                    tab === t
                      ? "border-b-2 border-accent font-bold text-ink"
                      : "font-medium text-muted hover:text-ink",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={query}
                onChange={(e) => updateFilter(setQuery)(e.target.value)}
                placeholder="Search subject, ID, requester, description..."
                className="w-full min-w-[200px] flex-1 rounded-md border border-border bg-panel px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent"
              />
              <select
                value={category}
                onChange={(e) => updateFilter(setCategory)(e.target.value)}
                className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => updateFilter(setPriority)(e.target.value)}
                className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all">All priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="updated">Sort: Recently updated</option>
                <option value="created">Sort: Newest first</option>
                <option value="priority">Sort: Priority</option>
              </select>
            </div>
          </div>

          <TicketTable tickets={paged} />

          <div className="flex items-center justify-between border-t border-border bg-panel-soft/50 px-6 py-3">
            <span className="text-xs text-muted">
              Showing {filtered.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted disabled:opacity-40 enabled:hover:text-ink"
              >
                Prev
              </button>
              <span className="font-mono text-xs text-faint">
                {pageSafe} / {pageCount}
              </span>
              <button
                disabled={pageSafe >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted disabled:opacity-40 enabled:hover:text-ink"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
