'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { Menu, MonitorSmartphone, Home, BookOpen, Video, User, Plus, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface NavbarProps {
  hideDownload?: boolean;
}

export default function Navbar({ hideDownload = false }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const lp = (path: string) => `/${locale}${path}`;

  const navLinks = [
    { href: lp(''), label: t('home') },
    { href: lp('/courses'), label: t('courses') },
    { href: lp('/roadmap'), label: t('roadmap') },
    { href: lp('/meetings'), label: t('meetings') },
    { href: lp('/blog'), label: t('blog') },
    { href: lp('/membership'), label: t('membership') },
  ];

  const mobileTabs = [
    { label: t('home'), href: lp(''), icon: Home },
    { label: t('courses'), href: lp('/courses'), icon: BookOpen },
    { label: 'Center', isCenter: true },
    { label: t('meetings'), href: lp('/meetings'), icon: Video },
    { label: t('profile'), href: lp('/profile'), icon: User },
  ];

  return (
    <>
      {/* ─── Top Navbar ─────────────────────────────────────────────── */}
      <div
        className={`
          sticky top-0 z-50 bg-base-100
          transition-all duration-300
          ${scrolled
            ? 'shadow-md bg-base-100/95 backdrop-blur-md border-b border-base-300/40'
            : 'border-b border-base-300/10'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">

          {/* ── Left: Hamburger + Logo ───────────────────────────────── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Hamburger — mobile only */}
            <div className="dropdown lg:hidden">
              <button tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                <Menu className="h-5 w-5" />
              </button>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow-xl bg-base-100 border border-base-200 rounded-box w-56"
              >
                {navLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="font-semibold">{label}</Link>
                  </li>
                ))}
                {user?.role === 'ADMIN' && (
                  <li>
                    <Link href={lp('/admin/dashboard')} className="text-error font-bold">
                      {t('adminPanel')}
                    </Link>
                  </li>
                )}
                {user?.role === 'INSTRUCTOR' && (
                  <li>
                    <Link href={lp('/instructor/dashboard')} className="text-primary font-bold">
                      {t('instructorPortal')}
                    </Link>
                  </li>
                )}
                {/* Install inside mobile menu */}
                {!hideDownload && isInstallable && (
                  <>
                    <div className="divider my-1" />
                    <li>
                      <button onClick={handleInstallClick} className="font-semibold">
                        <MonitorSmartphone className="w-4 h-4" />
                        {t('installApp')}
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Logo */}
            <Link href={lp('')} className="btn btn-ghost px-2 flex items-center gap-2 text-base">
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={32}
                height={32}
                priority
                className="object-contain rounded"
              />
              <span className="font-extrabold hidden sm:inline tracking-tight">
                The <span className="text-primary">Codefather</span>
              </span>
            </Link>
          </div>

          {/* ── Center: Desktop nav links ────────────────────────────── */}
          <nav className="hidden lg:flex flex-1 justify-center min-w-0 overflow-hidden">
            <ul className="flex items-center gap-0.5 flex-nowrap">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="btn btn-ghost btn-sm font-semibold whitespace-nowrap rounded-lg text-xs xl:text-sm px-1.5 xl:px-3"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {user?.role === 'ADMIN' && (
                <li>
                  <Link
                    href={lp('/admin/dashboard')}
                    className="btn btn-ghost btn-sm text-error font-bold whitespace-nowrap rounded-lg text-xs xl:text-sm px-1.5 xl:px-3"
                  >
                    {t('adminPanel')}
                  </Link>
                </li>
              )}
              {user?.role === 'INSTRUCTOR' && (
                <li>
                  <Link
                    href={lp('/instructor/dashboard')}
                    className="btn btn-ghost btn-sm text-primary font-bold whitespace-nowrap rounded-lg text-xs xl:text-sm px-1.5 xl:px-3"
                  >
                    {t('instructorPortal')}
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* ── Right: Controls ──────────────────────────────────────── */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Install: icon-only on lg, full label on xl+ */}
            {!hideDownload && isInstallable && (
              <>
                {/* lg-only: compact icon button */}
                <button
                  onClick={handleInstallClick}
                  title={t('installApp')}
                  className="btn btn-ghost btn-sm btn-square hidden lg:flex xl:hidden"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                </button>
                {/* xl+: full pill */}
                <button
                  onClick={handleInstallClick}
                  className="btn btn-primary btn-sm gap-1.5 hidden xl:flex rounded-full"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                  <span>{t('installApp')}</span>
                </button>
              </>
            )}

            {/* Thin visual separator */}
            <div className="w-px h-5 bg-base-300/60 mx-0.5 hidden sm:block" />

            {/* Language + Theme */}
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Auth */}
            {isAuthenticated ? (
              <div className="dropdown dropdown-end ml-1">
                <button tabIndex={0} className="btn btn-ghost btn-circle p-0.5">
                  <div className="w-9 h-9 rounded-full border-2 border-base-300 overflow-hidden">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="Profile"
                        width={36}
                        height={36}
                        priority
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-bold text-base uppercase">
                        {user?.username?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                </button>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow-xl bg-base-100 border border-base-200 rounded-box w-52"
                >
                  <li>
                    <Link href={lp('/profile')} className="justify-between font-semibold">
                      {t('profile')}
                      <span className="badge badge-primary badge-sm">{user?.role}</span>
                    </Link>
                  </li>
                  <li>
                    <button onClick={logout} className="text-error font-semibold">
                      {t('logout')}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Link
                  href={lp('/login')}
                  className="btn btn-ghost btn-sm rounded-full font-semibold hidden sm:inline-flex"
                >
                  {t('login')}
                </Link>
                <Link
                  href={lp('/register')}
                  className="btn-premium rounded-full px-5 py-2 text-sm font-bold"
                >
                  {t('signUp')}
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── Mobile Bottom Navbar ───────────────────────────────────── */}

      {/* Background + notch layer */}
      <div className="fixed bottom-0 left-0 right-0 h-16 lg:hidden flex items-end z-50 pointer-events-none pb-safe shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex-grow h-14 bg-base-100 border-t border-base-300 pointer-events-auto" />

        <div className="w-20 h-16 relative shrink-0 pointer-events-auto">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 80 64"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Fill — uses CSS variable so it adapts to any DaisyUI theme */}
            <path
              d="M 0 16 L 10 16 C 18 16, 22 16, 26 22 C 30 28, 32 46, 40 46 C 48 46, 50 28, 54 22 C 58 16, 62 16, 70 16 L 80 16 L 80 64 L 0 64 Z"
              className="fill-base-100"
            />
            {/* Border curve */}
            <path
              d="M 0 16 L 10 16 C 18 16, 22 16, 26 22 C 30 28, 32 46, 40 46 C 48 46, 50 28, 54 22 C 58 16, 62 16, 70 16 L 80 16"
              fill="none"
              className="stroke-base-300"
              strokeWidth="1.5"
            />
          </svg>

          {/* FAB */}
          <Link
            href={
              user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
                ? lp('/courses/create')
                : lp('/courses')
            }
            className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-neutral text-neutral-content flex items-center justify-center shadow-lg border-4 border-base-100 hover:scale-105 active:scale-95 transition-transform"
          >
            {user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN' ? (
              <Plus className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Link>
        </div>

        <div className="flex-grow h-14 bg-base-100 border-t border-base-300 pointer-events-auto" />
      </div>

      {/* Tab icons overlay */}
      <div className="fixed bottom-0 left-0 right-0 h-14 lg:hidden z-50 flex items-center justify-around px-2 pointer-events-none pb-safe">
        {mobileTabs.map((tab, idx) => {
          if (tab.isCenter) return <div key={idx} className="w-20" />;

          const active =
            pathname === tab.href ||
            (tab.href !== lp('') && pathname?.startsWith(tab.href + '/'));
          const Icon = tab.icon as React.ElementType;

          return (
            <Link
              key={idx}
              href={tab.href || ''}
              className="flex flex-col items-center justify-center pointer-events-auto relative py-1 px-4 rounded-full transition-all duration-300"
            >
              {active && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-primary/15 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors duration-300 ${active ? 'text-primary' : 'text-base-content/65'
                  }`}
              />
              <span
                className={`text-[9px] font-extrabold relative z-10 tracking-wide transition-colors duration-300 ${active ? 'text-primary' : 'text-base-content/55'
                  }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}