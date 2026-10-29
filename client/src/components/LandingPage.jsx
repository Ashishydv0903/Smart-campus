import React from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  FileText, 
  Camera, 
  Clock, 
  UserPlus, 
  Send, 
  CheckCircle2, 
  Instagram, 
  Github, 
  Mail,
  ShieldCheck,
  Building2,
  Check
} from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Smart<span className="text-blue-600">Campus</span>
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onGetStarted}
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5" />
            <span>Multi-College Domain Verified Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Smart Campus Complaint<br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Management System
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A centralized digital platform to report, track, and resolve campus related issues. 
            Upload photo evidence, get real-time status updates, and verify completed repairs.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* WHY USE CAMPUSFIX? */}
      <section className="py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            WHY USE <strong className="text-blue-600">SMARTCAMPUS</strong>?
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Instant Digital Reporting</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit detailed campus related complaints directly through the web portal in seconds. No paper forms or informal WhatsApp chats.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Photo & Evidence Attachment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload clear photos of the issue — whether it's a water leak or broken power socket — to help technicians arrive with the right tools.
            </p>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Live Status & Two-Way Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Stay updated with real-time status changes. Technicians cannot arbitrarily close tickets — the student or teacher who raised it must inspect and confirm the repair.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            HOW IT <strong className="text-blue-600">WORKS</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">1. Institutional Login</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Log in with your official university email domain or Google account. The portal automatically connects you to your college's private facilities dashboard.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">2. Raise Concerns & Merge Duplicates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe your issue. If other residents in your hostel or block reported the same problem, your report is merged into a single priority issue.
            </p>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">3. Resolution & Final Sign-Off</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              HODs and university heads assign maintenance staff. Once the physical repair is finished, you test the fix and mark it officially closed.
            </p>
          </div>
        </div>
      </section>

      {/* MULTI-CAMPUS SUPPORT & SECURITY */}
      <section className="py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            CAMPUS <strong className="text-blue-600">COLLABORATION</strong>
          </span>
          <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
            Designed to support colleges and universities with strict email domain whitelisting, protecting campus privacy and facilities oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm text-center">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Strict Domain Whitelist</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Only authorized university domains can access the system, preventing unauthorized public submissions.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm text-center">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Isolated College Workspaces</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Each institution manages its own buildings, students, staff, and maintenance queues with full privacy.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm text-center">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Administrator Control</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              University directors and heads can add, verify, and approve new institutional branches on demand.
            </p>
          </div>
        </div>
      </section>

      {/* CONNECT WITH US */}
      <section className="py-10 px-4 sm:px-6 max-w-xl mx-auto space-y-4">
        <div className="text-center">
          <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            CONNECT <strong className="text-blue-600">WITH US</strong>
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-around">
          <a href="#" className="flex flex-col items-center space-y-1.5 text-slate-600 hover:text-pink-600 transition-colors">
            <div className="w-11 h-11 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
              <Instagram className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold">Instagram</span>
          </a>

          <a href="#" className="flex flex-col items-center space-y-1.5 text-slate-600 hover:text-slate-900 transition-colors">
            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Github className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold">GitHub</span>
          </a>

          <a href="#" className="flex flex-col items-center space-y-1.5 text-slate-600 hover:text-blue-600 transition-colors">
            <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold">Email Us</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 CampusFix • Built for smart campus complaint management.</p>
        <p className="space-x-4 text-[11px] text-slate-400">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:underline">Terms & Conditions</a>
        </p>
      </footer>
    </div>
  );
}
