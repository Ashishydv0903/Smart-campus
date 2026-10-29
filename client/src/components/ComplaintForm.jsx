import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  Image as ImageIcon, 
  Send, 
  ThumbsUp,
  Loader2,
  Camera,
  UploadCloud,
  X
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Electrical', label: '⚡ Electrical (Power, Lights, Fans, Sockets)' },
  { id: 'Plumbing', label: '🚰 Water & Plumbing (Leaks, Taps, Washrooms)' },
  { id: 'IT_Network', label: '📶 Internet & Wi-Fi (Hostel Wi-Fi, Network)' },
  { id: 'Civil', label: '🧱 Room & Furniture (Doors, Windows, Broken Desks)' },
  { id: 'Sanitation', label: '🗑️ Cleanliness & Waste (Garbage, Washrooms)' }
];

const CAMPUS_ZONES = [
  'Hostel Block A',
  'Hostel Block B',
  'Academic Block 1 (ECE/CSE)',
  'Academic Block 2 (Mech/Civil)',
  'Central Library',
  'Student Mess & Dining',
  'Science & Research Labs',
  'Sports Complex'
];

export default function ComplaintForm({ currentUser, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'Electrical',
    zone: 'Hostel Block A',
    floor: 'Ground Floor',
    roomOrArea: '',
    evidencePhotoUrl: ''
  });

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, evidencePhotoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, evidencePhotoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getAuthToken = () => {
    return currentUser?.token || currentUser?.demoToken || localStorage.getItem('smart_campus_token') || '';
  };

  // Quiet background check for existing duplicate in same building
  useEffect(() => {
    if (!formData.title || formData.title.length < 5 || !formData.zone) {
      setDuplicateNotice(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const token = getAuthToken();
        const res = await fetch('/api/complaints/check-duplicate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success && data.duplicateMatch) {
          setDuplicateNotice(data.duplicateMatch.candidate);
        } else {
          setDuplicateNotice(null);
        }
      } catch (err) {
        console.error('Check duplicate error:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.title, formData.zone, formData.roomOrArea]);

  const handleSubmit = async (forceNew = false) => {
    setErrorMsg('');
    if (!formData.title || !formData.description || !formData.roomOrArea) {
      setErrorMsg('Please fill in the title, description, and specific room/spot.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      const res = await fetch('/api/complaints/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          forceNewTicket: forceNew
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Error submitting concern');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to campus server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinExisting = async (parentTicketId) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const token = getAuthToken();
      const res = await fetch(`/api/complaints/${parentTicketId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Could not join existing issue');
      }
    } catch (err) {
      setErrorMsg('Could not join issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          {currentUser?.role === 'teacher' ? 'Report a Campus / Lab Concern' : 'Report an Issue'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Provide the location and details. If other residents have already reported the same issue in your building, the system will merge them so technicians attend to it faster.
        </p>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Friendly Duplicate Notice (No jargon) */}
        {duplicateNotice && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-slate-800 space-y-2.5">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Similar issue already reported in this building!
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  <strong>{duplicateNotice.title}</strong> ({duplicateNotice.location.roomOrArea})
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {duplicateNotice.cluster?.affectedCount || 1} person(s) are already waiting for this repair.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => handleJoinExisting(duplicateNotice._id)}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>I have this issue too (Add Vote)</span>
              </button>

              <button
                type="button"
                onClick={() => setDuplicateNotice(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
              >
                This is a different problem
              </button>
            </div>
          </div>
        )}

        <form className="mt-6 space-y-4 text-xs">
          {/* Category */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Issue Category *</label>
            <select
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Building / Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Campus Building / Hostel *</label>
              <select
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                {CAMPUS_ZONES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Floor</label>
              <select
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
              </select>
            </div>
          </div>

          {/* Room / Specific Location */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Exact Room / Location *</label>
            <input
              type="text"
              placeholder="e.g. Room 312, 2nd Floor East Washroom, or Lab 204"
              value={formData.roomOrArea}
              onChange={(e) => setFormData({ ...formData, roomOrArea: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs placeholder:text-slate-400"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">What is the problem? *</label>
            <input
              type="text"
              placeholder="e.g. Water pipe leaking under sink, or Fan switch sparking"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs placeholder:text-slate-400"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Details & Description *</label>
            <textarea
              rows={3}
              placeholder="Describe what happened, if it is causing safety risks or inconvenience..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs placeholder:text-slate-400"
            />
          </div>

          {/* Photo / Visual Evidence (Camera & File Upload) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Photo of Issue (Optional)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!formData.evidencePhotoUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:border-blue-300">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                    Click to take photo or choose image
                  </span>
                  <span className="text-[11px] text-slate-400">
                    PNG, JPG up to 5MB
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-w-xs">
                <img 
                  src={formData.evidencePhotoUrl} 
                  alt="Evidence preview" 
                  className="w-full h-36 object-cover" 
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors shadow-sm"
                  title="Remove Photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !formData.title || !formData.description || !formData.roomOrArea}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Concern</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
