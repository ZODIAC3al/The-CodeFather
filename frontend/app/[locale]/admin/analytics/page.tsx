"use client";

import {
  Activity,
  BookOpen,
  Building2,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const NAV_MENU = [
  { label: "dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { label: "users", icon: Users, href: "/admin/users" },
  { label: "courses", icon: BookOpen, href: "/admin/courses" },
  { label: "centers", icon: Building2, href: "/admin/centers" },
  { label: "leaderboard", icon: Trophy, href: "/admin/leaderboard" },
  { label: "analytics", icon: Activity, href: "/admin/analytics" },
];

const NAV_OTHERS = [
  { label: "payments", icon: CreditCard, href: "/admin/payments" },
  { label: "enrollments", icon: FileText, href: "/admin/enrollments" },
  { label: "settings", icon: Settings, href: "/admin/settings" },
  { label: "help", icon: HelpCircle, href: "/admin/help" },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral text-neutral-content px-3 py-2 rounded-xl text-xs font-bold shadow-xl">
      <p className="mb-1 text-neutral-content/60">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  const tNav = useTranslations("admin");
  const tChart = useTranslations("chart");
  const tAnalytics = useTranslations("admin.analyticsPage");

  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
    router.push(`/${locale}/login`);
  }

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const { data } = await api.get("/admin/analytics");
      return data;
    },
    enabled: !!(isAuthenticated && user?.role === "ADMIN"),
  });

  const revenueChartData = analytics?.revenueData || [];
  const userGrowthChartData = analytics?.userGrowthData || [];

  if (authLoading || analyticsLoading) {
    return (
      <div
        className="flex flex-col min-h-screen bg-base-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
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
          <p className="text-sm font-extrabold text-primary-content truncate">
            {user?.username}
          </p>
          <p className="text-[10px] text-primary-content/60 font-medium">
            {tNav("superAdmin")}
          </p>
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">
          {tNav("menu")}
        </p>
        {NAV_MENU.map(({ label, icon: Icon, href }) => {
          const active = pathname?.includes(href);
          return (
            <Link
              key={href}
              href={`/${locale}${href}`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                active
                  ? "bg-primary text-primary-content shadow-sm shadow-primary/20"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tNav(label)}
            </Link>
          );
        })}
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">
          {tNav("others")}
        </p>
        {NAV_OTHERS.map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            href={`/${locale}${href}`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-150"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {tNav(label)}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div
      className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
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
            ? "translate-x-0"
            : isRTL
              ? "translate-x-full"
              : "-translate-x-full"
        } ${isRTL ? "right-0" : "left-0"}`}
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
        {/* SIDEBAR desktop */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <SidebarContent />
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn btn-ghost btn-sm btn-circle lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                {tAnalytics("title")}
              </h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {tAnalytics("subtitle")}
              </p>
            </div>
          </div>

          {/* Cards Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: tAnalytics("platformRevenue"),
                val: `$${(analytics?.platformRevenue || 0).toLocaleString()}`,
                desc: tAnalytics("revenueDesc"),
              },
              {
                label: tAnalytics("activeLearners"),
                val: (analytics?.activeStudents || 0).toString(),
                desc: tAnalytics("activeLearnersDesc"),
              },
              {
                label: tAnalytics("globalPassRate"),
                val: `${analytics?.globalPassRate || 0}%`,
                desc: tAnalytics("globalPassRateDesc"),
              },
              {
                label: tAnalytics("physicalCohorts"),
                val: (analytics?.physicalCohorts || 0).toString(),
                desc: tAnalytics("physicalCohortsDesc"),
              },
            ].map(({ label, val, desc }) => (
              <div
                key={label}
                className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-xl font-black text-base-content mt-1">
                    {val}
                  </p>
                </div>
                <p className="text-[9px] text-base-content/50 font-semibold mt-2">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue chart */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm">
              <h2 className="text-sm font-black text-base-content mb-1">
                {tAnalytics("revenueTimeline")}
              </h2>
              <p className="text-[10px] text-base-content/40 font-semibold mb-4">
                {tAnalytics("revenueTimelineDesc")}
              </p>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueChartData} barGap={4}>
                  <CartesianGrid
                    vertical={false}
                    stroke="oklch(var(--bc)/0.06)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "oklch(var(--bc)/0.4)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "oklch(var(--bc)/0.04)" }}
                  />
                  <Bar
                    dataKey="current"
                    name={tChart("thisPeriod")}
                    fill="oklch(var(--p))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="prev"
                    name={tChart("lastPeriod")}
                    fill="oklch(var(--bc)/0.12)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Signup timelines */}
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm">
              <h2 className="text-sm font-black text-base-content mb-1">
                {tAnalytics("userGrowth")}
              </h2>
              <p className="text-[10px] text-base-content/40 font-semibold mb-4">
                {tAnalytics("userGrowthDesc")}
              </p>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userGrowthChartData}>
                  <defs>
                    <linearGradient id="ugGradPage" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="oklch(var(--p))"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(var(--p))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "oklch(var(--bc)/0.4)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="current"
                    name={tChart("thisWeek")}
                    stroke="oklch(var(--p))"
                    strokeWidth={2}
                    fill="url(#ugGradPage)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
