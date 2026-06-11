"use client";

import {
  BookOpen,
  Calendar,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Star,
  Users,
  Video,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_MENU = [
  {
    labelKey: "dashboard",
    icon: LayoutDashboard,
    href: "/instructor/dashboard",
  },
  { labelKey: "myCourses", icon: BookOpen, href: "/instructor/courses" },
  { labelKey: "students", icon: Users, href: "/instructor/students" },
  { labelKey: "schedule", icon: Calendar, href: "/instructor/schedule" },
  { labelKey: "reviews", icon: Star, href: "/instructor/reviews" },
];
const NAV_OTHERS = [
  { labelKey: "meetings", icon: Video, href: "/meetings" },
  { labelKey: "payments", icon: CreditCard, href: "/instructor/payments" },
  { labelKey: "settings", icon: Settings, href: "/settings" },
  { labelKey: "help", icon: HelpCircle, href: "/help" },
];

interface Props {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructorSidebar({ user, isOpen, onClose }: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === "ar";

  const tInstructor = useTranslations("instructor");
  const tAdmin = useTranslations("admin");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  function navLabel(key: string) {
    switch (key) {
      case "dashboard":
        return tAdmin("dashboard");
      case "myCourses":
        return tInstructor("myCourses");
      case "students":
        return tInstructor("students");
      case "schedule":
        return tInstructor("schedule");
      case "reviews":
        return tInstructor("reviews");
      default:
        return key;
    }
  }

  function otherLabel(key: string) {
    switch (key) {
      case "meetings":
        return tNav("meetings");
      case "payments":
        return tAdmin("payments");
      case "settings":
        return tCommon("settings");
      case "help":
        return tCommon("help");
      default:
        return key;
    }
  }

  const content = (
    <div className="flex flex-col gap-1 h-full">
      {/* User card */}
      <div className="bg-base-100 rounded-2xl border border-base-300 p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-primary-content text-sm shrink-0">
          {user?.username?.[0]?.toUpperCase() ?? "I"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-base-content truncate">
            {user?.username}
          </p>
          <p className="text-[10px] text-base-content/50 font-medium">
            {isRTL ? "مدرب" : "Instructor"}
          </p>
        </div>
      </div>

      {/* Nav links */}
      <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">
          {tAdmin("menu")}
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
                  ? "bg-primary text-primary-content shadow-sm shadow-primary/20"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {navLabel(labelKey)}
            </Link>
          );
        })}

        <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">
          {tAdmin("others")}
        </p>
        {NAV_OTHERS.map(({ labelKey, icon: Icon, href }) => (
          <Link
            key={href}
            href={`/${locale}${href}`}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-200"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {otherLabel(labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        {/* Panel */}
        <div
          className={`absolute top-0 ${isRTL ? "right-0" : "left-0"} h-full w-64 bg-base-200 p-4 shadow-2xl
            transition-transform duration-300 ease-in-out overflow-y-auto
            ${isOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"}`}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} btn btn-ghost btn-sm btn-circle`}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mt-10">{content}</div>
        </div>
      </div>
    </>
  );
}
