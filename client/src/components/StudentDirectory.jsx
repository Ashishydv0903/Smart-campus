import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  GraduationCap, 
  Building, 
  Loader2,
  RefreshCw,
  UserX,
  CheckCircle2,
  Filter
} from 'lucide-react';

export default function StudentDirectory({ currentUser }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All' | 'Mismatched' | 'Verified'
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getAuthToken = () => {
    return currentUser?.token || currentUser?.demoToken || localStorage.getItem('smart_campus_token') || '';
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await fetch(`/api/auth/students?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        setErrorMsg(data.message || 'Failed to load students');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to university server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const handleRemoveStudent = async (studentId, studentName, studentEmail) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${studentName} (${studentEmail}) from this college?\n\nThey will be revoked from accessing this portal and submitting grievances.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/auth/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        fetchStudents();
        setTimeout(() => setStatusMsg(''), 4000);
      } else {
        alert(data.message || 'Error removing student');
      }
    } catch (err) {
      alert('Network error while attempting to remove student.');
    }
  };

  const filteredStudents = students.filter(s => {
    if (filterType === 'Mismatched') return s.isMismatchedDomain;
    if (filterType === 'Verified') return !s.isMismatchedDomain;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-blue-600 font-bold uppercase tracking-wider text-[11px]">
          <GraduationCap className="w-4 h-4" />
          <span>Head of Department & Director Administration</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Student & Member Directory — @{currentUser?.institutionDomain}
        </h2>
        <p className="text-slate-600 leading-relaxed text-xs">
          Review registered students in your college. As HOD, you hold the administrative authority to remove any student who belongs to a different college or has submitted improper credentials.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search student by Name, PRN / Roll No, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Registered Students ({students.length})</option>
            <option value="Verified">Verified College Domain</option>
            <option value="Mismatched">Flagged / Foreign Domain Mismatches</option>
          </select>

          <button
            onClick={fetchStudents}
            title="Refresh student list"
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Enrolled Students in @{currentUser?.institutionDomain} ({filteredStudents.length})</span>
          </h3>
          <span className="text-slate-400 text-[11px]">HOD Oversight Active</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p>Loading student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <UserX className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No students match your filter.</p>
            <p className="text-[11px] text-slate-400">All registered students will appear here as they sign up with your college domain.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{student.name}</span>
                    {student.prn && (
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        PRN: {student.prn}
                      </span>
                    )}

                    {/* Domain Verification Badge */}
                    {!student.isMismatchedDomain ? (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Member</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Foreign Domain (@{student.actualEmailDomain})</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Email: <strong className="text-slate-700 font-mono">{student.email}</strong></span>
                    <span>•</span>
                    <span>Dept: <strong className="text-slate-700">{student.department || 'General'}</strong></span>
                    <span>•</span>
                    <span>Zone: <strong className="text-slate-700">{student.campusZone || 'Campus'}</strong></span>
                    <span>•</span>
                    <span>Joined: {new Date(student.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* HOD Action: Remove Student */}
                <div className="flex-shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student._id, student.name, student.email)}
                    title="Remove this student from college portal"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition-colors flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Remove Student</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
