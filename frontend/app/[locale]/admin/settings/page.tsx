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
  Save,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const t = useTranslations("admin");
  const tSettings = useTranslations("admin.settingsPage");
  const tThemes = useTranslations("themes");

  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    siteName: "",
    siteDescription: "",
    contactEmail: "",
    maintenanceMode: false,
    defaultTheme: "educare-dark",
    emailNotifications: true,
    pushNotifications: true,
  });

  if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
    router.push(`/${locale}/login`);
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data } = await api.get("/admin/settings");
      return data;
    },
    enabled: !!(isAuthenticated && user?.role === "ADMIN"),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings?.siteName || "",
        siteDescription: settings?.siteDescription || "",
        contactEmail: settings?.contactEmail || "",
        maintenanceMode: settings?.maintenanceMode || false,
        defaultTheme: settings?.defaultTheme || "educare-dark",
        emailNotifications: settings?.emailNotifications ?? true,
        pushNotifications: settings?.pushNotifications ?? true,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.patch("/admin/settings", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
    },
  });

  if (authLoading || isLoading) {
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
                  {tSettings("title")}
                </h1>
                <p className="text-xs text-base-content/50 font-medium mt-0.5">
                  {tSettings("subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={() => saveMutation.mutate(form)}
              className="btn btn-primary rounded-xl font-bold"
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4" /> {tSettings("saveChanges")}
            </button>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-base-content">
                    {tSettings("siteName")}
                  </span>
                </label>
                <input
                  type="text"
                  value={form.siteName}
                  onChange={(e) =>
                    setForm({ ...form, siteName: e.target.value })
                  }
                  className="input input-bordered w-full rounded-xl font-semibold"
                  placeholder={tSettings("siteNamePlaceholder")}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-base-content">
                    {tSettings("contactEmail")}
                  </span>
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  className="input input-bordered w-full rounded-xl font-semibold"
                  placeholder={tSettings("contactEmailPlaceholder")}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-bold text-base-content">
                    {tSettings("siteDescription")}
                  </span>
                </label>
                <textarea
                  value={form.siteDescription}
                  onChange={(e) =>
                    setForm({ ...form, siteDescription: e.target.value })
                  }
                  className="textarea textarea-bordered w-full rounded-xl font-semibold"
                  placeholder={tSettings("siteDescriptionPlaceholder")}
                  rows={2}
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.maintenanceMode}
                    onChange={(e) =>
                      setForm({ ...form, maintenanceMode: e.target.checked })
                    }
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-bold text-base-content">
                    {tSettings("maintenanceMode")}
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-base-content">
                    {tSettings("defaultTheme")}
                  </span>
                </label>
                <select
                  value={form.defaultTheme}
                  onChange={(e) =>
                    setForm({ ...form, defaultTheme: e.target.value })
                  }
                  className="select select-bordered w-full rounded-xl font-semibold"
                >
                  <option value="educare-dark">
                    {tThemes("educare-dark")}
                  </option>
                  <option value="light">{tThemes("light")}</option>
                  <option value="dark">{tThemes("dark")}</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.emailNotifications}
                    onChange={(e) =>
                      setForm({ ...form, emailNotifications: e.target.checked })
                    }
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-bold text-base-content">
                    {tSettings("emailNotifications")}
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.pushNotifications}
                    onChange={(e) =>
                      setForm({ ...form, pushNotifications: e.target.checked })
                    }
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-bold text-base-content">
                    {tSettings("pushNotifications")}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
