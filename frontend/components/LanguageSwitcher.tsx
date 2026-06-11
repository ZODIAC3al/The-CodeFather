"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = () => {
    const nextLocale = locale === "en" ? "ar" : "en";
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const nextPath = segments.join("/") || `/${nextLocale}`;
    startTransition(() => router.replace(nextPath));
  };

  const isArabic = locale === "ar";

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className={`
        relative h-9 rounded-xl flex items-center gap-1.5 px-2.5
        text-sm font-bold tracking-wide
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:bg-base-content/6 active:scale-95
        ${isPending ? "opacity-60" : ""}
      `}
      aria-label={`Switch to ${isArabic ? "English" : "Arabic"}`}
      dir="ltr"
    >
      {/* Flag / locale indicator pill */}
      <span
        className={`
          inline-flex items-center justify-center
          w-5 h-5 rounded-md text-[10px] font-black
          ring-1 ring-base-content/12 
          transition-all duration-200
          ${isPending ? "animate-pulse" : ""}
          ${
            isArabic
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
          }
        `}
        aria-hidden="true"
      >
        {isArabic ? "ع" : "EN"}
      </span>

      {/* Switch label — visible on sm+ */}
      <span className="hidden sm:inline text-xs font-semibold text-base-content/65">
        {isArabic ? "EN" : "عر"}
      </span>

      {/* Tiny spinner when pending */}
      {isPending && (
        <span className="absolute inset-0 rounded-xl flex items-center justify-center bg-base-100/60 backdrop-blur-sm">
          <svg
            className="w-3.5 h-3.5 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </span>
      )}
    </button>
  );
}
