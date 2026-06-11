"use client";

import {
  Activity,
  BookOpen,
  Building2,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  RefreshCcw,
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
  { label: "enrollments", icon: FileText, href: "/admin/enrollments" },
  { label: "settings", icon: Settings, href: "/admin/settings" },
  { label: "help", icon: HelpCircle, href: "/admin/help" },
];

export default function AdminPaymentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
  const tPayments = useTranslations("admin.paymentsPage");

  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
    router.push(`/${locale}/login`);
  }

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["adminPayments"],
    queryFn: async () => {
      const { data } = await api.get("/admin/payments");
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === "ADMIN"),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["adminPaymentsAnalytics"],
    queryFn: async () => {
      const { data } = await api.get("/admin/payments/analytics");
      return data;
    },
    enabled: !!(isAuthenticated && user?.role === "ADMIN"),
  });

  const refundMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post("/admin/payments/refund", { orderId });
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] }),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get("/admin/payments/export");
      return data;
    },
    onSuccess: (data) => {
      const csvContent = [
        ["ID", "User", "Course", "Amount", "Status", "Date"],
        ...data.map((p: any) => [
          p.id,
          p.user,
          p.course,
          p.amount,
          p.status,
          p.createdAt?.substring(0, 10),
        ]),
      ]
        .map((e) => e.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    },
  });

  if (authLoading || paymentsLoading || analyticsLoading) {
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
            {t("superAdmin")}
          </p>
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">
          {t("menu")}
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
              {t(label)}
            </Link>
          );
        })}
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">
          {t("others")}
        </p>
        {NAV_OTHERS.map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            href={`/${locale}${href}`}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-150"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {t(label)}
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
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <SidebarContent />
        </aside>

        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn btn-ghost btn-sm btn-circle lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                  {tPayments("title")}
                </h1>
                <p className="text-xs text-base-content/50 font-medium mt-0.5">
                  {tPayments("subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={() => exportMutation.mutate()}
              className="btn btn-primary btn-sm rounded-xl font-bold"
              disabled={exportMutation.isPending}
            >
              <Download className="w-4 h-4" />
              {tPayments("exportCSV")}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase">
                {tPayments("totalRevenue")}
              </p>
              <p className="text-2xl font-black text-success mt-1">
                ${(analytics?.totalRevenue ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase">
                {tPayments("monthlyRevenue")}
              </p>
              <p className="text-2xl font-black text-primary mt-1">
                ${(analytics?.monthlyRevenue ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase">
                {tPayments("activePayments")}
              </p>
              <p className="text-2xl font-black text-base-content mt-1">
                {analytics?.activeSubscriptions ?? 0}
              </p>
            </div>
            <div className="bg-base-100 rounded-2xl border border-base-300 p-5">
              <p className="text-xs font-bold text-base-content/50 uppercase">
                {tPayments("failedRefunded")}
              </p>
              <p className="text-2xl font-black text-error mt-1">
                {(analytics?.failedPayments ?? 0) + (analytics?.refunds ?? 0)}
              </p>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between">
              <h2 className="text-sm font-black text-base-content">
                {tPayments("transactions")} ({payments.length})
              </h2>
            </div>

            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr className="bg-base-200/50 text-[10px] uppercase tracking-wider text-base-content/40 font-black">
                      <th className="py-3 px-5">{tPayments("student")}</th>
                      <th className="py-3 px-5">{tPayments("course")}</th>
                      <th className="py-3 px-5">{tPayments("amount")}</th>
                      <th className="py-3 px-5">{tPayments("status")}</th>
                      <th className="py-3 px-5">{tPayments("date")}</th>
                      <th className="py-3 px-5 text-right">
                        {tPayments("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {payments.map((p: any) => (
                      <tr
                        key={p._id}
                        className="hover:bg-base-200/30 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <div>
                            <p className="font-bold text-base-content text-sm">
                              {p.userId?.username || "Unknown"}
                            </p>
                            <p className="text-[10px] text-base-content/40 font-semibold">
                              {p.userId?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-bold text-base-content/85 text-xs truncate max-w-[200px]">
                          {p.courseId?.title || "Unknown Course"}
                        </td>
                        <td className="py-4 px-5 text-primary font-black text-sm">
                          ${Number(p.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`badge badge-sm font-bold ${
                              p.status === "PAID"
                                ? "badge-success"
                                : p.status === "REFUNDED"
                                  ? "badge-error"
                                  : "badge-warning"
                            }`}
                          >
                            {tPayments(p.status?.toLowerCase() || "pending")}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-base-content/50 text-xs font-semibold">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {p.status === "PAID" && (
                            <button
                              onClick={() => refundMutation.mutate(p._id)}
                              className="btn btn-xs btn-error rounded-lg font-bold"
                              disabled={refundMutation.isPending}
                            >
                              <RefreshCcw className="w-3 h-3" />{" "}
                              {tPayments("refund")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <CreditCard className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">
                  {tPayments("noTransactions")}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
