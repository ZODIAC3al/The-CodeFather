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
  LayoutDashboard, Users, BookOpen, MapPin, ShieldCheck,
  Settings, CreditCard, HelpCircle, TrendingUp, TrendingDown,
  DollarSign, CheckCircle2, ChevronRight, Trophy,
  ClipboardCheck, X, Building2, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

// ── Mock chart data ──
const revenueData = [
  { day: '01', current: 1200, prev: 900 },
  { day: '02', current: 1800, prev: 1200 },
  { day: '03', current: 1400, prev: 1600 },
  { day: '04', current: 2200, prev: 1400 },
  { day: '05', current: 1900, prev: 1700 },
  { day: '06', current: 2600, prev: 1900 },
  { day: '07', current: 2400, prev: 2100 },
  { day: '08', current: 3100, prev: 2400 },
  { day: '09', current: 2700, prev: 2800 },
  { day: '10', current: 3500, prev: 2700 },
  { day: '11', current: 2900, prev: 2400 },
  { day: '12', current: 4100, prev: 3200 },
];

const userGrowthData = [
  { day: '01', current: 12, prev: 8 },
  { day: '02', current: 19, prev: 14 },
  { day: '03', current: 15, prev: 20 },
  { day: '04', current: 28, prev: 16 },
  { day: '05', current: 22, prev: 24 },
  { day: '06', current: 35, prev: 28 },
];

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

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'badge-primary',
  INSTRUCTOR: 'badge-secondary',
  STUDENT: 'badge-ghost',
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral text-neutral-content px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
      <p className="mb-1 text-neutral-content/60">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
    router.push(`/${locale}/login`);
  }

  // ── API queries ──
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics');
      return data;
    },
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const revenueChartData = analytics?.revenueData || [];
  const userGrowthChartData = analytics?.userGrowthData || [];

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data;
    },
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const { data: pendingCourses } = useQuery({
    queryKey: ['adminPendingCourses'],
    queryFn: async () => {
      const { data } = await api.get('/admin/pending-courses');
      return data || [];
    },
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['adminLeaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/admin/leaderboard');
      return data || [];
    },
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const { data: centers } = useQuery({
    queryKey: ['adminCenters'],
    queryFn: async () => {
      const { data } = await api.get('/admin/centers');
      return data || [];
    },
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // Role update mutation
  const roleUpdateMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  // Course approve/reject mutations
  const approveMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.patch(`/admin/courses/${courseId}/approve`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPendingCourses'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.patch(`/admin/courses/${courseId}/reject`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPendingCourses'] }),
  });

  const filteredUsers = roleFilter === 'ALL'
    ? users
    : users?.filter((u: any) => u.role === roleFilter);

  if (authLoading || analyticsLoading || usersLoading) {
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
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          {/* Admin badge */}
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
                <Link
                  key={href}
                  href={`/${locale}${href}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
            <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">Others</p>
            {NAV_OTHERS.map(({ label, icon: Icon, href }) => (
              <Link
                key={href}
                href={`/${locale}${href}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-150"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-base-content tracking-tight">Dashboard</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">Platform Command Center · All systems operational</p>
            </div>
            <div className="flex items-center gap-2">
              {pendingCourses?.length > 0 && (
                <div className="badge badge-warning badge-sm font-bold animate-pulse">
                  {pendingCourses.length} pending approval
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 1: Revenue chart + User distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Revenue bar chart */}
            <div className="lg:col-span-3 bg-base-100 rounded-2xl border border-base-300 p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Platform Revenue</p>
                  <p className="text-2xl font-extrabold text-base-content">
                    ${(analytics?.platformRevenue ?? 42850).toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-success flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> +$2,100 this month
                  </p>
                </div>
                <Link href={`/${locale}/admin/analytics`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  View Report <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">Sales from last 12 days</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenueChartData} barGap={4}>
                  <CartesianGrid vertical={false} stroke="oklch(var(--bc)/0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'oklch(var(--bc)/0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(var(--bc)/0.04)' }} />
                  <Bar dataKey="current" name="This period" fill="oklch(var(--p))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="prev" name="Last period" fill="oklch(var(--bc)/0.12)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Current period
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-base-300 inline-block" /> Last period
                </span>
              </div>
            </div>

            {/* User stats + bubble breakdown */}
            <div className="lg:col-span-2 bg-base-100 rounded-2xl border border-base-300 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Total Users</p>
                  <p className="text-2xl font-extrabold text-base-content">{users?.length ?? 0}</p>
                  <p className="text-xs font-bold text-success flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" /> +12% this month
                  </p>
                </div>
                <Link href={`/${locale}/admin/users`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  View Report <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Role bubbles */}
              <div className="flex-1 flex items-center justify-center gap-3 py-2">
                {(() => {
                  const total = users?.length || 1;
                  const studentCount = users?.filter((u: any) => u.role === 'STUDENT').length || 0;
                  const instrCount = users?.filter((u: any) => u.role === 'INSTRUCTOR').length || 0;
                  const adminCount = users?.filter((u: any) => u.role === 'ADMIN').length || 0;
                  return [
                    { label: 'Students', pct: Math.round((studentCount / total) * 100) || 72, color: 'bg-primary text-primary-content' },
                    { label: 'Instructors', pct: Math.round((instrCount / total) * 100) || 20, color: 'bg-accent text-accent-content' },
                    { label: 'Admins', pct: Math.round((adminCount / total) * 100) || 8, color: 'bg-secondary text-secondary-content' },
                  ].map(({ label, pct, color }) => (
                    <div
                      key={label}
                      className={`${color} rounded-full flex flex-col items-center justify-center font-extrabold shadow-md`}
                      style={{ width: `${50 + pct * 0.5}px`, height: `${50 + pct * 0.5}px` }}
                    >
                      <span className="text-base leading-none">{pct}%</span>
                      <span className="text-[9px] font-bold opacity-80 mt-0.5">{label}</span>
                    </div>
                  ));
                })()}
              </div>

              <div className="mt-4 space-y-1">
                {[
                  { label: 'Physical cohorts', val: `${analytics?.physicalCohorts ?? centers?.length ?? 0}` },
                  { label: 'Global pass rate', val: `${analytics?.globalPassRate ?? 0}%` },
                  { label: 'Pending approvals', val: `${pendingCourses?.length ?? 0}` },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-xs font-semibold text-base-content/60">
                    <span>{label}</span>
                    <span className="text-base-content font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── ROW 2: Pending courses + Leaderboard + User growth ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Pending course approvals */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Pending Courses</p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{pendingCourses?.length ?? 0}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">Awaiting your approval</p>
              <div className="space-y-2">
                {(pendingCourses?.length ? pendingCourses : [
                  { id: '1', title: 'React Native Mastery', instructorName: 'Mohamed Ali' },
                  { id: '2', title: 'Laravel 12 Bootcamp', instructorName: 'Sara Ahmed' },
                  { id: '3', title: 'Golang Microservices', instructorName: 'Khaled Omar' },
                ]).slice(0, 4).map((course: any) => (
                  <div key={course.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-base-content truncate">{course.title}</p>
                      <p className="text-[10px] text-base-content/50 font-medium">{course.instructorName || course.instructor?.username || 'Instructor'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => approveMutation.mutate(course.id)}
                        className="btn btn-xs btn-success rounded-lg font-bold"
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(course.id)}
                        className="btn btn-xs btn-error btn-outline rounded-lg font-bold"
                        disabled={rejectMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Top Learners</p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{leaderboard?.length ?? 0}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">By platform XP score</p>
              <div className="space-y-2">
                {(leaderboard?.length ? leaderboard : [
                  { username: 'Ahmed Karim', score: 2840 },
                  { username: 'Sara Nour', score: 2610 },
                  { username: 'Omar Tarek', score: 2390 },
                  { username: 'Layla Hassan', score: 2150 },
                ]).slice(0, 4).map((entry: any, i: number) => (
                  <div key={entry.userId || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? 'bg-yellow-400 text-yellow-900' :
                      i === 1 ? 'bg-gray-300 text-gray-700' :
                        i === 2 ? 'bg-orange-300 text-orange-800' :
                          'bg-base-300 text-base-content/60'
                      }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-base-content truncate">{entry.username || entry.user?.username}</p>
                      <p className="text-[10px] text-base-content/50 font-medium">{(entry.score ?? entry.xp ?? 0).toLocaleString()} XP</p>
                    </div>
                    <div className="w-16 h-1.5 rounded-full bg-base-300 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, ((entry.score ?? entry.xp ?? 0) / 3000) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User growth area chart */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">User Signups</p>
                  <p className="text-2xl font-extrabold text-base-content">
                    {userGrowthChartData.reduce((a: number, d: any) => a + d.current, 0)}
                  </p>
                  <p className="text-xs font-bold text-error flex items-center gap-1 mt-0.5">
                    <TrendingDown className="w-3 h-3" /> -2.1% vs last period
                  </p>
                </div>
                <Link href={`/${locale}/admin/users`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  View Report <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">Last 6 days</p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={userGrowthChartData}>
                    <defs>
                      <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(var(--p))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(var(--p))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ugGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(var(--bc))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="oklch(var(--bc))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'oklch(var(--bc)/0.4)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="prev" name="Last period" stroke="oklch(var(--bc)/0.3)" strokeWidth={1.5} fill="url(#ugGrad2)" dot={false} />
                    <Area type="monotone" dataKey="current" name="This period" stroke="oklch(var(--p))" strokeWidth={2} fill="url(#ugGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Last 6 days
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-base-300 inline-block" /> Last week
                </span>
              </div>
            </div>
          </div>

          {/* ── ROW 3: Full user management table ── */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-base-300 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold text-base-content">User Management</h2>
              <div className="join">
                {['ALL', 'STUDENT', 'INSTRUCTOR', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`join-item btn btn-xs font-bold ${roleFilter === r ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="bg-base-200/60 text-[10px] uppercase tracking-widest text-base-content/40 font-black">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-300">
                  {filteredUsers?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-base-200/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-bold text-base-content text-sm">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-base-content/60 text-xs font-medium">{u.email}</td>
                      <td className="py-3 px-5">
                        <span className={`badge badge-sm font-bold ${ROLE_BADGE[u.role] ?? 'badge-ghost'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <select
                          defaultValue={u.role}
                          onChange={(e) => roleUpdateMutation.mutate({ userId: u.id, role: e.target.value })}
                          className="select select-xs select-bordered rounded-lg font-bold focus:select-primary"
                          disabled={roleUpdateMutation.isPending}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers?.length && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-sm text-base-content/40 font-medium">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}