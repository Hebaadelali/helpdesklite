import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { StaffMember } from "./types";
import { genId, initialsFromName } from "./utils";

const STORAGE_KEY = "helpdesk-lite-staff";

export const SEED_STAFF: StaffMember[] = [
  { id: "sj", name: "Sarah Jenkins", initials: "SJ", role: "Support Manager" },
  { id: "mk", name: "Mike Kowalski", initials: "MK", role: "Support Engineer" },
  { id: "dw", name: "David Wu", initials: "DW", role: "Support Engineer" },
  { id: "ap", name: "Amira Patel", initials: "AP", role: "IT Operations" },
];

type StaffApi = {
  staff: StaffMember[];
  staffById: (id: string | null | undefined) => StaffMember | null;
  addStaffMember: (input: { name: string; role: string }) => StaffMember;
};

const StaffContext = createContext<StaffApi | null>(null);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    if (typeof window === "undefined") return SEED_STAFF;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StaffMember[]) : SEED_STAFF;
    } catch {
      return SEED_STAFF;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
    } catch {
      /* storage unavailable */
    }
  }, [staff]);

  const staffById = useCallback((id: string | null | undefined) => (id ? staff.find((s) => s.id === id) ?? null : null), [staff]);

  const addStaffMember = useCallback((input: { name: string; role: string }) => {
    const member: StaffMember = {
      id: genId("s"),
      name: input.name,
      initials: initialsFromName(input.name),
      role: input.role,
    };
    setStaff((prev) => [...prev, member]);
    return member;
  }, []);

  const value = useMemo(() => ({ staff, staffById, addStaffMember }), [staff, staffById, addStaffMember]);

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside StaffProvider");
  return ctx;
}
