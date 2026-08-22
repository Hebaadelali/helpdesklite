import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTickets } from "../lib/store";
import { OPEN_STATUSES } from "../lib/types";
import { initialsFromName } from "../lib/utils";
import { Avatar } from "./Badges";
import { cn } from "../lib/utils";

const NAV = [
  { to: "/", label: "Dispatch", icon: RadarIcon },
  { to: "/tickets", label: "All Tickets", icon: ListIcon },
  { to: "/assigned", label: "Assigned to Me", icon: UserIcon },
  { to: "/categories", label: "Categories", icon: GridIcon },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { tickets } = useTickets();
  const { user, staff, logout } = useAuth();
  const navigate = useNavigate();
  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status)).length;
  const displayName = staff?.name ?? user?.name ?? "Guest";
  const displayRole = staff?.role ?? user?.email ?? "";
  const initials = staff?.initials ?? (user?.name ? initialsFromName(user.name) : "?");

  const handleLogout = () => {
    logout();
    navigate("/login");
    onNavigate?.();
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink">
          <SignalIcon />
        </span>
        <div>
          <p className="font-display text-[15px] font-semibold leading-none tracking-tight">HelpDesk Lite</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-faint">Support console</p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center justify-between rounded-lg border border-border bg-panel-soft px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Queue live</span>
        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-accent">
          <span className="size-1.5 animate-pulseDot rounded-full bg-accent" />
          {open}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-panel-soft hover:text-ink",
              )
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar initials={initials} className="size-9 text-[11px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{displayName}</p>
            <p className="truncate text-[10px] text-faint">{displayRole}</p>
          </div>
          <button
            onClick={handleLogout}
            className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted transition-colors hover:border-red hover:text-red"
            aria-label="Log out"
            title="Log out"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}

function iconProps() {
  return { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;
}

function SignalIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16 L9 8 L13 14 L20 5" />
      <circle cx="20" cy="5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function RadarIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" strokeOpacity="0.5" />
      <path d="M12 12 L18 8" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg {...iconProps()} strokeLinecap="round">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={2.4} />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
      <path d="M10 12h11M17.5 8.5 21 12l-3.5 3.5" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg {...iconProps()}>
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.4" />
    </svg>
  );
}
