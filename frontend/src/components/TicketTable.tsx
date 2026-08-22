import { Link } from "react-router-dom";
import { useStaff } from "../lib/staff";
import type { Ticket } from "../lib/types";
import { relativeTime } from "../lib/utils";
import { Avatar, PriorityRail, PriorityTag, SlaPill, StatusBadge } from "./Badges";
import { EmptyState } from "./EmptyState";

export function TicketTable({ tickets, dense = false }: { tickets: Ticket[]; dense?: boolean }) {
  const { staffById } = useStaff();

  if (tickets.length === 0) {
    return <EmptyState title="No tickets here" note="Nothing matches these filters yet." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-panel-soft/60 font-mono text-[10px] uppercase tracking-wider text-faint">
            <th className="w-1" />
            <th className="px-4 py-3">Ref</th>
            <th className="px-4 py-3">Request</th>
            <th className="px-4 py-3">Status</th>
            {!dense && <th className="px-4 py-3">SLA</th>}
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Requester</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tickets.map((ticket) => {
            const assignee = staffById(ticket.assigneeId);
            return (
              <tr key={ticket.id} className="group transition-colors hover:bg-panel-soft/60">
                <td className="pl-4">
                  <PriorityRail priority={ticket.priority} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-faint">#{ticket.ref}</td>
                <td className="px-4 py-3.5">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="font-medium text-ink group-hover:text-accent group-hover:underline"
                  >
                    {ticket.subject}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-faint">
                    {ticket.category}
                    <PriorityTag priority={ticket.priority} className="ml-1" />
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={ticket.status} />
                </td>
                {!dense && (
                  <td className="px-4 py-3.5">
                    <SlaPill ticket={ticket} />
                  </td>
                )}
                <td className="px-4 py-3.5">
                  {assignee ? (
                    <span className="flex items-center gap-2">
                      <Avatar initials={assignee.initials} />
                      <span className="text-xs text-ink">{assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] italic text-faint">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs text-muted">{ticket.requestedBy}</td>
                <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-faint">{relativeTime(ticket.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
