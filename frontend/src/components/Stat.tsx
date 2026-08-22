import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export function Stat({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "good" | "bad" | "warn";
  icon?: ReactNode;
}) {
  const toneClass = tone === "good" ? "text-green" : tone === "bad" ? "text-red" : tone === "warn" ? "text-amber" : "text-faint";
  return (
    <div className="animate-rise rounded-xl2 border border-border bg-panel p-5 shadow-glow">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon ? <span className="text-faint">{icon}</span> : null}
      </div>
      <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p className={cn("mt-2 text-[11px] font-medium", toneClass)}>{note}</p>
    </div>
  );
}
