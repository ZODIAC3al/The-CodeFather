'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('nav');

  const handleSwitch = () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    const segments = pathname.split('/');
    segments[1] = nextLocale;
    const nextPath = segments.join('/') || `/${nextLocale}`;
    startTransition(() => router.replace(nextPath));
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className="btn btn-ghost btn-sm flex items-center gap-1.5 rounded-lg px-2 disabled:opacity-50"
      aria-label={`Switch to ${locale === 'en' ? 'Arabic' : 'English'}`}
      dir="ltr"
    >
      {/* Globe icon */}
      <svg
        className="w-4 h-4 shrink-0 text-base-content/70"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
      <span className="hidden sm:inline font-semibold text-xs">
        {locale === 'en' ? 'AR' : 'EN'}
      </span>
    </button>
  );
}