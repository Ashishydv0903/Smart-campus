import React, { useState, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Send, 
  ThumbsUp, 
  Users, 
  Star,
  Check,
  ShieldAlert,
  Printer,
  Camera,
  Calendar,
  Building,
  CheckCircle
} from 'lucide-react';

export default function TicketDetailModal({ 
  ticket, 
  currentUser, 
  onClose, 
  onTechnicianUpdate, 
  onAssignStaff, 
  onVerifyAndClose,
  onDirectorNote 
}) {
  const [techNote, setTechNote] = useState('');
  const [techPhoto, setTechPhoto] = useState('');
  const techPhotoInputRef = useRef(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(ticket.priority);
  const [directorNoteText, setDirectorNoteText] = useState('');
  const [studentFeedback, setStudentFeedback] = useState('');
  const [starRating, setStarRating] = useState(5);

  if (!ticket) return null;

  const isTechnician = currentUser?.role === 'technician';
  const isHead = ['hod', 'director', 'admin'].includes(currentUser?.role);
  const isComplainant = ['student', 'teacher'].includes(currentUser?.role);
  const isReporterOrSubscriber = ticket.reportedBy?.userId === currentUser?._id || 
    ticket.cluster?.subscribers?.some(s => s.userId === currentUser?._id);

  const isPendingVerification = ticket.status === 'Pending_Verification';
  const isResolved = ticket.status === 'Resolved';

  const getStepIndex = (status) => {
    switch (status) {
      case 'Reported': return 0;
      case 'Assigned': return 1;
      case 'In_Progress': return 2;
      case 'Pending_Verification': return 3;
      case 'Resolved': return 4;
      case 'Escalated': return 2;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(ticket.status);

  const steps = [
    { label: 'Submitted', key: 'Reported' },
    { label: 'Staff Assigned', key: 'Assigned' },
    { label: 'In Repair', key: 'In_Progress' },
    { label: 'Inspection', key: 'Pending_Verification' },
    { label: 'Closed', key: 'Resolved' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleTechPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTechPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-5 p-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {ticket.ticketId}
              </span>
              <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {ticket.domain}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                ticket.status === 'Pending_Verification' ? 'bg-amber-100 text-amber-800 font-bold' :
                ticket.status === 'Escalated' ? 'bg-rose-100 text-rose-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {ticket.status === 'Pending_Verification' ? 'Work Done (Needs Verification)' :
                 ticket.status === 'Resolved' ? 'Closed' : ticket.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-2">{ticket.title}</h2>
            <p className="text-xs text-slate-500">
              Reported by {ticket.reportedBy?.name} ({ticket.reportedBy?.role}) • {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handlePrint}
              title="Print Confirmation Slip"
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 text-xs border border-slate-200 bg-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline font-medium">Print Slip</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-200 z-0" />
            {steps.map((st, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={st.key} className="relative z-10 flex flex-col items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isDone 
                      ? 'bg-emerald-600 text-white' 
                      : isCurrent 
                        ? (ticket.status === 'Resolved' ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-blue-600 text-white ring-4 ring-blue-100')
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}>
                    {isDone || (isCurrent && ticket.status === 'Resolved') ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] mt-1.5 text-center font-medium leading-tight ${
                    isCurrent ? 'text-slate-900 font-bold' : isDone ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location & Assigned Staff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-500 font-medium block">Location:</span>
            <p className="text-slate-800 font-semibold flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{ticket.location?.zone} — {ticket.location?.roomOrArea}</span>
            </p>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Assigned Staff:</span>
            <p className="text-slate-800 font-semibold flex items-center gap-1.5 mt-0.5">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>{ticket.assignedTo?.technicianName || 'Not Assigned Yet'}</span>
            </p>
          </div>
        </div>

        {/* Issue Description */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</span>
          <p className="text-xs text-slate-800 bg-white border border-slate-200 p-3 rounded-xl leading-relaxed">
            {ticket.description}
          </p>
        </div>

        {/* Optional Photos */}
        {(ticket.media?.evidencePhotoUrl || ticket.media?.resolutionProofUrl) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {ticket.media?.evidencePhotoUrl && (
              <div>
                <span className="font-semibold text-slate-600 block mb-1">Issue Photo</span>
                <div className="h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={ticket.media.evidencePhotoUrl} alt="Issue photo" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {ticket.media?.resolutionProofUrl && (
              <div>
                <span className="font-semibold text-emerald-700 block mb-1">Repair Proof Photo</span>
                <div className="h-40 rounded-lg overflow-hidden border border-emerald-300 bg-slate-100">
                  <img src={ticket.media.resolutionProofUrl} alt="Repair photo" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Affected Students List (Clean) */}
        {ticket.cluster && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>{ticket.cluster.affectedCount || 1} person(s) waiting for this resolution</span>
            </span>
            <span className="text-slate-400 text-[11px]">Duplicate reports merged</span>
          </div>
        )}

        {/* =============================================================== */}
        {/* ACTION PANEL 1: STUDENT / TEACHER VERIFICATION & CLOSURE        */}
        {/* =============================================================== */}
        {isPendingVerification && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Maintenance Staff Reported: Work Completed
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Staff Note: <em>"{ticket.media?.resolutionNotes || 'Repairs completed on site.'}"</em>
                </p>
                <p className="text-xs text-amber-900 font-semibold mt-1">
                  Did the fix work? As the person who raised or joined this concern, only you can close it.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-slate-700">Satisfaction Rating:</label>
              <div className="flex items-center space-x-1 text-amber-400">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button" onClick={() => setStarRating(s)}>
                    <Star className={`w-4 h-4 ${s <= starRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
                <span className="text-slate-500 ml-2 text-xs">{starRating} / 5 Stars</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Optional feedback (e.g. Working properly now!)..."
                value={studentFeedback}
                onChange={(e) => setStudentFeedback(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => onVerifyAndClose(ticket._id, true, starRating, studentFeedback)}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Yes, Fix Verified — Close Issue</span>
              </button>
              <button
                onClick={() => onVerifyAndClose(ticket._id, false, starRating, studentFeedback)}
                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs rounded-lg transition-colors"
              >
                <span>No, Still Broken — Reopen</span>
              </button>
            </div>
          </div>
        )}

        {/* Already Resolved state display */}
        {isResolved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold">This concern has been verified and closed.</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Feedback: {ticket.verification?.studentFeedback || 'Verified by complainant.'}
              </p>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* ACTION PANEL 2: TECHNICIAN / ELECTRICIAN WORK SUBMISSION        */}
        {/* =============================================================== */}
        {isTechnician && !isResolved && !isPendingVerification && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Technician Repair Actions</span>
            </h4>

            {ticket.status === 'Reported' || ticket.status === 'Assigned' ? (
              <div>
                <button
                  onClick={() => onTechnicianUpdate(ticket._id, 'start')}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Start Working on this Issue
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Repair Work Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Replaced faulty switchboard breaker / Fixed leaking joint"
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Repair Proof Photo (Optional)</label>
                  <input
                    type="file"
                    ref={techPhotoInputRef}
                    accept="image/*"
                    onChange={handleTechPhotoUpload}
                    className="hidden"
                  />
                  {!techPhoto ? (
                    <button
                      type="button"
                      onClick={() => techPhotoInputRef.current?.click()}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>Take Photo or Upload Repair Proof</span>
                    </button>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100">
                      <img src={techPhoto} alt="Repair proof" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setTechPhoto('')}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onTechnicianUpdate(ticket._id, 'complete', techNote, techPhoto)}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Work Done (Send to Student for Verification)</span>
                </button>

                {/* Explicit lock notice for technicians */}
                <div className="p-2 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>
                    Note: Technicians cannot close tickets. The student/teacher must inspect and close it.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* ACTION PANEL 3: HOD & DIRECTOR CONTROLS                         */}
        {/* =============================================================== */}
        {isHead && !isResolved && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wide">
              {currentUser.role === 'director' ? 'Campus Director Actions' : 'HOD Department Actions'}
            </h4>

            {/* Assign Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Assign Technician Name..."
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="sm:col-span-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
              />
              <button
                onClick={() => onAssignStaff(ticket._id, selectedStaff, selectedPriority)}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Assign Staff
              </button>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-slate-600">Set Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 text-xs"
              >
                <option value="P1">🚨 Urgent / Safety Hazard</option>
                <option value="P2">⚠️ High Priority</option>
                <option value="P3">Normal Priority</option>
                <option value="P4">Low</option>
              </select>
              <button
                onClick={() => onAssignStaff(ticket._id, ticket.assignedTo?.technicianName, selectedPriority)}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium"
              >
                Update Priority
              </button>
            </div>

            {/* Director Official Directive */}
            {currentUser.role === 'director' && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <input
                  type="text"
                  placeholder="Director directive (e.g. Emergency funds approved, vendor called)..."
                  value={directorNoteText}
                  onChange={(e) => setDirectorNoteText(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
                />
                <button
                  onClick={() => onDirectorNote(ticket._id, directorNoteText)}
                  className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
                >
                  Record Director Directive
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
