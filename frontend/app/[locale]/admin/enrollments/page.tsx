'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { 
  LayoutDashboard, Users, BookOpen, Building2, Trophy, Activity,
  CreditCard, Settings, HelpCircle, ShieldCheck, FileText, X, Menu
} from 'lucide-react';

const NAV_MENU = [
  { label: 'dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'users', icon: Users, href: '/admin/users' },
  { label: 'courses', icon: BookOpen, href: '/admin/courses' },
  { label: 'centers', icon: Building2, href: '/admin/centers' },
  { label: 'leaderboard', icon: Trophy, href: '/admin/leaderboard' },
  { label: 'analytics', icon: Activity, href: '/admin/analytics' },
];

const NAV_OTHERS = [
  { label: 'payments', icon: CreditCard, href: '/admin/payments' },
  { label: 'enrollments', icon: FileText, href: '/admin/enrollments' },
  { label: 'settings', icon: Settings, href: '/admin/settings' },
  { label: 'help', icon: HelpCircle, href: '/admin/help' },
];

export default function AdminEnrollmentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  const tNav = useTranslations('admin');
  const tPage = useTranslations('admin.enrollmentsPage');
  const tCommon = useTranslations('common');

  const isRTL = locale === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
    router.push(`/${locale}/login`);
  }

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['adminEnrollments'],
    queryFn: async () => {
      const { data } = await api.get('/admin/enrollments');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'ADMIN'),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="bg-primary rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-md shadow-primary/20">
        <div className="w-10 h-10 rounded-xl bg-primary-content/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary-content" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-primary-content truncate">{user?.username}</p>
          <p className="text-[10px] text-primary-content/60 font-medium">{tNav('superAdmin')}</p>
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">{tNav('menu')}</p>
        {NAV_MENU.map(({ label, icon: Icon, href }) => {
          const active = pathname?.includes(href);
          return (
            <Link key={href} href={`/${locale}${href}`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />{tNav(label)}
            </Link>
          );
        })}
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">{tNav('others')}</p>
        {NAV_OTHERS.map(({ label, icon: Icon, href }) => {
          const active = pathname?.includes(href);
          return (
            <Link key={href} href={`/${locale}${href}`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />{tNav(label)}
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 z-50 h-full w-64 bg-base-200 p-4 overflow-y-auto transition-transform duration-300 lg:hidden ${
          sidebarOpen
            ? 'translate-x-0'
            : isRTL
              ? 'translate-x-full'
              : '-translate-x-full'
        } ${isRTL ? 'right-0' : 'left-0'}`}
      >
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent />
      </div>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <SidebarContent />
        </aside>

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">{tPage('title')}</h1>
            <p className="text-xs text-base-content/50 font-medium mt-0.5">{tPage('subtitle')}</p>
          </div>

          {enrollments.length > 0 ? (
            <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-base-300 bg-base-200/20">
                <h2 className="text-sm font-black text-base-content">{tPage('allEnrollments', { count: enrollments.length })}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr className="bg-base-200/50 text-[10px] uppercase tracking-wider text-base-content/40 font-black">
                      <th className="py-3 px-5">{tPage('student')}</th>
                      <th className="py-3 px-5">{tPage('course')}</th>
                      <th className="py-3 px-5">{tPage('progress')}</th>
                      <th className="py-3 px-5">{tPage('enrolledAt')}</th>
                      <th className="py-3 px-5">{tPage('completed')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {enrollments.map((e: any) => (
                      <tr key={e.id || e._id} className="hover:bg-base-200/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                              {(e.userId?.username || e.user?.username)?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="font-bold text-base-content text-sm">{e.userId?.username || e.user?.username || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-base-content/60 text-xs font-semibold">
                          {e.courseId?.title || e.course?.title || 'Deleted Course'}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${e.progress || 0}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary">{e.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-base-content/60 text-xs font-semibold">
                          {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`badge badge-sm font-extrabold ${e.completedAt ? 'badge-success text-success-content' : 'badge-ghost'}`}>
                            {e.completedAt ? tPage('completed') : tPage('inProgress')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {enrollments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-sm text-base-content/40 font-medium">{tPage('noEnrollments')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-base-content/25 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-base-content mb-2">{tPage('noEnrollments')}</h3>
              <p className="text-sm text-base-content/50">{tPage('noEnrollmentsDesc')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}