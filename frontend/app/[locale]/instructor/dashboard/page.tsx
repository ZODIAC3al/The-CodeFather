'use client';

import {
	BookOpen,
	Calendar,
	ChevronRight,
	ClipboardList,
	CreditCard,
	Eye,
	HelpCircle,
	Layers,
	LayoutDashboard,
	Menu,
	Plus,
	Settings,
	Star,
	TrendingDown,
	TrendingUp,
	Users,
	Video,
	X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
} from 'recharts';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
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
// Nav config — using i18n keys
// ─────────────────────────────────────────────
const NAV_MENU = [
  { labelKey: 'dashboard',  icon: LayoutDashboard, href: '/instructor/dashboard' },
  { labelKey: 'myCourses',  icon: BookOpen,         href: '/instructor/courses'   },
  { labelKey: 'students',   icon: Users,            href: '/instructor/students'  },
  { labelKey: 'schedule',   icon: Calendar,         href: '/instructor/schedule'  },
  { labelKey: 'reviews',    icon: Star,             href: '/instructor/reviews'   },
];
const NAV_OTHERS = [
  { labelKey: 'meetings', icon: Video,       href: '/meetings'             },
  { labelKey: 'payments', icon: CreditCard,  href: '/instructor/payments'  },
  { labelKey: 'settings', icon: Settings,    href: '/settings'             },
  { labelKey: 'help',     icon: HelpCircle,  href: '/help'                 },
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
// Sidebar (shared inner component)
// ─────────────────────────────────────────────
function InstructorSidebar({
  user, pathname, locale,
  tMenu, tOthers,
  isOpen, onClose,
}: {
  user: any; pathname: string | null; locale: string;
  tMenu: (k: string) => string; tOthers: (k: string) => string;
  isOpen: boolean; onClose: () => void;
}) {
  const isRTL = locale === 'ar';

  const sidebarContent = (
    <div className="flex flex-col gap-1 h-full">
      <div className="bg-base-100 rounded-2xl border border-base-300 p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-primary-content text-sm shrink-0">
          {user?.username?.[0]?.toUpperCase() ?? 'I'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-base-content truncate">{user?.username}</p>
          <p className="text-[10px] text-base-content/50 font-medium">
            {tMenu('instructorRole') || 'Instructor'}
          </p>
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">
          {tOthers('menu')}
        </p>
        {NAV_MENU.map(({ labelKey, icon: Icon, href }) => {
          const active = pathname?.includes(href);
          return (
            <Link
              key={href}
              href={`/${locale}${href}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tMenu(labelKey)}
            </Link>
          );
        })}
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">
          {tOthers('others')}
        </p>
        {NAV_OTHERS.map(({ labelKey, icon: Icon, href }) => (
          <Link
            key={href}
            href={`/${locale}${href}`}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-200"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {tOthers(labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        {/* Drawer panel */}
        <div
          className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-64 bg-base-200 p-4 shadow-2xl
            transition-transform duration-300 ease-in-out overflow-y-auto
            ${isOpen
              ? 'translate-x-0'
              : isRTL ? 'translate-x-full' : '-translate-x-full'
            }`}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} btn btn-ghost btn-sm btn-circle`}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mt-10">
            {sidebarContent}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function InstructorDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const qc = useQueryClient();
  const isRTL = locale === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tInstructor = useTranslations('instructor');
  const tAdmin      = useTranslations('admin');
  const tChart      = useTranslations('chart');

  if (!authLoading && (!isAuthenticated || user?.role !== 'INSTRUCTOR')) {
    router.push(`/${locale}/login`);
  }

  // ── Queries ──────────────────────────────────────────────────────────────
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

  const { data: cohorts = [] } = useQuery({
    queryKey: ['instructorCohorts'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/cohorts');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  const { data: pendingReviews = [] } = useQuery({
    queryKey: ['instructorPendingReviews'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/pending-reviews');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  const { data: schedule = [] } = useQuery({
    queryKey: ['instructorSchedule'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/schedule');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const { data } = await api.get('/enrollments/my');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  const firstCourseId = myCourses[0]?.id ?? myCourses[0]?._id;
  const { data: courseReviews = [] } = useQuery({
    queryKey: ['courseReviews', firstCourseId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${firstCourseId}`);
      return data ?? [];
    },
    enabled: !!firstCourseId,
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, grade }: { submissionId: string; grade: string }) => {
      const { data } = await api.patch(`/instructor/submissions/${submissionId}/grade`, { grade });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructorPendingReviews'] }),
  });

  // ── Derived KPIs ─────────────────────────────────────────────────────────
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

  // ── Chart data ────────────────────────────────────────────────────────────
  const revenueChartData = useMemo(() => {
    const priceMap: Record<string, number> = {};
    myCourses.forEach((c: any) => { priceMap[c.id ?? c._id] = Number(c.price ?? 0); });
    const enriched = enrollments.map((e: any) => ({ ...e, value: priceMap[e.courseId] ?? 0 }));
    return buildDailySeries(enriched, 'createdAt', 'value', 12);
  }, [enrollments, myCourses]);

  const enrollmentChartData = useMemo(
    () => buildDailySeries(enrollments, 'createdAt', null, 6),
    [enrollments],
  );

  const enCurrentTotal  = enrollmentChartData.reduce((a, d) => a + d.current, 0);
  const enPrevTotal     = enrollmentChartData.reduce((a, d) => a + d.prev, 0);
  const enTrend         = enPrevTotal > 0 ? (((enCurrentTotal - enPrevTotal) / enPrevTotal) * 100).toFixed(1) : null;
  const enTrendUp       = enPrevTotal === 0 || enCurrentTotal >= enPrevTotal;

  const revCurrentTotal = revenueChartData.reduce((a, d) => a + d.current, 0);
  const revPrevTotal    = revenueChartData.reduce((a, d) => a + d.prev, 0);
  const revTrend        = revPrevTotal > 0 ? (((revCurrentTotal - revPrevTotal) / revPrevTotal) * 100).toFixed(1) : null;
  const revTrendUp      = revPrevTotal === 0 || revCurrentTotal >= revPrevTotal;

  const activeEnrollments    = enrollments.filter((e: any) => e.status === 'ACTIVE' || !e.completedAt).length;
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'COMPLETED' || e.completedAt).length;
  const total                = enrollments.length || 1;
  const activePct    = Math.round((activeEnrollments    / total) * 100);
  const completedPct = Math.round((completedEnrollments / total) * 100);
  const pendingPct   = Math.max(0, 100 - activePct - completedPct);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || coursesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-base-200 transition-all duration-300"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Navbar />

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-base-100 border-b border-base-300">
        <button
          onClick={() => setSidebarOpen(true)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold text-base-content">{tInstructor('dashboard') || 'Dashboard'}</span>
      </div>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        {/* Sidebar */}
        <InstructorSidebar
          user={user}
          pathname={pathname}
          locale={locale}
          tMenu={(k) => {
            const map: Record<string, string> = {
              dashboard: tAdmin('dashboard'),
              myCourses: tInstructor('myCourses'),
              students:  tInstructor('students'),
              schedule:  tInstructor('schedule'),
              reviews:   tInstructor('reviews'),
              instructorRole: 'Instructor',
            };
            return map[k] ?? k;
          }}
          tOthers={(k) => {
            const map: Record<string, string> = {
              menu:     tAdmin('menu'),
              others:   tAdmin('others'),
              meetings: tAdmin('meetings'),
              payments: tAdmin('payments'),
              settings: tAdmin('settings'),
              help:     tAdmin('help'),
            };
            return map[k] ?? k;
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-base-content tracking-tight">
                {tAdmin('dashboard')}
              </h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {locale === 'ar'
                  ? `مرحباً بعودتك، ${user?.username}. إليك ما يحدث.`
                  : `Welcome back, ${user?.username}. Here's what's happening.`}
              </p>
            </div>
            <Link
              href={`/${locale}/courses/create`}
              className="btn btn-primary btn-sm rounded-xl flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">
                {locale === 'ar' ? 'دورة جديدة' : 'New Course'}
              </span>
            </Link>
          </div>

          {/* ROW 1 — Revenue chart + Enrollment bubble panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Revenue bar chart */}
            <div className="lg:col-span-3 bg-base-100 rounded-2xl border border-base-300 p-4 sm:p-5">
              <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">
                    {tAdmin('payments')}
                  </p>
                  <p className="text-2xl font-extrabold text-base-content">${totalRevenue.toLocaleString()}</p>
                  {revTrend !== null ? (
                    <p className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${revTrendUp ? 'text-success' : 'text-error'}`}>
                      {revTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {revTrendUp ? '+' : ''}{revTrend}% {locale === 'ar' ? 'مقارنة بالفترة الماضية' : 'vs last period'}
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/40 mt-0.5">
                      {locale === 'ar' ? 'لا توجد بيانات سابقة' : 'No prior period data'}
                    </p>
                  )}
                </div>
                <Link
                  href={`/${locale}/instructor/payments`}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {tAdmin('analyticsPage.viewReport') || (locale === 'ar' ? 'عرض التقرير' : 'View Report')}
                  <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">{tChart('salesLast12Days')}</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenueChartData} barGap={4}>
                  <CartesianGrid vertical={false} stroke="oklch(var(--bc)/0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'oklch(var(--bc)/0.4)' }} axisLine={false} tickLine={false} reversed={isRTL} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(var(--bc)/0.04)' }} />
                  <Bar dataKey="current" name={tChart('thisPeriod')} fill="oklch(var(--p))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="prev"    name={tChart('lastPeriod')} fill="oklch(var(--bc)/0.12)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  {tChart('currentPeriod')}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-base-300 inline-block" />
                  {tChart('lastPeriod')}
                </span>
              </div>
            </div>

            {/* Enrollment bubble breakdown */}
            <div className="lg:col-span-2 bg-base-100 rounded-2xl border border-base-300 p-4 sm:p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">
                    {tInstructor('students')}
                  </p>
                  <p className="text-2xl font-extrabold text-base-content">{totalStudents}</p>
                  {enTrend !== null ? (
                    <p className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${enTrendUp ? 'text-success' : 'text-error'}`}>
                      {enTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {enTrendUp ? '+' : ''}{enTrend}% {locale === 'ar' ? 'هذا الأسبوع' : 'this week'}
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/40 mt-0.5">
                      {enCurrentTotal} {locale === 'ar' ? 'جديد هذا الأسبوع' : 'new this week'}
                    </p>
                  )}
                </div>
                <Link
                  href={`/${locale}/instructor/students`}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {locale === 'ar' ? 'عرض' : 'View'}
                  <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>

              <div className="flex-1 flex items-center justify-center gap-3 py-2 flex-wrap">
                {[
                  { label: locale === 'ar' ? 'نشط' : 'Active',    pct: activePct,    color: 'bg-primary text-primary-content'   },
                  { label: locale === 'ar' ? 'مكتمل' : 'Completed', pct: completedPct, color: 'bg-accent text-accent-content'     },
                  { label: locale === 'ar' ? 'معلق' : 'Pending',   pct: pendingPct,   color: 'bg-secondary text-secondary-content' },
                ].map(({ label, pct, color }) => (
                  <div
                    key={label}
                    className={`${color} rounded-full flex flex-col items-center justify-center font-extrabold shadow-md shrink-0`}
                    style={{ width: `${60 + pct * 0.5}px`, height: `${60 + pct * 0.5}px` }}
                  >
                    <span className="text-lg leading-none">{pct}%</span>
                    <span className="text-[9px] font-bold opacity-80 mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1">
                {[
                  { label: locale === 'ar' ? 'المتعلمون النشطون' : 'Active learners', val: `${activeEnrollments}` },
                  { label: locale === 'ar' ? 'الإتمامات' : 'Completions', val: `${completedEnrollments}` },
                  { label: locale === 'ar' ? 'متوسط التقييم' : 'Avg rating', val: avgRating ? `${avgRating} / 5` : (locale === 'ar' ? 'لا توجد تقييمات' : 'No reviews yet') },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-xs font-semibold text-base-content/60">
                    <span>{label}</span>
                    <span className="text-base-content font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2 — Cohorts + Pending reviews + Enrollment chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Active cohorts */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-4 sm:p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">
                {locale === 'ar' ? 'المجموعات النشطة' : 'Active Cohorts'}
              </p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{cohorts.length}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">
                {locale === 'ar' ? 'حلقات الدراسة الجارية' : 'Running study circles'}
              </p>
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
                          {item.enrollmentCount ?? item.studentCount ?? item.students?.length ?? 0}{' '}
                          {locale === 'ar' ? 'طالب' : 'students'}
                        </p>
                      </div>
                      <span className={`badge badge-xs font-bold ${item.status === 'ACTIVE' ? 'badge-primary' : 'badge-ghost'}`}>
                        {item.status ?? (locale === 'ar' ? 'مباشر' : 'Live')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-base-content/40 font-medium">
                    {locale === 'ar' ? 'لا توجد مجموعات مجدولة بعد.' : 'No cohorts scheduled yet.'}
                  </p>
                </div>
              )}
            </div>

            {/* Pending reviews */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-4 sm:p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">
                {locale === 'ar' ? 'المراجعات المعلقة' : 'Pending Reviews'}
              </p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{pendingReviews.length}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">
                {locale === 'ar' ? 'تقديمات بانتظار التقييم' : 'Submissions awaiting grade'}
              </p>
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
                          {rev.studentName ?? rev.student?.username ?? (locale === 'ar' ? 'طالب' : 'Student')}
                        </p>
                        <p className="text-[10px] text-base-content/50 font-medium">
                          {rev.courseName ?? rev.course?.title ?? rev.title ?? '—'}
                        </p>
                      </div>
                      <Link
                        href={`/${locale}/instructor/submissions/${rev.id ?? rev._id}`}
                        className="btn btn-xs btn-ghost text-primary font-bold"
                      >
                        {locale === 'ar' ? 'تقييم' : 'Grade'}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-base-content/40 font-medium">
                    {locale === 'ar' ? 'رائع — لا توجد مراجعات معلقة.' : 'All caught up — no pending reviews.'}
                  </p>
                </div>
              )}
            </div>

            {/* Enrollment area chart */}
            <div className="sm:col-span-2 lg:col-span-1 bg-base-100 rounded-2xl border border-base-300 p-4 sm:p-5 flex flex-col">
              <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
                <div>
                  <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">
                    {locale === 'ar' ? 'تسجيلات جديدة' : 'New Enrollments'}
                  </p>
                  <p className="text-2xl font-extrabold text-base-content">{enCurrentTotal}</p>
                  {enTrend !== null ? (
                    <p className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${enTrendUp ? 'text-success' : 'text-error'}`}>
                      {enTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {enTrendUp ? '+' : ''}{enTrend}% {locale === 'ar' ? 'مقارنة بالفترة الماضية' : 'vs last period'}
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/40 mt-0.5">{tChart('last6Days')}</p>
                  )}
                </div>
                <Link
                  href={`/${locale}/instructor/students`}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {locale === 'ar' ? 'عرض' : 'View'}
                  <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">
                {locale === 'ar' ? 'التسجيلات اليومية — آخر 6 أيام مقارنة بالـ 6 السابقة' : 'Daily enrollments — last 6 days vs prior 6'}
              </p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={enrollmentChartData}>
                    <defs>
                      <linearGradient id="enGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="oklch(var(--p))"  stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(var(--p))"  stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="enGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="oklch(var(--bc))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="oklch(var(--bc))" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'oklch(var(--bc)/0.4)' }} axisLine={false} tickLine={false} reversed={isRTL} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="prev"    name={tChart('lastPeriod')}  stroke="oklch(var(--bc)/0.3)" strokeWidth={1.5} fill="url(#enGrad2)" dot={false} />
                    <Area type="monotone" dataKey="current" name={tChart('thisPeriod')} stroke="oklch(var(--p))"      strokeWidth={2}   fill="url(#enGrad)"  dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  {tChart('last6Days')}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-base-content/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-base-300 inline-block" />
                  {tChart('lastPeriod')}
                </span>
              </div>
            </div>
          </div>

          {/* ROW 3 — Upcoming schedule + Published courses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Upcoming sessions */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-4 sm:p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-1">
                {tInstructor('upcomingEvents')}
              </p>
              <p className="text-2xl font-extrabold text-base-content mb-0.5">{schedule.length}</p>
              <p className="text-[10px] text-base-content/40 font-medium mb-4">
                {locale === 'ar' ? 'من /instructor/schedule' : 'From /instructor/schedule'}
              </p>
              {schedule.length > 0 ? (
                <div className="space-y-2">
                  {schedule.slice(0, 5).map((s: any) => (
                    <div key={s.id ?? s._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-base-200 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-base-content truncate">
                          {s.title ?? s.name ?? (locale === 'ar' ? 'جلسة' : 'Session')}
                        </p>
                        <p className="text-[10px] text-base-content/50 font-medium">
                          {s.scheduledAt
                            ? new Date(s.scheduledAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })
                            : s.date ?? '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-base-content/40 text-center py-6">
                  {locale === 'ar' ? 'لا توجد جلسات قادمة.' : 'No upcoming sessions.'}
                </p>
              )}
            </div>

            {/* My courses table */}
            <div className="lg:col-span-2 bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-base-300 flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-sm font-extrabold text-base-content">
                  {tInstructor('myCourses')}
                  <span className="ms-2 badge badge-primary badge-xs font-bold">{myCourses.length}</span>
                </h2>
                <Link
                  href={`/${locale}/courses/create`}
                  className="btn btn-xs btn-primary rounded-lg font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {locale === 'ar' ? 'إضافة جديدة' : 'Add New'}
                </Link>
              </div>

              {myCourses.length > 0 ? (
                <div className="divide-y divide-base-300">
                  {myCourses.map((course: any) => (
                    <div
                      key={course.id ?? course._id}
                      className="px-4 sm:px-5 py-3.5 flex items-center justify-between hover:bg-base-200/40 transition-colors gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-base-300 overflow-hidden shrink-0">
                          {course.thumbnail
                            ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <BookOpen className="w-4 h-4 text-primary" />
                              </div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-base-content leading-tight truncate max-w-[180px]">
                            {course.title}
                          </p>
                          <p className="text-[10px] text-base-content/50 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />{course.enrollmentCount ?? 0}{' '}
                              {locale === 'ar' ? 'طالب' : 'students'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {course.lessons?.length ?? course.lessonCount ?? 0}{' '}
                              {locale === 'ar' ? 'دروس' : 'lessons'}
                            </span>
                            {course.price != null && (
                              <span className="font-bold text-primary">${course.price}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge badge-xs font-bold ${
                          course.status === 'PUBLISHED' || course.isPublished ? 'badge-success' : 'badge-warning'
                        }`}>
                          {course.status === 'PUBLISHED' || course.isPublished
                            ? (locale === 'ar' ? 'منشور' : 'Published')
                            : (locale === 'ar' ? 'مسودة' : 'Draft')}
                        </span>
                        <Link
                          href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}`}
                          className="btn btn-xs btn-ghost text-base-content/50 hover:text-primary flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">{locale === 'ar' ? 'عرض' : 'View'}</span>
                        </Link>
                        <Link
                          href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}/edit`}
                          className="btn btn-xs btn-ghost text-base-content/50 hover:text-primary flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          <span className="hidden sm:inline">{locale === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-base-content/40 font-medium py-10">
                  {locale === 'ar' ? 'لا توجد دورات بعد. أنشئ دورتك الأولى!' : 'No courses yet. Create your first course!'}
                </p>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}