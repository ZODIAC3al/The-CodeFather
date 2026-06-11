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
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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

export default function AdminLeaderboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  const tNav = useTranslations("admin");
  const tLeaderboard = useTranslations("admin.leaderboardPage");

  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
    router.push(`/${locale}/login`);
  }

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ["adminLeaderboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/leaderboard");
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === "ADMIN"),
  });

  if (authLoading || leaderboardLoading) {
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
                {tLeaderboard("title")}
              </h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {tLeaderboard("subtitle")}
              </p>
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-base-300">
              <h2 className="text-sm font-black text-base-content">
                {tLeaderboard("learnerRankings")}
              </h2>
            </div>

            {leaderboard.length > 0 ? (
              <div className="p-4 space-y-3">
                {leaderboard.map((entry: any, i: number) => (
                  <div
                    key={entry.userId || i}
                    className="flex items-center justify-between p-3.5 bg-base-200/40 hover:bg-base-200 rounded-2xl border border-base-300 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          i === 0
                            ? "bg-yellow-400 text-yellow-950 shadow-md shadow-yellow-400/20"
                            : i === 1
                              ? "bg-gray-300 text-gray-850 shadow-md shadow-gray-300/20"
                              : i === 2
                                ? "bg-orange-350 text-orange-950 shadow-md shadow-orange-350/20"
                                : "bg-base-300 text-base-content/60"
                        }`}
                      >
                        {i + 1}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary/5">
                          {entry.user?.avatar ? (
                            <img
                              src={entry.user.avatar}
                              alt=""
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            entry.username?.[0]?.toUpperCase() || "L"
                          )}
                        </div>
                        <span className="font-extrabold text-sm text-base-content leading-tight">
                          {entry.username}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-24 sm:w-48 h-2 rounded-full bg-base-300 overflow-hidden border border-base-200 hidden xs:block">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.min(100, ((entry.score ?? 0) / 3000) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-black text-primary tracking-wide">
                        {tLeaderboard("xpScore", {
                          score: (entry.score ?? 0).toLocaleString(),
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">
                  {tLeaderboard("noRankings")}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
