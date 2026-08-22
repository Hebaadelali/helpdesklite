import type { Category, Priority, Status, Ticket } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "helpdesk-lite-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export type ApiUser = { id: string; name: string; email: string; role: string; initials: string };

export const api = {
  async login(email: string, password: string) {
    const data = await request<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async register(name: string, email: string, password: string) {
    const data = await request<{ token: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  logout() {
    clearToken();
  },

  me() {
    return request<{ user: ApiUser }>("/auth/me");
  },

  suggestPriority(input: { subject: string; description: string }) {
    return request<{ priority: Priority; category: Category; reason: string; source: string }>("/tickets/suggest", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  createTicket(input: { subject: string; description: string; category: Category; priority: Priority }) {
    return request<Ticket>("/tickets", { method: "POST", body: JSON.stringify(input) });
  },

  listTickets(filters: Record<string, string> = {}) {
    const qs = new URLSearchParams(filters).toString();
    return request<Ticket[]>(`/tickets${qs ? `?${qs}` : ""}`);
  },

  getTicket(id: string) {
    return request<Ticket>(`/tickets/${id}`);
  },

  assignTicket(id: string, assigneeId: string | null) {
    return request<Ticket>(`/tickets/${id}/assign`, { method: "PATCH", body: JSON.stringify({ assigneeId }) });
  },

  setStatus(id: string, status: Status) {
    return request<Ticket>(`/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },

  setPriority(id: string, priority: Priority) {
    return request<Ticket>(`/tickets/${id}/priority`, { method: "PATCH", body: JSON.stringify({ priority }) });
  },

  addNote(id: string, text: string) {
    return request<Ticket>(`/tickets/${id}/notes`, { method: "POST", body: JSON.stringify({ text }) });
  },

  getDashboard() {
    return request<{
      byStatus: Record<string, number>;
      unassigned: number;
      slaBreached: number;
      slaAtRisk: number;
      workload: Record<string, number>;
      recent: Ticket[];
    }>("/tickets/meta/dashboard");
  },
};
