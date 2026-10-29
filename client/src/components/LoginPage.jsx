import React, { useState } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CreditCard, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
  KeyRound,
  User,
  ShieldCheck
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onBackToHome }) {
  // Modes: 'login' | 'forgot' | 'register' | 'google'
  const [authMode, setAuthMode] = useState('login');
  
  // Login form state
  const [emailOrPrn, setEmailOrPrn] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPrn, setRegPrn] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regPassword, setRegPassword] = useState('');
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Google modal state
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Submit Standard Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrPrn, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const userWithToken = { ...data.user, token: data.token, demoToken: data.token };
      localStorage.setItem('smart_campus_token', data.token);
      localStorage.setItem('smart_campus_user', JSON.stringify(userWithToken));
      onLoginSuccess(userWithToken);
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Register (Validates College Domain)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          prn: regPrn,
          role: regRole,
          password: regPassword
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      const userWithToken = { ...data.user, token: data.token, demoToken: data.token };
      localStorage.setItem('smart_campus_token', data.token);
      localStorage.setItem('smart_campus_user', JSON.stringify(userWithToken));
      onLoginSuccess(userWithToken);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Request Forgot Password Code
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not send reset code');

      setCodeSent(true);
      setGeneratedCode(data.resetCode);
      setSuccessMsg(`Verification code generated: ${data.resetCode}. Enter code below to set new password.`);
    } catch (err) {
      setError(err.message || 'Error requesting reset code');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          resetCode,
          newPassword
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Password reset failed');

      alert('Password reset successfully! Please sign in with your new password.');
      setAuthMode('login');
      setEmailOrPrn(forgotEmail);
      setPassword('');
      setCodeSent(false);
    } catch (err) {
      setError(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Google Login (Validates College Domain)
  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName || 'Google User'
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Google login failed');

      const userWithToken = { ...data.user, token: data.token, demoToken: data.token };
      localStorage.setItem('smart_campus_token', data.token);
      localStorage.setItem('smart_campus_user', JSON.stringify(userWithToken));
      onLoginSuccess(userWithToken);
    } catch (err) {
      setError(err.message || 'Google account not authorized');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Top back button */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SmartCampus Home</span>
        </button>

        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800">SmartCampus </span>
        </div>
      </div>

      {/* Main Split Card (Exact Image 2 Layout) */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Side: Graphic Pane */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-50/90 via-slate-100 to-blue-50/70 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-200/60">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <line x1="20" y1="50" x2="160" y2="180" stroke="#6366f1" strokeWidth="1.5" />
              <line x1="160" y1="180" x2="300" y2="100" stroke="#0ea5e9" strokeWidth="1.5" />
              <line x1="160" y1="180" x2="220" y2="350" stroke="#8b5cf6" strokeWidth="1.5" />
              <line x1="50" y1="280" x2="220" y2="350" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="20" cy="50" r="4" fill="#6366f1" />
              <circle cx="160" cy="180" r="5" fill="#0ea5e9" />
              <circle cx="300" cy="100" r="4" fill="#6366f1" />
              <circle cx="220" cy="350" r="5" fill="#8b5cf6" />
              <circle cx="50" cy="280" r="4" fill="#3b82f6" />
            </svg>
          </div>

          <div className="relative z-10 space-y-4 max-w-xs">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100/80 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-sm">
              <GraduationCap className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              SmartCampus
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              Access your SmartCampus dashboard to submit and track complaints
            </p>

            <div className="pt-4 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-600 block">Domain Verified Access</span>
              <p>Only users with an approved university email can authenticate.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Pane */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 1: STANDARD SIGN IN                                       */}
          {/* ============================================================== */}
          {authMode === 'login' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back
                </h3>
                <p className="text-xs text-slate-500">
                  Sign in to your account
                </p>
              </div>

              {/* Working Login with Google button */}
              <button
                type="button"
                onClick={() => setAuthMode('google')}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 transition-colors shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Login with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-medium">or</span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    PRN OR INSTITUTIONAL EMAIL *
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your PRN or Email"
                      value={emailOrPrn}
                      onChange={(e) => setEmailOrPrn(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    PASSWORD *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-normal">
                  By logging in, you agree to our{' '}
                  <a href="#" className="underline text-slate-600">Terms & Conditions</a> and{' '}
                  <a href="#" className="underline text-slate-600">Privacy Policy</a>.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1e1b4b] hover:bg-[#17153a] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-2 text-center border-t border-slate-100">
                  <span className="text-xs text-slate-500">New to Campus Fix? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Create a university account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 2: WORKING FORGOT PASSWORD                                */}
          {/* ============================================================== */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Reset Password
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your registered institutional email to reset your credentials.
                </p>
              </div>

              {!codeSent ? (
                <form onSubmit={handleSendResetCode} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      REGISTERED COLLEGE EMAIL *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@campus.edu or yourname@kit.edu"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#1e1b4b] hover:bg-[#17153a] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Code</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      6-DIGIT RESET CODE *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter verification code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      NEW PASSWORD *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm & Update Password</span>}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                className="text-xs text-slate-600 hover:text-slate-900 underline block text-center pt-2"
              >
                Back to Sign in
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 3: WORKING GOOGLE ACCOUNT SIGN IN                         */}
          {/* ============================================================== */}
          {authMode === 'google' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Sign in with Google
                </h3>
                <p className="text-xs text-slate-500">
                  Select or enter your university Google workspace email.
                </p>
              </div>

              <form onSubmit={handleGoogleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    GOOGLE UNIVERSITY EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. aarav@campus.edu or student@kit.edu"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must end with an approved college domain (e.g. @campus.edu, @kit.edu).
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    YOUR FULL NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authenticate with Google</span>}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                className="text-xs text-slate-600 hover:text-slate-900 underline block text-center pt-2"
              >
                Cancel and return to password login
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 4: WORKING CREATE ACCOUNT (REGISTER)                      */}
          {/* ============================================================== */}
          {authMode === 'register' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create Account
                </h3>
                <p className="text-xs text-slate-500">
                  Register with your institutional college credentials.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Patel"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">College Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@campus.edu or priya@kit.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">PRN / Roll No</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026CS140"
                      value={regPrn}
                      onChange={(e) => setRegPrn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Your Role *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Faculty / Teacher</option>
                      <option value="technician">Maintenance Staff</option>
                      <option value="hod">Head of Dept (HOD)</option>
                      <option value="director">Campus Director</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Create a secure password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1e1b4b] hover:bg-[#17153a] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Register & Enter Portal</span>}
                </button>

                <div className="pt-1 text-center">
                  <span className="text-slate-500">Already registered? </span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(''); }}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Helpful institutional domain reminder */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Approved College Domains: @campus.edu, @kit.edu, @iitd.ac.in,@galgotiacollege.edu</span>
            </span>
            
          </div>
        </div>
      </div>
    </div>
  );
}
