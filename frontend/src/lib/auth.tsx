import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStaff } from "./staff";
import type { StaffMember } from "./types";
import { api, getToken } from "./api";

type SessionUser = { id: string; email: string; name: string; role: string; staffId: string };

type AuthResult = { ok: true } | { ok: false; error: string };

type AuthApi = {
  user: SessionUser | null;
  staff: StaffMember | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (input: { name: string; email: string; password: string; role: string }) => Promise<AuthResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthApi | null>(null);

/**
 * Auth now lives on the real HelpDesk Lite API (see /helpdesk-lite-backend):
 * passwords are hashed with bcrypt server-side, sessions are JWTs, and every
 * ticket-mutating request is re-checked against the user's role on the
 * server — not just hidden in this UI.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const { staffById, addStaffMember } = useStaff();

  // Registers/finds a local "staff seat" (used by the assignee picker) that
  // mirrors this account, so newly signed-up users can be assigned tickets.
  const ensureStaffSeat = (name: string, role: string, id: string) => {
    const existing = staffById(id);
    if (existing) return existing.id;
    const seat = addStaffMember({ name, role });
    return seat.id;
  };

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (token) {
        try {
          const { user: me } = await api.me();
          const staffId = ensureStaffSeat(me.name, me.role, me.id);
          setUser({ id: me.id, email: me.email, name: me.name, role: me.role, staffId });
        } catch {
          api.logout();
        }
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login: AuthApi["login"] = async (email, password) => {
    if (!email.trim() || !password) return { ok: false, error: "Enter your email and password." };
    try {
      const me = await api.login(email.trim(), password);
      const staffId = ensureStaffSeat(me.name, me.role, me.id);
      setUser({ id: me.id, email: me.email, name: me.name, role: me.role, staffId });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Login failed." };
    }
  };

  const signup: AuthApi["signup"] = async ({ name, email, password }) => {
    const trimmedName = name.trim();
    const normalized = email.trim().toLowerCase();
    if (!trimmedName || !normalized || !password) return { ok: false, error: "Fill in every field." };
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    try {
      const me = await api.register(trimmedName, normalized, password);
      const staffId = ensureStaffSeat(me.name, me.role, me.id);
      setUser({ id: me.id, email: me.email, name: me.name, role: me.role, staffId });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Sign up failed." };
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const staff = user ? staffById(user.staffId) : null;

  return <AuthContext.Provider value={{ user, staff, ready, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
