"use client";

import {
  Activity,
  Book,
  BookOpen,
  Building2,
  Code,
  CreditCard,
  Database,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Send,
  Server,
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
import { useMutation, useQuery } from "@tanstack/react-query";

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

const HELP_CATEGORIES = [
  { icon: Code, label: "development", color: "bg-primary" },
  { icon: Database, label: "database", color: "bg-secondary" },
  { icon: Server, label: "deployment", color: "bg-accent" },
  { icon: Book, label: "coursesLabel", color: "bg-success" },
];

export default function AdminHelpPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("admin");
  const tHelp = useTranslations("admin.helpPage");
  const tCategory = useTranslations("help");

  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "" });

  if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
    router.push(`/${locale}/login`);
  }

  const { data: faqs = [], isLoading: faqsLoading } = useQuery({
    queryKey: ["adminFaqs"],
    queryFn: async () => {
      const { data } = await api.get("/admin/faq");
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === "ADMIN"),
  });

  const ticketMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      const res = await api.post("/admin/help/ticket", data);
      return res.data;
    },
    onSuccess: () => {
      setTicketForm({ subject: "", message: "" });
    },
  });

  if (authLoading || faqsLoading) {
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
                  {tHelp("title")}
                </h1>
                <p className="text-xs text-base-content/50 font-medium mt-0.5">
                  {tHelp("subtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {HELP_CATEGORIES.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className="btn btn-ghost btn-sm rounded-xl justify-start font-bold"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {tCategory(label)}
              </button>
            ))}
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6">
            <h2 className="text-sm font-black text-base-content mb-4">
              {tHelp("faqTitle")}
            </h2>

            {faqs.length > 0 ? (
              <div className="space-y-3">
                {faqs.map((f: any, i: number) => (
                  <div
                    key={f._id || i}
                    className="collapse collapse-arrow bg-base-200/40 rounded-xl"
                  >
                    <input type="checkbox" />
                    <div className="collapse-title text-sm font-bold text-base-content">
                      {f.question}
                    </div>
                    <div className="collapse-content text-xs text-base-content/70 font-medium">
                      {f.answer}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-base-content/40 font-medium">
                {tHelp("noFaqs")}
              </p>
            )}
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6">
            <h2 className="text-sm font-black text-base-content mb-4">
              {tHelp("sendTicket")}
            </h2>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-base-content">
                    {tHelp("subject")}
                  </span>
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, subject: e.target.value })
                  }
                  className="input input-bordered w-full rounded-xl font-semibold"
                  placeholder={tHelp("subjectPlaceholder")}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-base-content">
                    {tHelp("message")}
                  </span>
                </label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, message: e.target.value })
                  }
                  className="textarea textarea-bordered w-full rounded-xl font-semibold"
                  placeholder={tHelp("messagePlaceholder")}
                  rows={3}
                />
              </div>

              <button
                onClick={() => ticketMutation.mutate(ticketForm)}
                className="btn btn-primary rounded-xl font-bold"
                disabled={
                  ticketMutation.isPending ||
                  !ticketForm.subject ||
                  !ticketForm.message
                }
              >
                <Send className="w-4 h-4" /> {tHelp("sendTicket")}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
