import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { genId } from "./utils";

type Tone = "success" | "info" | "error";

type ToastInput = { tone: Tone; title: string; message?: string };
type ToastItem = ToastInput & { id: string };

type ToastApi = { push: (t: ToastInput) => void };

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLES: Record<Tone, string> = {
  success: "border-l-green",
  info: "border-l-accent",
  error: "border-l-red",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((t: ToastInput) => {
    const id = genId("toast");
    setItems((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 3600);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`animate-slideIn pointer-events-auto rounded-lg border border-border border-l-[3px] bg-panel px-4 py-3 shadow-glow ${TONE_STYLES[item.tone]}`}
          >
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            {item.message ? <p className="mt-0.5 text-xs text-muted">{item.message}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
