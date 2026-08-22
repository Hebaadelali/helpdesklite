import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NewTicketInput, Status, Ticket } from "./types";
import { useToast } from "./toast";
import { useAuth } from "./auth";
import { api } from "./api";

type TicketStore = {
  tickets: Ticket[];
  hydrated: boolean;
  createTicket: (input: NewTicketInput) => Promise<Ticket>;
  setStatus: (id: string, status: Status) => Promise<void>;
  setAssignee: (id: string, assigneeId: string | null) => Promise<void>;
  setPriority: (id: string, priority: Ticket["priority"]) => Promise<void>;
  addNote: (id: string, text: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const TicketContext = createContext<TicketStore | null>(null);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    if (!user) {
      setTickets([]);
      return;
    }
    try {
      const data = await api.listTickets();
      setTickets(data);
    } catch (err) {
      toast.push({ tone: "error", title: "Couldn't load tickets", message: err instanceof Error ? err.message : undefined });
    }
  }, [user, toast]);

  useEffect(() => {
    (async () => {
      await refresh();
      setHydrated(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createTicket = useCallback(
    async (input: NewTicketInput) => {
      const ticket = await api.createTicket({
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority,
      });
      // Server-side assignment happens as a follow-up call so the create
      // endpoint stays a single-purpose write (matches the API's shape).
      const finalTicket = input.assigneeId ? await api.assignTicket(ticket.id, input.assigneeId) : ticket;
      setTickets((prev) => [finalTicket, ...prev]);
      toast.push({ tone: "success", title: "Request submitted", message: `${finalTicket.ref} is now in the queue.` });
      return finalTicket;
    },
    [toast],
  );

  const setStatus = useCallback(
    async (id: string, status: Status) => {
      try {
        const updated = await api.setStatus(id, status);
        setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
        toast.push({ tone: "info", title: "Status updated", message: `Moved to ${status}.` });
      } catch (err) {
        toast.push({ tone: "error", title: "Couldn't update status", message: err instanceof Error ? err.message : undefined });
      }
    },
    [toast],
  );

  const setAssignee = useCallback(
    async (id: string, assigneeId: string | null) => {
      try {
        const updated = await api.assignTicket(id, assigneeId);
        setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
        toast.push({
          tone: "info",
          title: assigneeId ? "Owner assigned" : "Owner removed",
          message: assigneeId ? `${updated.assigneeName ?? "Someone"} now owns this ticket.` : "This ticket is unassigned.",
        });
      } catch (err) {
        toast.push({ tone: "error", title: "Couldn't reassign ticket", message: err instanceof Error ? err.message : undefined });
      }
    },
    [toast],
  );

  const setPriority = useCallback(
    async (id: string, priority: Ticket["priority"]) => {
      try {
        const updated = await api.setPriority(id, priority);
        setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } catch (err) {
        toast.push({ tone: "error", title: "Couldn't change priority", message: err instanceof Error ? err.message : undefined });
      }
    },
    [toast],
  );

  const addNote = useCallback(
    async (id: string, text: string) => {
      try {
        const updated = await api.addNote(id, text);
        setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
        toast.push({ tone: "success", title: "Update posted" });
      } catch (err) {
        toast.push({ tone: "error", title: "Couldn't post update", message: err instanceof Error ? err.message : undefined });
      }
    },
    [toast],
  );

  const value = useMemo(
    () => ({ tickets, hydrated, createTicket, setStatus, setAssignee, setPriority, addNote, refresh }),
    [tickets, hydrated, createTicket, setStatus, setAssignee, setPriority, addNote, refresh],
  );

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used inside TicketProvider");
  return ctx;
}
