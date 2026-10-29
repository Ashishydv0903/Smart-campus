import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Loader2, 
  Globe,
  Users,
  Trash2
} from 'lucide-react';

export default function CollegeDomainManager({ currentUser }) {
  const [institutions, setInstitutions] = useState([]);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthToken = () => {
    return currentUser?.token || currentUser?.demoToken || localStorage.getItem('smart_campus_token') || '';
  };

  const fetchInstitutions = async () => {
    try {
      const res = await fetch('/api/auth/institutions');
      const data = await res.json();
      if (data.success) {
        setInstitutions(data.institutions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleAddCollege = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/institutions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: newCollegeName,
          domain: newDomain
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error whitelisting domain');

      setSuccess(data.message);
      setNewCollegeName('');
      setNewDomain('');
      fetchInstitutions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`/api/auth/institutions/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchInstitutions();
        alert(data.message);
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDeleteCollege = async (id, domainName) => {
    const confirmed = window.confirm(`Are you sure you want to completely remove '@${domainName}'? Users with this email domain will no longer be able to log in or access the portal.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/auth/institutions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchInstitutions();
        alert(data.message);
      } else {
        alert(data.message || 'Error deleting institution');
      }
    } catch (err) {
      alert('Failed to delete institution');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-blue-600 font-bold uppercase tracking-wider text-[11px]">
          <Building2 className="w-4 h-4" />
          <span>Platform Multi-Tenancy Management</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Authorized College Domains & Access Control
        </h2>
        <p className="text-slate-600 leading-relaxed text-xs">
          As the platform administrator, you control which universities can access the platform. 
          Only students and staff with emails matching an approved domain can register or submit campus concerns.
        </p>
      </div>

      {/* Add College Domain Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-blue-600" />
          <span>Whitelist a New College / University Domain</span>
        </h3>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAddCollege} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <label className="block text-slate-700 font-semibold mb-1">College / University Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Birla Institute of Technology or IIT Bombay"
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-slate-700 font-semibold mb-1">Email Domain *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold">@</span>
              <input
                type="text"
                required
                placeholder="bits.ac.in or iitb.ac.in"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Authorize</span>}
            </button>
          </div>
        </form>
      </div>

      {/* List of Whitelisted Colleges */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Approved Institutions Registry ({institutions.length})
          </h3>
          <span className="text-slate-400 text-[11px]">Real-time Domain Guard</span>
        </div>

        <div className="divide-y divide-slate-100">
          {institutions.map((inst) => (
            <div key={inst._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-900">{inst.name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold">
                    @{inst.domain}
                  </span>
                  {inst.isActive ? (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {inst.registeredStudentsCount || 0} registered members • Complaints isolated to @{inst.domain}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(inst._id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                    inst.isActive
                      ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {inst.isActive ? 'Suspend Access' : 'Reactivate'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCollege(inst._id, inst.domain)}
                  title="Remove this domain from authorized colleges"
                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
