import React from 'react';
import { 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ThumbsUp, 
  Wrench,
  AlertCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  Reported: { label: 'Open', class: 'bg-slate-100 text-slate-700 border-slate-200' },
  Assigned: { label: 'Staff Assigned', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  In_Progress: { label: 'In Progress', class: 'bg-sky-50 text-sky-700 border-sky-200' },
  Pending_Verification: { label: 'Work Done (Awaiting Verification)', class: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse' },
  Resolved: { label: 'Verified & Closed', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Escalated: { label: 'Overdue - Escalated', class: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' }
};

const PRIORITY_CONFIG = {
  P1: { label: 'Urgent / Hazard', class: 'text-rose-700 bg-rose-50 border-rose-200 font-bold' },
  P2: { label: 'High Priority', class: 'text-amber-800 bg-amber-50 border-amber-200 font-semibold' },
  P3: { label: 'Normal', class: 'text-slate-600 bg-slate-50 border-slate-200' },
  P4: { label: 'Low', class: 'text-slate-500 bg-slate-50 border-slate-200' }
};

export default function TicketCard({ ticket, currentUser, onSelect, onUpvote }) {
  const statusInfo = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.Reported;
  const priorityInfo = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.P3;
  const hasUpvoted = ticket.cluster?.subscribers?.some(s => s.userId === currentUser?._id || s.email === currentUser?.email);
  const isReporter = ticket.reportedBy?.userId === currentUser?._id;

  const isPendingVerification = ticket.status === 'Pending_Verification';
  const isComplainant = ['student', 'teacher'].includes(currentUser?.role);

  return (
    <div 
      onClick={() => onSelect(ticket)}
      className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer flex flex-col justify-between ${
        isPendingVerification && isReporter
          ? 'border-amber-400 ring-2 ring-amber-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Verification banner for complainant */}
        {isPendingVerification && (isReporter || hasUpvoted) && (
          <div className="mb-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Repair reported done. Please verify and close!</span>
            </span>
            <span className="text-[11px] underline font-bold">Review</span>
          </div>
        )}

        {/* Top line: Category, Priority, Status */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {ticket.ticketId}
            </span>
            <span className="font-medium text-slate-700">
              {ticket.domain}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${priorityInfo.class}`}>
              {priorityInfo.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${statusInfo.class}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-1 hover:text-blue-600">
          {ticket.title}
        </h3>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>

        {/* Location & Reported By */}
        <div className="mt-3 text-xs text-slate-500 space-y-1">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{ticket.location?.zone} • {ticket.location?.roomOrArea}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Reported by: <span className="text-slate-600 font-medium">{ticket.reportedBy?.name}</span> ({ticket.reportedBy?.role})
          </div>
        </div>
      </div>

      {/* Footer: Affected count & Staff assignment */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {/* People waiting / Me too button */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{ticket.cluster?.affectedCount || 1} person(s) waiting</span>
          </span>

          {isComplainant && !hasUpvoted && ticket.status !== 'Resolved' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpvote(ticket._id);
              }}
              title="I have this problem too"
              className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 font-medium transition-colors"
            >
              +1 Me Too
            </button>
          )}
        </div>

        {/* Assigned Staff */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Wrench className="w-3 h-3 text-slate-400" />
          <span className="truncate max-w-[120px]">
            {ticket.assignedTo?.technicianName || 'Unassigned'}
          </span>
        </div>
      </div>
    </div>
  );
}
