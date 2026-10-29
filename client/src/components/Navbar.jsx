import React from 'react';
import { 
  Building, 
  Plus, 
  ListFilter, 
  UserCheck, 
  Wrench, 
  ShieldAlert, 
  LogOut, 
  User, 
  Globe,
  Users
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout 
}) {
  const isTechnician = currentUser?.role === 'technician';
  const isHead = ['hod', 'director', 'admin'].includes(currentUser?.role);
  const isComplainant = ['student', 'teacher'].includes(currentUser?.role);

  const roleLabels = {
    student: { title: 'Student', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    teacher: { title: 'Faculty', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    hod: { title: 'HOD', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    director: { title: 'Director', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    technician: { title: 'Maintenance', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    admin: { title: 'Platform Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' }
  };

  const roleInfo = roleLabels[currentUser?.role] || roleLabels.student;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">CampusCare</span>
              <span className="text-xs text-slate-500 block -mt-0.5">
                @{currentUser?.institutionDomain || 'campus.edu'} Portal
              </span>
            </div>
          </div>

          {/* User profile & Sign Out */}
          <div className="flex items-center space-x-3">
            {currentUser && (
              <div className="flex items-center space-x-2 text-left">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                      {roleInfo.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block -mt-0.5">
                    @{currentUser.institutionDomain}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              title="Sign Out to return to Home"
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-t border-slate-100 py-2 overflow-x-auto text-xs font-medium">
          {/* All Campus Concerns for this college */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Campus Concerns</span>
          </button>

          {/* Raise Concern (Student, Teacher, Heads) */}
          {!isTechnician && (
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'submit'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise an Issue</span>
            </button>
          )}

          {/* Student / Teacher: My Issues */}
          {isComplainant && (
            <button
              onClick={() => setActiveTab('myIssues')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'myIssues'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Reported Issues</span>
            </button>
          )}

          {/* Technician: My Assigned Work */}
          {isTechnician && (
            <button
              onClick={() => setActiveTab('assigned')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'assigned'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>My Assigned Repair Tasks</span>
            </button>
          )}

          {/* HOD & Director: Urgent Issues */}
          {isHead && (
            <button
              onClick={() => setActiveTab('urgent')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'urgent'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Urgent & Overdue Attention</span>
            </button>
          )}

          {/* HOD & Director: Student Directory (Power to verify & remove students) */}
          {isHead && (
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Directory</span>
            </button>
          )}

          {/* Manage Authorized College Domains (Available to Heads/Admins) */}
          {isHead && (
            <button
              onClick={() => setActiveTab('colleges')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'colleges'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Authorized College Domains</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
