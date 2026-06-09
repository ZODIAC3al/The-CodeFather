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

    // Replace the locale prefix in the current path
    // pathname is like /en/courses → /ar/courses
    const segments = pathname.split('/');
    segments[1] = nextLocale; // replace locale segment
    const nextPath = segments.join('/') || `/${nextLocale}`;

    startTransition(() => {
      router.replace(nextPath);
    });
  };

  return (
    <button
      id="language-switcher-btn"
      onClick={handleSwitch}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        direction: 'ltr', // always LTR so flag/label reads correctly
      }}
      aria-label={`Switch to ${locale === 'en' ? 'Arabic' : 'English'}`}
    >
      {/* Globe icon inline SVG */}
      <svg
        className="w-3.5 h-3.5 shrink-0"
        style={{ color: 'var(--accent)' }}
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
      <span>{t('switchLanguage')}</span>
    </button>
  );
}
