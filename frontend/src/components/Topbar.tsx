import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTickets } from "../lib/store";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar({
  title,
  action = true,
  onOpenMenu,
}: {
  title: string;
  action?: boolean;
  onOpenMenu?: () => void;
}) {
  const { tickets } = useTickets();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = query.trim()
    ? tickets
        .filter(
          (t) =>
            t.subject.toLowerCase().includes(query.toLowerCase()) ||
            t.ref.toLowerCase().includes(query.toLowerCase()) ||
            t.requestedBy.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-panel px-4 sm:px-8">
      <button
        onClick={onOpenMenu}
        className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted hover:text-ink lg:hidden"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="hidden shrink-0 font-display text-sm font-semibold uppercase tracking-wider text-muted sm:block">
        {title}
      </h1>

      <div className="relative ml-auto w-full max-w-xs">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="Search tickets, requesters..."
          className="w-full rounded-md border border-border bg-panel-soft px-3 py-1.5 pl-8 text-xs outline-none placeholder:text-faint focus:ring-1 focus:ring-accent"
        />
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" strokeLinecap="round" />
        </svg>
        {focused && results.length > 0 ? (
          <div className="absolute right-0 top-11 z-20 w-80 overflow-hidden rounded-lg border border-border bg-panel shadow-glow">
            {results.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  navigate(`/tickets/${t.id}`);
                  setQuery("");
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left last:border-0 hover:bg-panel-soft"
              >
                <span className="font-mono text-[10px] text-faint">#{t.ref}</span>
                <span className="truncate text-xs font-medium">{t.subject}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <ThemeToggle />

      {action ? (
        <Link
          to="/new"
          className="shrink-0 rounded-md bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink shadow-sm transition-opacity hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
        >
          New Ticket
        </Link>
      ) : null}
    </header>
  );
}
