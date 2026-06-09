'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

const themes = [
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
    } catch {}
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
        <ul
          className="absolute right-0 top-full mt-2 w-48 p-2 shadow-2xl bg-base-100 rounded-box border border-base-200 z-50 max-h-[60vh] overflow-y-auto"
          role="menu"
        >
          {themes.map((th) => {
            const isActive = theme === th.id || resolvedTheme === th.id;
            return (
              <li key={th.id}>
                <button
                  role="menuitem"
                  onClick={() => {
                    setTheme(th.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive ? 'bg-primary text-primary-content font-bold' : 'hover:bg-base-200 text-base-content font-medium'
                  }`}
                >
                  <span className="text-lg">{th.icon}</span>
                  <span>{getThemeLabel(th.id)}</span>
                  {isActive && <span className="ms-auto">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
