'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { 
  LayoutDashboard, Users, BookOpen, Building2, Trophy, Activity, 
  CreditCard, Settings, HelpCircle, ShieldCheck, TrendingUp, TrendingDown
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

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

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
    router.push(`/${locale}/login`);
  }

  // Load Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics');
      return data;
    },
    enabled: !!(isAuthenticated && user?.role === 'ADMIN'),
  });

  const revenueChartData = analytics?.revenueData || [];
  const userGrowthChartData = analytics?.userGrowthData || [];

  if (authLoading || analyticsLoading) {
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
            <h1 className="text-2xl font-black text-base-content tracking-tight">System Analytics</h1>
            <p className="text-xs text-base-content/50 font-medium mt-0.5">Platform telemetry KPIs and financial metrics</p>
          </div>

          {/* Cards Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Platform Revenue', val: `$${(analytics?.platformRevenue || 0).toLocaleString()}`, desc: 'Paid purchases total' },
              { label: 'Active Learners', val: (analytics?.activeStudents || 0).toString(), desc: 'Enrolled student profiles' },
              { label: 'Global Pass Rate', val: `${analytics?.globalPassRate || 0}%`, desc: 'Average course progress' },
              { label: 'Physical Cohorts', val: (analytics?.physicalCohorts || 0).toString(), desc: 'In-person meeting rooms' }
            ].map(({ label, val, desc }) => (
              <div key={label} className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-xl font-black text-base-content mt-1">{val}</p>
                </div>
                <p className="text-[9px] text-base-content/50 font-semibold mt-2">{desc}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Revenue chart */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm">
              <h2 className="text-sm font-black text-base-content mb-1">Revenue Timeline</h2>
              <p className="text-[10px] text-base-content/40 font-semibold mb-4">Platform billing over the last 12 days</p>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueChartData} barGap={4}>
                  <CartesianGrid vertical={false} stroke="oklch(var(--bc)/0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'oklch(var(--bc)/0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(var(--bc)/0.04)' }} />
                  <Bar dataKey="current" name="This period" fill="oklch(var(--p))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="prev" name="Last period" fill="oklch(var(--bc)/0.12)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Signup timelines */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm">
              <h2 className="text-sm font-black text-base-content mb-1">User growth Signups</h2>
              <p className="text-[10px] text-base-content/40 font-semibold mb-4">Registration events over the last 6 days</p>
              
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userGrowthChartData}>
                  <defs>
                    <linearGradient id="ugGradPage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(var(--p))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(var(--p))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'oklch(var(--bc)/0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="current" name="This week" stroke="oklch(var(--p))" strokeWidth={2} fill="url(#ugGradPage)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
