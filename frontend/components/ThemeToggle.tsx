'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

const themes = [
  { id: 'educare', icon: '🎓' },
  { id: 'educare-dark', icon: '🌌' },
  { id: 'light', icon: '☀️' },
  { id: 'dark', icon: '🌙' },
  { id: 'cupcake', icon: '🧁' },
  { id: 'bumblebee', icon: '🐝' },
  { id: 'emerald', icon: '💚' },
  { id: 'corporate', icon: '🏢' },
  { id: 'synthwave', icon: '🎸' },
  { id: 'retro', icon: '📻' },
  { id: 'cyberpunk', icon: '🤖' },
  { id: 'valentine', icon: '💖' },
  { id: 'halloween', icon: '🎃' },
  { id: 'garden', icon: '🏡' },
  { id: 'forest', icon: '🌲' },
  { id: 'aqua', icon: '💧' },
  { id: 'lofi', icon: '📺' },
  { id: 'pastel', icon: '🎨' },
  { id: 'fantasy', icon: '🧚' },
  { id: 'wireframe', icon: '📐' },
  { id: 'black', icon: '⚫' },
  { id: 'luxury', icon: '💎' },
  { id: 'dracula', icon: '🧛' },
  { id: 'cmyk', icon: '🖨️' },
  { id: 'autumn', icon: '🍂' },
  { id: 'business', icon: '💼' },
  { id: 'acid', icon: '🧪' },
  { id: 'lemonade', icon: '🍋' },
  { id: 'night', icon: '🌃' },
  { id: 'coffee', icon: '☕' },
  { id: 'winter', icon: '❄️' },
  { id: 'dim', icon: '👓' },
  { id: 'nord', icon: '🗻' },
  { id: 'sunset', icon: '🌇' },
  { id: 'caramellatte', icon: '🍮' },
  { id: 'abyss', icon: '🌌' },
  { id: 'silk', icon: '🎗️' },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations('themes');

  useEffect(() => {
     setMounted(true);
     // eslint-disable-next-line react-hooks/set-state-in-effect
   }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg animate-pulse bg-base-200" />
    );
  }

  const current = (themes.find((t) => t.id === theme) || themes.find((t) => t.id === resolvedTheme)) ?? themes[0];

  const getThemeLabel = (id: string) => {
    try {
      if (t.has(id)) {
        return t(id);
      }
    } catch { }
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  return (
    <div ref={ref} className="relative">
      <button
        id="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-sm btn-ghost rounded-lg flex items-center gap-2"
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{current.icon}</span>
        <span className="hidden sm:inline font-bold">
          {t('toggle')}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute ltr:right-0 rtl:left-0 top-full mt-2 w-72 sm:w-80 p-3 shadow-2xl bg-base-100 rounded-3xl border border-base-200 z-50 max-h-[50vh] overflow-y-auto grid grid-cols-2 gap-1.5 scrollbar-thin"
          role="menu"
        >
          <div className="col-span-2 px-2 pb-1.5 mb-1 border-b border-base-200/60 flex items-center justify-between text-[10px] font-black text-base-content/40 uppercase tracking-widest">
            <span>{t('toggle')}</span>
            <span className="text-[9px] lowercase font-semibold text-primary">{themes.length} options</span>
          </div>
          {themes.map((th) => {
            const isActive = theme === th.id || resolvedTheme === th.id;
            return (
              <button
                key={th.id}
                role="menuitem"
                onClick={() => {
                  setTheme(th.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-200 text-xs text-start ${
                  isActive
                    ? 'bg-primary text-primary-content font-bold shadow-md shadow-primary/20 scale-[0.98]'
                    : 'hover:bg-base-200 text-base-content font-semibold hover:scale-[1.02] active:scale-95'
                }`}
              >
                <span className="text-base shrink-0">{th.icon}</span>
                <span className="truncate flex-1">{getThemeLabel(th.id)}</span>
                {isActive && <span className="text-[9px] shrink-0 opacity-90">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
