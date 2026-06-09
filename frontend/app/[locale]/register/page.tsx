'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(email, username, password, role);
      router.push(`/${locale}/`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error occurred during registration signup process');
    } finally {
      setIsLoading(false);
    }
  };

  const lp = (path: string) => `/${locale}${path}`;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 md:p-8 text-base-content">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-base-100 rounded-3xl overflow-hidden card-premium">
        
        {/* Left Side - Classroom Image (Desktop only) */}
        <div className="hidden md:block relative h-[600px] w-full bg-base-300">
          <img
            src="/images/Group 122.png"
            alt="Students in classroom"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-10 left-10 right-10 text-white z-10">
            <h2 className="text-3xl font-extrabold leading-tight">The Codefather Platform</h2>
            <p className="text-sm text-white/80 mt-2 font-medium">Authoritative. Premium. Technical.</p>
          </div>
        </div>

        {/* Right Side - Interactive Form */}
        <div className="card-body w-full max-w-md mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-base-content mb-6">
              {t('registerTitle')}
            </h1>

            {/* Toggle Pills */}
            <div className="inline-flex bg-base-200 p-1.5 rounded-full mb-8 border border-base-300">
              <Link
                href={lp('/login')}
                className="btn btn-sm btn-ghost rounded-full px-8"
              >
                {t('loginButton')}
              </Link>
              <Link
                href={lp('/register')}
                className="btn-premium rounded-full px-8 py-2 text-sm text-center"
              >
                {t('registerButton')}
              </Link>
            </div>

            <p className="text-base-content/60 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
              {t('registerSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="alert alert-error text-xs rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Role Selector */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold uppercase text-xs tracking-wide">{t('selectRole')}</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`btn rounded-2xl ${role === 'STUDENT' ? 'btn-primary' : 'btn-outline bg-base-100'}`}
                >
                  {t('roleStudent')}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('INSTRUCTOR')}
                  className={`btn rounded-2xl ${role === 'INSTRUCTOR' ? 'btn-primary' : 'btn-outline bg-base-100'}`}
                >
                  {t('roleInstructor')}
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold uppercase text-xs tracking-wide">{t('email')}</span>
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium w-full"
              />
            </div>

            {/* Username Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold uppercase text-xs tracking-wide">{t('username')}</span>
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-premium w-full"
              />
            </div>

            {/* Password Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold uppercase text-xs tracking-wide">{t('password')}</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/50 hover:text-base-content focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-control mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-premium rounded-full px-14 py-3 w-full"
              >
                {isLoading ? <span className="loading loading-spinner"></span> : t('registerButton')}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
