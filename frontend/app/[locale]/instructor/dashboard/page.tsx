'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard, BookOpen, Users, Calendar, Star,
  Settings, CreditCard, HelpCircle, Plus, TrendingUp,
  TrendingDown, ClipboardList, Video, ChevronRight, Eye, Layers,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Build a last-N-days series from an array of items that have a date field */
function buildDailySeries(
  items: any[],
  dateField: string,
  valueField: string | null,
  days: number,
): { day: string; current: number; prev: number }[] {
  const now = Date.now();
  const DAY = 86_400_000;

  const bucketsCurrent: Record<string, number> = {};
  const bucketsPrev: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const key = String(d.getDate()).padStart(2, '0');
    bucketsCurrent[key] = 0;
    bucketsPrev[key] = 0;
  }

  items.forEach((item) => {
    const ts = new Date(item[dateField]).getTime();
    const val = valueField ? Number(item[valueField] ?? 0) : 1;
    const daysAgo = Math.floor((now - ts) / DAY);

    if (daysAgo >= 0 && daysAgo < days) {
      const key = String(new Date(ts).getDate()).padStart(2, '0');
      bucketsCurrent[key] = (bucketsCurrent[key] ?? 0) + val;
    } else if (daysAgo >= days && daysAgo < days * 2) {
      const key = String(new Date(ts).getDate()).padStart(2, '0');
      bucketsPrev[key] = (bucketsPrev[key] ?? 0) + val;
    }
  });

  return Object.keys(bucketsCurrent).map((day) => ({
    day,
    current: bucketsCurrent[day] ?? 0,
    prev: bucketsPrev[day] ?? 0,
  }));
}

// ─────────────────────────────────────────────
// Static nav
// ─────────────────────────────────────────────
const NAV_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/instructor/dashboard' },
  { label: 'My Courses', icon: BookOpen, href: '/instructor/courses' },
  { label: 'Students', icon: Users, href: '/instructor/students' },
  { label: 'Schedule', icon: Calendar, href: '/instructor/schedule' },
  { label: 'Reviews', icon: Star, href: '/instructor/reviews' },
];
const NAV_OTHERS = [
  { label: 'Meetings', icon: Video, href: '/meetings' },
  { label: 'Payments', icon: CreditCard, href: '/instructor/payments' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

// ─────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function InstructorDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const qc = useQueryClient();

  if (!authLoading && (!isAuthenticated || user?.role !== 'INSTRUCTOR')) {
    router.push(`/${locale}/login`);
  }

  // ── 1. Instructor's own courses (showAll includes drafts) ──
  const { data: myCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['instructorCourses', user?.sub],
    queryFn: async () => {
      const { data } = await api.get('/courses', {
        params: { instructorId: user?.sub, showAll: 'true' },
      });
      return data.data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR' && user?.sub),
  });

  // ── 2. Cohorts ──
  const { data: cohorts = [] } = useQuery({
    queryKey: ['instructorCohorts'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/cohorts');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  // ── 3. Pending reviews / submissions to grade ──
  const { data: pendingReviews = [] } = useQuery({
    queryKey: ['instructorPendingReviews'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/pending-reviews');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  // ── 4. Schedule (upcoming sessions) ──
  const { data: schedule = [] } = useQuery({
    queryKey: ['instructorSchedule'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/schedule');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  // ── 5. My enrollments — used to derive enrollment trend chart ──
  const { data: enrollments = [] } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const { data } = await api.get('/enrollments/my');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  // ── 6. Reviews for each course (aggregate avg rating) ──
  //   We fetch reviews for every course the instructor owns.
  //   To keep it a single query we pass all courseIds together if the API
  //   supports it; otherwise we fall back to fetching the first course only
  //   for a representative sample, since there's no /instructor/reviews summary.
  const firstCourseId = myCourses[0]?.id ?? myCourses[0]?._id;
  const { data: courseReviews = [] } = useQuery({
    queryKey: ['courseReviews', firstCourseId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${firstCourseId}`);
      return data ?? [];
    },
    enabled: !!firstCourseId,
  });

  // ── 7. Instructor meetings ──
  const { data: meetings = [] } = useQuery({
    queryKey: ['instructorMeetings'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/meetings');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  // ── Grade submission mutation ──
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, grade }: { submissionId: string; grade: string }) => {
      const { data } = await api.patch(`/instructor/submissions/${submissionId}/grade`, { grade });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructorPendingReviews'] }),
  });

  // ─── Derived KPIs (all from real API data) ───────────────────────────────
  const totalStudents = useMemo(
    () => myCourses.reduce((acc: number, c: any) => acc + (c.enrollmentCount ?? 0), 0),
    [myCourses],
  );

  const totalRevenue = useMemo(
    () => myCourses.reduce(
      (acc: number, c: any) => acc + (Number(c.price ?? 0) * (c.enrollmentCount ?? 0)),
      0,
    ),
    [myCourses],
  );

  const avgRating = useMemo(() => {
    if (!courseReviews.length) return null;
    const sum = courseReviews.reduce((a: number, r: any) => a + (r.rating ?? 0), 0);
    return (sum / courseReviews.length).toFixed(1);
  }, [courseReviews]);

  const activeCourses = myCourses.filter((c: any) => c.status === 'PUBLISHED' || c.isPublished).length;
  const draftCourses = myCourses.filter((c: any) => c.status === 'DRAFT' || !c.isPublished).length;

  // ─── Chart series derived from real enrollment timestamps ───────────────
  const revenueChartData = useMemo(() => {
    // Build per-day revenue series from enrollments that have course price
    // Each enrollment carries createdAt + courseId; we match course price
    const priceMap: Record<string, number> = {};
    myCourses.forEach((c: any) => {
      priceMap[c.id ?? c._id] = Number(c.price ?? 0);
    });

    const enriched = enrollments.map((e: any) => ({
      ...e,
      value: priceMap[e.courseId] ?? 0,
    }));

    return buildDailySeries(enriched, 'createdAt', 'value', 12);
  }, [enrollments, myCourses]);

  const enrollmentChartData = useMemo(
    () => buildDailySeries(enrollments, 'createdAt', null, 6),
    [enrollments],
  );

  // Trend comparison (current 6-day total vs prev 6-day total)
  const enCurrentTotal = enrollmentChartData.reduce((a, d) => a + d.current, 0);
  const enPrevTotal = enrollmentChartData.reduce((a, d) => a + d.prev, 0);
  const enTrend = enPrevTotal > 0
    ? (((enCurrentTotal - enPrevTotal) / enPrevTotal) * 100).toFixed(1)
    : null;
  const enTrendUp = enPrevTotal === 0 || enCurrentTotal >= enPrevTotal;

  const revCurrentTotal = revenueChartData.reduce((a, d) => a + d.current, 0);
  const revPrevTotal = revenueChartData.reduce((a, d) => a + d.prev, 0);
  const revTrend = revPrevTotal > 0
    ? (((revCurrentTotal - revPrevTotal) / revPrevTotal) * 100).toFixed(1)
    : null;
  const revTrendUp = revPrevTotal === 0 || revCurrentTotal >= revPrevTotal;

  // Bubble breakdown from real enrollment statuses
  const activeEnrollments = enrollments.filter((e: any) => e.status === 'ACTIVE' || !e.completedAt).length;
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'COMPLETED' || e.completedAt).length;
  const total = enrollments.length || 1;
  const activePct = Math.round((activeEnrollments / total) * 100);
  const completedPct = Math.round((completedEnrollments / total) * 100);
  const pendingPct = Math.max(0, 100 - activePct - completedPct);

  // ─────────────────────────────────────────────
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
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <div className="bg-base-100 rounded-2xl border border-base-300 p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-primary-content text-sm shrink-0">
              {user?.username?.[0]?.toUpperCase() ?? 'I'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-base-content truncate">{user?.username}</p>
              <p className="text-[10px] text-base-content/50 font-medium">Instructor</p>
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

        {/* ── MAIN ── */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-base-content tracking-tight">Dashboard</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                Welcome back, {user?.username}. Here's what's happening.
              </p>
            </div>
            <Link href={`/${locale}/courses/create`}
              className="btn btn-primary btn-sm rounded-xl flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" /> New Course
            </Link>
          </div>

          {/* ROW 1 — Revenue chart  +  Enrollment bubble panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Revenue bar chart */}
            <div className="lg:col-span-3 bg-base-100 rounded-2xl border border-base-300 p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Revenue</p>
                  <p className="text-2xl font-extrabold text-base-content">${totalRevenue.toLocaleString()}</p>
                  {revTrend !== null ? (
                    <p className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${revTrendUp ? 'text-success' : 'text-error'}`}>
                      {revTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {revTrendUp ? '+' : ''}{revTrend}% vs last period
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/40 mt-0.5">No prior period data</p>
                  )}
                </div>
                <Link href={`/${locale}/instructor/payments`}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
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

            {/* Enrollment bubble breakdown */}
            <div className="lg:col-span-2 bg-base-100 rounded-2xl border border-base-300 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Enrollments</p>
                  <p className="text-2xl font-extrabold text-base-content">{totalStudents}</p>
                  {enTrend !== null ? (
                    <p className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${enTrendUp ? 'text-success' : 'text-error'}`}>
                      {enTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {enTrendUp ? '+' : ''}{enTrend}% this week
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/40 mt-0.5">{enCurrentTotal} new this week</p>
                  )}
                </div>
                <Link href={`/${locale}/instructor/students`}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  View <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex-1 flex items-center justify-center gap-3 py-2">
                {[
                  { label: 'Active', pct: activePct, color: 'bg-primary text-primary-content' },
                  { label: 'Completed', pct: completedPct, color: 'bg-accent text-accent-content' },
                  { label: 'Pending', pct: pendingPct, color: 'bg-secondary text-secondary-content' },
                ].map(({ label, pct, color }) => (
                  <div key={label}
                    className={`${color} rounded-full flex flex-col items-center justify-center font-extrabold shadow-md`}
                    style={{ width: `${60 + pct * 0.5}px`, height: `${60 + pct * 0.5}px` }}
                  >
                    <span className="text-lg leading-none">{pct}%</span>
                    <span className="text-[9px] font-bold opacity-80 mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1">
                {[
                  { label: 'Active learners', val: `${activeEnrollments}` },
                  { label: 'Completions', val: `${completedEnrollments}` },
                  { label: 'Avg rating', val: avgRating ? `${avgRating} / 5` : 'No reviews yet' },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-xs font-semibold text-base-content/60">
                    <span>{label}</span>
                    <span className="text-base-content font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2 — Cohorts  +  Pending reviews  +  Enrollment chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Active cohorts from /instructor/cohorts */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Active Cohorts</p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{cohorts.length}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">Running study circles</p>

              {cohorts.length > 0 ? (
                <div className="space-y-2">
                  {cohorts.slice(0, 5).map((item: any) => (
                    <div key={item.id ?? item._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-base-content truncate">{item.title ?? item.name}</p>
                        <p className="text-[10px] text-base-content/50 font-medium">
                          {item.enrollmentCount ?? item.studentCount ?? item.students?.length ?? 0} students
                        </p>
                      </div>
                      <span className={`badge badge-xs font-bold ${item.status === 'ACTIVE' ? 'badge-primary' : 'badge-ghost'}`}>
                        {item.status ?? 'Live'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-base-content/40 font-medium">No cohorts scheduled yet.</p>
                </div>
              )}
            </div>

            {/* Pending submissions from /instructor/pending-reviews */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Pending Reviews</p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{pendingReviews.length}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">Submissions awaiting grade</p>

              {pendingReviews.length > 0 ? (
                <div className="space-y-2">
                  {pendingReviews.slice(0, 4).map((rev: any) => (
                    <div key={rev.id ?? rev._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-base-content truncate">
                          {rev.studentName ?? rev.student?.username ?? 'Student'}
                        </p>
                        <p className="text-[10px] text-base-content/50 font-medium">
                          {rev.courseName ?? rev.course?.title ?? rev.title ?? '—'}
                        </p>
                      </div>
                      <Link href={`/${locale}/instructor/submissions/${rev.id ?? rev._id}`}
                        className="btn btn-xs btn-ghost text-primary font-bold">
                        Grade
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-base-content/40 font-medium">All caught up — no pending reviews.</p>
                </div>
              )}
            </div>

            {/* Enrollment area chart — from real enrollments timestamps */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">New Enrollments</p>
                  <p className="text-2xl font-extrabold text-base-content">{enCurrentTotal}</p>
                  {enTrend !== null ? (
                    <p className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${enTrendUp ? 'text-success' : 'text-error'}`}>
                      {enTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {enTrendUp ? '+' : ''}{enTrend}% vs last period
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/40 mt-0.5">Last 6 days</p>
                  )}
                </div>
                <Link href={`/${locale}/instructor/students`}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  View <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">Daily enrollments — last 6 days vs prior 6</p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={enrollmentChartData}>
                    <defs>
                      <linearGradient id="enGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(var(--p))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(var(--p))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="enGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(var(--bc))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="oklch(var(--bc))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'oklch(var(--bc)/0.4)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="prev" name="Prior period" stroke="oklch(var(--bc)/0.3)" strokeWidth={1.5} fill="url(#enGrad2)" dot={false} />
                    <Area type="monotone" dataKey="current" name="This period" stroke="oklch(var(--p))" strokeWidth={2} fill="url(#enGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Last 6 days
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-base-300 inline-block" /> Prior 6 days
                </span>
              </div>
            </div>
          </div>

          {/* ROW 3 — Upcoming schedule  +  Published courses table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Upcoming from /instructor/schedule */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">Upcoming Sessions</p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{schedule.length}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">From /instructor/schedule</p>

              {schedule.length > 0 ? (
                <div className="space-y-2">
                  {schedule.slice(0, 5).map((s: any) => (
                    <div key={s.id ?? s._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-base-content truncate">{s.title ?? s.name ?? 'Session'}</p>
                        <p className="text-[10px] text-base-content/50 font-medium">
                          {s.scheduledAt
                            ? new Date(s.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : s.date ?? '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-base-content/40 text-center py-6">No upcoming sessions.</p>
              )}
            </div>

            {/* Published courses — lg:col-span-2 */}
            <div className="lg:col-span-2 bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
              <div className="px-5 py-4 border-b border-base-300 flex justify-between items-center">
                <h2 className="text-sm font-extrabold text-base-content">
                  My Courses
                  <span className="ml-2 badge badge-primary badge-xs font-bold">{myCourses.length}</span>
                </h2>
                <Link href={`/${locale}/courses/create`}
                  className="btn btn-xs btn-primary rounded-lg font-bold flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add New
                </Link>
              </div>

              {myCourses.length > 0 ? (
                <div className="divide-y divide-base-300">
                  {myCourses.map((course: any) => (
                    <div key={course.id ?? course._id}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-base-200/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-base-300 overflow-hidden shrink-0">
                          {course.thumbnail
                            ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content leading-tight">{course.title}</p>
                          <p className="text-[10px] text-base-content/50 font-medium flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />{course.enrollmentCount ?? 0} students
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />{course.lessons?.length ?? course.lessonCount ?? 0} lessons
                            </span>
                            {course.price != null && (
                              <span className="font-bold text-primary">${course.price}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge badge-xs font-bold ${course.status === 'PUBLISHED' || course.isPublished
                          ? 'badge-success' : 'badge-warning'
                          }`}>
                          {course.status ?? (course.isPublished ? 'Published' : 'Draft')}
                        </span>
                        <Link href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}`}
                          className="btn btn-xs btn-ghost text-base-content/50 hover:text-primary flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </Link>
                        <Link href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}/edit`}
                          className="btn btn-xs btn-ghost text-base-content/50 hover:text-primary flex items-center gap-1">
                          <Settings className="w-3 h-3" /> Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-base-content/40 font-medium py-10">
                  No courses yet. Create your first course!
                </p>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}