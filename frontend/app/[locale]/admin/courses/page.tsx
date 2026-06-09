'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { 
  LayoutDashboard, Users, BookOpen, Building2, Trophy, Activity, 
  CreditCard, Settings, HelpCircle, ShieldCheck, CheckCircle2, X, AlertTriangle, Eye
} from 'lucide-react';

const NAV_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Courses', icon: BookOpen, href: '/admin/courses' },
  { label: 'Centers', icon: Building2, href: '/admin/centers' },
  { label: 'Leaderboard', icon: Trophy, href: '/admin/leaderboard' },
  { label: 'Analytics', icon: Activity, href: '/admin/analytics' },
];

const NAV_OTHERS = [
  { label: 'Payments', icon: CreditCard, href: '/payments' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

export default function AdminCoursesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING'>('ALL');

  if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
    router.push(`/${locale}/login`);
  }

  // Load All Courses (showAll returns drafts/pending courses too)
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: async () => {
      const { data } = await api.get('/courses', { params: { showAll: 'true' } });
      return data.data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'ADMIN'),
  });

  // Course Approve/Reject mutations
  const approveMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.patch(`/admin/courses/${courseId}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminPendingCourses'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.patch(`/admin/courses/${courseId}/reject`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      queryClient.invalidateQueries({ queryKey: ['adminPendingCourses'] });
    },
  });

  const filteredCourses = courses.filter((c: any) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PUBLISHED') return c.published || c.status === 'PUBLISHED';
    if (statusFilter === 'PENDING') return !c.published && c.status !== 'PUBLISHED';
    return true;
  });

  if (authLoading || coursesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <div className="bg-primary rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-md shadow-primary/20">
            <div className="w-10 h-10 rounded-xl bg-primary-content/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary-content" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-primary-content truncate">{user?.username}</p>
              <p className="text-[10px] text-primary-content/60 font-medium">Super Admin</p>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">Menu</p>
            {NAV_MENU.map(({ label, icon: Icon, href }) => {
              const active = pathname?.includes(href);
              return (
                <Link key={href} href={`/${locale}${href}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />{label}
                </Link>
              );
            })}
            <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">Others</p>
            {NAV_OTHERS.map(({ label, icon: Icon, href }) => (
              <Link key={href} href={`/${locale}${href}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-150"
              >
                <Icon className="w-4 h-4 shrink-0" />{label}
              </Link>
            ))}
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-black text-base-content tracking-tight">Course Moderation</h1>
            <p className="text-xs text-base-content/50 font-medium mt-0.5">Inspect course details, approve drafts, or remove blueprints</p>
          </div>

          {/* Table Container */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-base-300 flex flex-wrap items-center justify-between gap-3 bg-base-200/20">
              <h2 className="text-sm font-black text-base-content">Platform Courses ({filteredCourses.length})</h2>
              
              <div className="join">
                {['ALL', 'PUBLISHED', 'PENDING'].map((r: any) => (
                  <button
                    key={r}
                    onClick={() => setStatusFilter(r)}
                    className={`join-item btn btn-xs font-bold ${statusFilter === r ? 'btn-primary text-primary-content' : 'btn-ghost border border-base-300'}`}
                  >
                    {r === 'PENDING' ? 'Pending Approval' : r}
                  </button>
                ))}
              </div>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="divide-y divide-base-300">
                {filteredCourses.map((c: any) => (
                  <div key={c.id || c._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-base-200/30 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-base-300 overflow-hidden shrink-0 border border-base-300 shadow-sm">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-base-content leading-tight">{c.title}</p>
                        <p className="text-[10px] text-base-content/50 font-semibold mt-1 flex flex-wrap items-center gap-3">
                          <span>By: <span className="text-base-content font-bold">{c.instructor?.username || 'Instructor'}</span></span>
                          <span>Category: <span className="text-base-content font-bold">{c.category?.name || '—'}</span></span>
                          <span className="text-primary font-bold">${c.price || 0}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`badge badge-sm font-extrabold ${c.published || c.status === 'PUBLISHED' ? 'badge-success text-success-content' : 'badge-warning text-warning-content animate-pulse'}`}>
                        {c.published || c.status === 'PUBLISHED' ? 'Published' : 'Pending Approval'}
                      </span>
                      
                      <div className="flex gap-1">
                        <Link href={`/${locale}/courses/${c.slug || c.id || c._id}`} className="btn btn-xs btn-ghost text-base-content/65 hover:text-primary">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        
                        {!(c.published || c.status === 'PUBLISHED') ? (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(c.id || c._id)}
                              className="btn btn-xs btn-success rounded-lg font-bold"
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(c.id || c._id)}
                              className="btn btn-xs btn-error btn-outline rounded-lg font-bold"
                              disabled={rejectMutation.isPending}
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => rejectMutation.mutate(c.id || c._id)}
                            className="btn btn-xs btn-error btn-outline rounded-lg font-bold"
                            disabled={rejectMutation.isPending}
                          >
                            Delete Course
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">No courses found matching filter criteria.</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
