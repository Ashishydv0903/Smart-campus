import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import ComplaintForm from './components/ComplaintForm';
import TicketCard from './components/TicketCard';
import TicketDetailModal from './components/TicketDetailModal';
import CollegeDomainManager from './components/CollegeDomainManager';
import StudentDirectory from './components/StudentDirectory';
import { 
  Search, 
  ListFilter, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Wrench, 
  Users, 
  ShieldAlert,
  Inbox,
  LogOut,
  Building2,
  Activity,
  Zap,
  Flame,
  CheckCheck
} from 'lucide-react';

export default function App() {
  // Page state: 'landing' | 'login' | 'dashboard'
  const [currentView, setCurrentView] = useState('landing');
  const [activeTab, setActiveTab] = useState('feed');
  const [currentUser, setCurrentUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterZone, setFilterZone] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getAuthToken = () => {
    return currentUser?.token || currentUser?.demoToken || localStorage.getItem('smart_campus_token') || '';
  };

  // 1. Initial Load: Check session
  useEffect(() => {
    async function loadInitialSession() {
      try {
        const storedUser = localStorage.getItem('smart_campus_user');
        const storedToken = localStorage.getItem('smart_campus_token');
        if (storedUser && storedToken) {
          const parsed = JSON.parse(storedUser);
          parsed.token = storedToken;
          parsed.demoToken = storedToken;
          setCurrentUser(parsed);
          setCurrentView('dashboard');
        } else {
          setCurrentView('landing');
        }
      } catch (err) {
        console.error('Session load error:', err);
      }
    }
    loadInitialSession();
  }, []);

  // 2. Fetch Complaints (Strictly isolated by user's institutionDomain)
  const fetchComplaints = async () => {
    if (currentView !== 'dashboard') return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterDomain !== 'All') params.append('domain', filterDomain);
      if (filterPriority !== 'All') params.append('priority', filterPriority);
      if (filterStatus !== 'All') params.append('status', filterStatus);
      if (filterZone !== 'All') params.append('zone', filterZone);
      if (searchQuery) params.append('search', searchQuery);

      if (activeTab === 'myIssues') {
        params.append('myIssues', 'true');
      }

      if (activeTab === 'assigned') {
        params.append('assignedToMe', 'true');
      }

      if (activeTab === 'urgent') {
        params.append('priority', 'P1');
      }

      const res = await fetch(`/api/complaints?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchComplaints();
    }
  }, [currentView, filterDomain, filterPriority, filterStatus, filterZone, searchQuery, activeTab, currentUser]);

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    const token = user?.token || user?.demoToken || localStorage.getItem('smart_campus_token');
    const enrichedUser = { ...user, token, demoToken: token };
    setCurrentUser(enrichedUser);
    setCurrentView('dashboard');
    if (user.role === 'technician') {
      setActiveTab('assigned');
    } else {
      setActiveTab('feed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_campus_token');
    localStorage.removeItem('smart_campus_user');
    setCurrentUser(null);
    setCurrentView('landing');
  };

  // Upvote / "I have this issue too"
  const handleUpvote = async (ticketId) => {
    try {
      const res = await fetch(`/api/complaints/${ticketId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Could not add vote.');
    }
  };

  // Technician update (Start / Mark work done)
  const handleTechnicianUpdate = async (ticketId, action, resolutionNotes = '', resolutionProofUrl = '') => {
    try {
      const res = await fetch(`/api/complaints/${ticketId}/technician-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ action, resolutionNotes, resolutionProofUrl })
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
        setSelectedTicket(data.complaint);
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error updating technician progress.');
    }
  };

  // Assign staff (HOD / Director)
  const handleAssignStaff = async (ticketId, technicianName, priority) => {
    try {
      const res = await fetch(`/api/complaints/${ticketId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ technicianName, priority })
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
        setSelectedTicket(data.complaint);
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error assigning staff.');
    }
  };

  // Complainant Verify & Close Ticket (Student / Teacher ONLY)
  const handleVerifyAndClose = async (ticketId, approved, rating, feedback) => {
    try {
      const res = await fetch(`/api/complaints/${ticketId}/verify-and-close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ approved, rating, feedback })
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
        setSelectedTicket(data.complaint);
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error verifying issue.');
    }
  };

  // Director directive note
  const handleDirectorNote = async (ticketId, note) => {
    try {
      const res = await fetch(`/api/complaints/${ticketId}/director-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ note })
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
        setSelectedTicket(data.complaint);
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error saving director note.');
    }
  };

  // =========================================================================
  // VIEW 1: LANDING PAGE
  // =========================================================================
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setCurrentView('login')}
      />
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN PAGE
  // =========================================================================
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToHome={() => setCurrentView('landing')}
      />
    );
  }

  // =========================================================================
  // VIEW 3: PROTECTED ROLE DASHBOARD (Only entered AFTER login!)
  // =========================================================================
  const myPendingVerifications = complaints.filter(
    c => c.status === 'Pending_Verification' && 
         (c.reportedBy?.userId === currentUser?._id || c.cluster?.subscribers?.some(s => s.userId === currentUser?._id))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Dashboard Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Verification Alert Banner for Students/Teachers */}
        {myPendingVerifications.length > 0 && activeTab !== 'submit' && activeTab !== 'colleges' && activeTab !== 'students' && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block text-amber-800">
                  Action Required: {myPendingVerifications.length} Repair(s) Completed
                </span>
                <p className="text-xs text-amber-900 mt-0.5">
                  The maintenance staff reports they have fixed your issue. Please test and close the ticket if working.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTicket(myPendingVerifications[0])}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Verify Fix Now
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: CAMPUS CONCERNS / MY ISSUES / ASSIGNED TASKS              */}
        {/* ============================================================== */}
        {activeTab !== 'submit' && activeTab !== 'colleges' && activeTab !== 'students' && (
          <div className="space-y-4">
            {/* Campus Facility Health Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Facility Health</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span className="text-base font-bold text-slate-900">
                    {complaints.length > 0 ? Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100) : 100}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Issues resolved</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Active Repairs</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span className="text-base font-bold text-slate-900">
                    {complaints.filter(c => c.status !== 'Resolved').length}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Open or in progress</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Reports Merged</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-base font-bold text-slate-900">
                    {complaints.reduce((sum, c) => sum + (c.cluster?.affectedCount > 1 ? c.cluster.affectedCount - 1 : 0), 0)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Duplicates grouped</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Urgent Hazards</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span className="text-base font-bold text-rose-700">
                    {complaints.filter(c => c.priority === 'P1' && c.status !== 'Resolved').length}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Priority P1 items</span>
              </div>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { label: 'All Concerns', domain: 'All', priority: 'All', status: 'All' },
                { label: '⚡ Electrical', domain: 'Electrical', priority: 'All', status: 'All' },
                { label: '🚰 Water & Plumbing', domain: 'Plumbing', priority: 'All', status: 'All' },
                { label: '📶 Wi-Fi & Internet', domain: 'IT_Network', priority: 'All', status: 'All' },
                { label: '🧱 Room & Furniture', domain: 'Civil', priority: 'All', status: 'All' },
                { label: '🗑️ Cleanliness', domain: 'Sanitation', priority: 'All', status: 'All' },
                { label: '🚨 Urgent P1', domain: 'All', priority: 'P1', status: 'All' },
                { label: '⏳ Needs Inspection', domain: 'All', priority: 'All', status: 'Pending_Verification' }
              ].map(pill => {
                const isSelected = 
                  (pill.domain === 'All' ? filterDomain === 'All' : filterDomain === pill.domain) &&
                  (pill.priority === 'All' ? filterPriority === 'All' : filterPriority === pill.priority) &&
                  (pill.status === 'All' ? filterStatus === 'All' : filterStatus === pill.status);

                return (
                  <button
                    key={pill.label}
                    onClick={() => {
                      setFilterDomain(pill.domain);
                      setFilterPriority(pill.priority);
                      setFilterStatus(pill.status);
                    }}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-2.5">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by keywords, room, building..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Electrical">⚡ Electrical</option>
                  <option value="Plumbing">🚰 Water / Plumbing</option>
                  <option value="IT_Network">📶 Internet / Wi-Fi</option>
                  <option value="Civil">🧱 Room / Furniture</option>
                  <option value="Sanitation">🗑️ Cleanliness</option>
                </select>

                {/* Building Filter */}
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Buildings</option>
                  <option value="Hostel Block A">Hostel Block A</option>
                  <option value="Hostel Block B">Hostel Block B</option>
                  <option value="Academic Block 1 (ECE/CSE)">Academic Block 1</option>
                  <option value="Academic Block 2 (Mech/Civil)">Academic Block 2</option>
                  <option value="Central Library">Central Library</option>
                  <option value="Student Mess & Dining">Mess & Dining</option>
                  <option value="Science & Research Labs">Science Labs</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Reported">Open</option>
                  <option value="Assigned">Staff Assigned</option>
                  <option value="In_Progress">In Progress</option>
                  <option value="Pending_Verification">Work Done (Needs Verification)</option>
                  <option value="Resolved">Closed</option>
                </select>

                {(filterDomain !== 'All' || filterZone !== 'All' || filterStatus !== 'All' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterDomain('All');
                      setFilterZone('All');
                      setFilterStatus('All');
                      setSearchQuery('');
                    }}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* List of Cards */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Loading campus issues...
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-2">
                <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-800">No issues found</h3>
                <p className="text-xs text-slate-400">
                  {activeTab === 'myIssues' 
                    ? "You haven't reported any issues yet." 
                    : activeTab === 'assigned'
                      ? "No repair tasks currently assigned to you."
                      : "No complaints found matching this filter in your college."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complaints.map((ticket) => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    currentUser={currentUser}
                    onSelect={setSelectedTicket}
                    onUpvote={handleUpvote}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: RAISE AN ISSUE                                            */}
        {/* ============================================================== */}
        {activeTab === 'submit' && (
          <ComplaintForm
            currentUser={currentUser}
            onSuccess={() => {
              setActiveTab('feed');
              fetchComplaints();
            }}
          />
        )}

        {/* ============================================================== */}
        {/* TAB: MANAGE AUTHORIZED COLLEGE DOMAINS                         */}
        {/* ============================================================== */}
        {activeTab === 'colleges' && (
          <CollegeDomainManager
            currentUser={currentUser}
          />
        )}

        {/* ============================================================== */}
        {/* TAB: STUDENT & MEMBER DIRECTORY (HOD CONTROL)                 */}
        {/* ============================================================== */}
        {activeTab === 'students' && (
          <StudentDirectory
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          currentUser={currentUser}
          onClose={() => setSelectedTicket(null)}
          onTechnicianUpdate={handleTechnicianUpdate}
          onAssignStaff={handleAssignStaff}
          onVerifyAndClose={handleVerifyAndClose}
          onDirectorNote={handleDirectorNote}
        />
      )}

      {/* Dashboard Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 text-center text-xs text-slate-500">
        CampusCare • Logged in as <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.role?.toUpperCase()}) at <strong className="text-blue-600">@{currentUser?.institutionDomain}</strong> •{' '}
        <button onClick={handleLogout} className="text-rose-600 hover:underline font-semibold ml-1">
          Sign Out
        </button>
      </footer>
    </div>
  );
}
