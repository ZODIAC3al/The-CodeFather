"use client";

import {
  Activity,
  BookOpen,
  Building2,
  CheckCircle2,
  CreditCard,
  Eye,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  { label: "settings", icon: Settings, href: "/admin/settings" },
  { label: "help", icon: HelpCircle, href: "/admin/help" },
];

export default function AdminCoursesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const t = useTranslations();
  const tNav = useTranslations("admin");
  const tCourses = useTranslations("admin.coursesPage");

  const isRTL = locale === "ar";
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PUBLISHED" | "PENDING"
  >("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
    router.push(`/${locale}/login`);
  }

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: async () => {
      const { data } = await api.get("/courses", {
        params: { showAll: "true" },
      });
      return data.data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === "ADMIN"),
  });

  const approveMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.patch(`/admin/courses/${courseId}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingCourses"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.patch(`/admin/courses/${courseId}/reject`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingCourses"] });
    },
  });

  const filteredCourses = courses.filter((c: any) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PUBLISHED")
      return c.published || c.status === "PUBLISHED";
    if (statusFilter === "PENDING")
      return !c.published && c.status !== "PUBLISHED";
    return true;
  });

  if (authLoading || coursesLoading) {
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
                {tCourses("title")}
              </h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {tCourses("subtitle")}
              </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-base-300 flex flex-wrap items-center justify-between gap-3 bg-base-200/20">
              <h2 className="text-sm font-black text-base-content">
                {tCourses("platformCourses", { count: filteredCourses.length })}
              </h2>

              <div className="join flex-wrap">
                {[
                  { key: "ALL", label: tCourses("all") },
                  { key: "PUBLISHED", label: t("published") },
                  { key: "PENDING", label: tCourses("pendingApproval") },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key as any)}
                    className={`join-item btn btn-xs font-bold ${statusFilter === item.key ? "btn-primary text-primary-content" : "btn-ghost border border-base-300"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="divide-y divide-base-300">
                {filteredCourses.map((c: any) => (
                  <div
                    key={c.id || c._id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-base-200/30 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-base-300 overflow-hidden shrink-0 border border-base-300 shadow-sm">
                        {c.thumbnail ? (
                          <img
                            src={c.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-base-content leading-tight">
                          {c.title}
                        </p>
                        <p className="text-[10px] text-base-content/50 font-semibold mt-1 flex flex-wrap items-center gap-3">
                          <span>
                            {t("by")}{" "}
                            <span className="text-base-content font-bold">
                              {c.instructor?.username || "Instructor"}
                            </span>
                          </span>
                          <span>
                            {tCourses("category")}{" "}
                            <span className="text-base-content font-bold">
                              {c.category?.name || "—"}
                            </span>
                          </span>
                          <span className="text-primary font-bold">
                            ${c.price || 0}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`badge badge-sm font-extrabold ${c.published || c.status === "PUBLISHED" ? "badge-success text-success-content" : "badge-warning text-warning-content animate-pulse"}`}
                      >
                        {c.published || c.status === "PUBLISHED"
                          ? t("published")
                          : tCourses("pendingApproval")}
                      </span>

                      <div className="flex gap-1 flex-wrap">
                        <Link
                          href={`/${locale}/courses/${c.slug || c.id || c._id}`}
                          className="btn btn-xs btn-ghost text-base-content/65 hover:text-primary"
                        >
                          <Eye className="w-3.5 h-3.5" />{" "}
                          {tCourses("viewCourse")}
                        </Link>

                        {!(c.published || c.status === "PUBLISHED") ? (
                          <>
                            <button
                              onClick={() =>
                                approveMutation.mutate(c.id || c._id)
                              }
                              className="btn btn-xs btn-success rounded-lg font-bold"
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                              {tCourses("approve")}
                            </button>
                            <button
                              onClick={() =>
                                rejectMutation.mutate(c.id || c._id)
                              }
                              className="btn btn-xs btn-error btn-outline rounded-lg font-bold"
                              disabled={rejectMutation.isPending}
                            >
                              <X className="w-3.5 h-3.5" /> {tCourses("reject")}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => rejectMutation.mutate(c.id || c._id)}
                            className="btn btn-xs btn-error btn-outline rounded-lg font-bold"
                            disabled={rejectMutation.isPending}
                          >
                            {tCourses("deleteCourse")}
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
                <p className="text-sm text-base-content/40 font-medium">
                  {tCourses("noCourses")}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
