'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { AlertCircle, Eye, EyeOff, X, Mail, GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

declare global {
  interface Window { google?: any; }
}

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth');

  const [email, setEmail]             = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [role, setRole]               = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [gisReady, setGisReady]       = useState(false);

  const [showDevModal, setShowDevModal] = useState(false);
  const [devEmail, setDevEmail]         = useState('');
  const [devLoading, setDevLoading]     = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = !!(googleClientId && googleClientId.trim());

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle(credential, role);
      router.push(`/${locale}/`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogle, router, locale, role]);

  const initializeGoogle = useCallback(() => {
    if (!isGoogleConfigured || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: any) => handleGoogleCredential(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    setGisReady(true);
  }, [isGoogleConfigured, googleClientId, handleGoogleCredential]);

  const handleRealGoogleClick = () => {
    if (!window.google) return;
    window.google.accounts.id.prompt();
  };

  useEffect(() => {
    if (isGoogleConfigured && window.google) initializeGoogle();
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [isGoogleConfigured, initializeGoogle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register(email, username, password, role);
      router.push(`/${locale}/`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSimulation = async () => {
    if (!devEmail.trim() || !devEmail.includes('@')) {
      setError('Please enter a valid email address for simulation.');
      return;
    }
    setDevLoading(true);
    setError(null);
    try {
      await loginWithGoogle(`mock_google_${devEmail.trim()}`, role);
      setShowDevModal(false);
      router.push(`/${locale}/`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Dev simulation failed.');
    } finally {
      setDevLoading(false);
    }
  };

  const lp = (path: string) => `/${locale}${path}`;

  return (
    <>
      {isGoogleConfigured && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={initializeGoogle}
          strategy="afterInteractive"
        />
      )}

      <div className="min-h-screen bg-base-200 flex items-center justify-center p-3 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-base-100 rounded-3xl overflow-hidden shadow-2xl border border-base-300">

          {/* ── Left panel ── */}
          <div className="hidden md:flex relative flex-col justify-end min-h-[560px] bg-base-300 overflow-hidden">
            <img
              src="/images/Group 122.png"
              alt="Students in classroom"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="relative z-10 p-8 pb-10">
              <span className="badge badge-primary badge-sm mb-3 font-bold tracking-widest uppercase">Join Today</span>
              <h2 className="text-3xl font-extrabold text-white leading-tight">The Codefather</h2>
              <p className="text-white/70 mt-2 text-sm font-medium">Authoritative. Premium. Technical.</p>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex flex-col justify-center px-5 sm:px-8 py-10 md:py-12 w-full">

            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="join rounded-full border border-base-300 bg-base-200 p-1">
                <Link href={lp('/login')} className="join-item btn btn-sm btn-ghost rounded-full px-6 sm:px-8 font-bold text-base-content/60">
                  {t('loginButton')}
                </Link>
                <Link href={lp('/register')} className="join-item btn btn-sm btn-primary rounded-full px-6 sm:px-8 font-bold shadow-sm">
                  {t('registerButton')}
                </Link>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-center text-base-content mb-1">{t('registerTitle')}</h1>
            <p className="text-center text-xs sm:text-sm text-base-content/50 mb-6">{t('registerSubtitle')}</p>

            {/* ── Role selector ── */}
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wide text-base-content/50 mb-2">{t('selectRole')}</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Student */}
                <button
                  type="button"
                  id="role-student"
                  onClick={() => setRole('STUDENT')}
                  className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
                    role === 'STUDENT'
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-base-300 bg-base-100 text-base-content/60 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <GraduationCap size={22} className={role === 'STUDENT' ? 'text-primary' : 'text-base-content/40'} />
                  {t('roleStudent')}
                </button>
                {/* Instructor */}
                <button
                  type="button"
                  id="role-instructor"
                  onClick={() => setRole('INSTRUCTOR')}
                  className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
                    role === 'INSTRUCTOR'
                      ? 'border-secondary bg-secondary/10 text-secondary shadow-sm'
                      : 'border-base-300 bg-base-100 text-base-content/60 hover:border-secondary/40 hover:bg-secondary/5'
                  }`}
                >
                  <BookOpen size={22} className={role === 'INSTRUCTOR' ? 'text-secondary' : 'text-base-content/40'} />
                  {t('roleInstructor')}
                </button>
              </div>
            </div>

            {/* ── Google button ── */}
            <div className="mb-5">
              {isGoogleConfigured ? (
                <button
                  type="button"
                  id="google-signup-btn"
                  onClick={handleRealGoogleClick}
                  disabled={isGoogleLoading || !gisReady}
                  className="btn w-full rounded-2xl h-12 border-2 border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/50 text-base-content font-semibold gap-3 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                >
                  {isGoogleLoading
                    ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    : <GoogleLogo size={20} />}
                  <span className="text-sm font-bold">
                    {isGoogleLoading ? 'Signing up…' : 'Sign up with Google'}
                  </span>
                  {/* Subtle role chip */}
                  <span className={`ml-auto badge badge-xs font-bold px-2 py-2.5 rounded-lg text-[9px] uppercase tracking-wider ${role === 'STUDENT' ? 'badge-primary' : 'badge-secondary'}`}>
                    {role}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDevModal(true)}
                  className="btn w-full rounded-2xl h-12 border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/70 text-base-content font-semibold gap-3 transition-all duration-200"
                >
                  <GoogleLogo size={20} />
                  <span className="text-sm font-bold">Sign up with Google</span>
                  <span className="ml-auto badge badge-warning badge-xs font-bold px-2 py-2.5 rounded-lg text-[10px] uppercase tracking-wider">Dev</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-base-300" />
              <span className="text-[11px] font-bold text-base-content/35 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-base-300" />
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error text-xs rounded-2xl mb-4 py-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-bold text-xs uppercase tracking-wide">{t('email')}</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t('email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input input-bordered w-full rounded-xl focus:input-primary font-medium"
                />
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-bold text-xs uppercase tracking-wide">{t('username')}</span>
                </label>
                <input
                  id="register-username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder={t('username')}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input input-bordered w-full rounded-xl focus:input-primary font-medium"
                />
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-bold text-xs uppercase tracking-wide">{t('password')}</span>
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder={t('password')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input input-bordered w-full rounded-xl focus:input-primary pr-11 font-medium"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-3.5 flex items-center text-base-content/40 hover:text-base-content transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="register-submit"
                disabled={isLoading}
                className={`btn w-full rounded-2xl h-12 font-bold text-sm mt-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 ${role === 'INSTRUCTOR' ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isLoading ? <span className="loading loading-spinner loading-sm" /> : t('registerButton')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Dev Modal — bottom sheet on mobile, centered on desktop */}
      {showDevModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDevModal(false)} />
          <div className="relative bg-base-100 w-full sm:w-auto sm:min-w-[380px] sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl border border-base-300 p-6 sm:p-8 z-10">
            <button onClick={() => setShowDevModal(false)} className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle" aria-label="Close">
              <X size={16} />
            </button>
            <div className="w-10 h-1 bg-base-300 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-3">
                <GoogleLogo size={24} />
              </div>
              <h3 className="text-base font-extrabold">Google Dev Simulator</h3>
              <p className="text-xs text-base-content/50 mt-1.5 leading-relaxed">
                No <code className="bg-base-200 px-1 py-0.5 rounded text-[10px] font-mono">GOOGLE_CLIENT_ID</code> detected.<br />
                Enter any email to simulate Google sign-up.
              </p>
              <div className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${role === 'STUDENT' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                Registering as: {role}
              </div>
            </div>

            {error && (
              <div className="alert alert-error text-xs rounded-xl mb-4 py-2.5 gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="email"
                  id="dev-register-email"
                  placeholder="alice@gmail.com"
                  value={devEmail}
                  onChange={e => setDevEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDevSimulation()}
                  className="input input-bordered w-full pl-9 rounded-xl font-medium text-sm"
                  autoFocus
                />
              </div>
              <button
                id="dev-register-submit"
                onClick={handleDevSimulation}
                disabled={devLoading}
                className={`btn w-full rounded-xl font-bold ${role === 'INSTRUCTOR' ? 'btn-secondary' : 'btn-primary'}`}
              >
                {devLoading ? <><span className="loading loading-spinner loading-sm" /> Registering…</> : 'Sign up with Google (Dev)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
