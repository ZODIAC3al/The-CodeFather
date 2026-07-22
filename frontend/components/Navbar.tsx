'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
	Bell,
	BookOpen,
	ChevronDown,
	CreditCard,
	Home,
	Menu,
	MonitorSmartphone,
	Plus,
	Search,
	User,
	Video,
	X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notifications-context';

interface NavbarProps {
  hideDownload?: boolean;
}

export default function Navbar({ hideDownload = false }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMenuOpen]);

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

  const isActive = (href: string) =>
    pathname === href || (href !== lp('') && pathname?.startsWith(href + '/'));

  return (
    <>
      {/* ─── Top Navbar ─────────────────────────────────────────────── */}
      <header
        className={`
          sticky top-0 z-50
          transition-all duration-300 ease-in-out
          ${scrolled
            ? 'bg-base-100/80 backdrop-blur-xl border-b border-base-content/8 shadow-sm shadow-base-content/5'
            : 'bg-base-100 border-b border-base-content/5'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">

          {/* ── Left: Hamburger + Logo ───────────────────────────────── */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Hamburger — mobile only */}
            <div ref={mobileMenuRef} className="relative lg:hidden">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="btn btn-ghost btn-sm btn-square rounded-xl"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileMenuOpen ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-full mt-2 w-60 z-[100] py-2 bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl shadow-2xl shadow-base-content/10 overflow-hidden"
                  >
                    {/* Nav links */}
                    <div className="px-2 pb-1">
                      {navLinks.map(({ href, label }) => {
                        const active = isActive(href);
                        return (
                          <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                              active
                                ? 'bg-primary/12 text-primary'
                                : 'text-base-content/80 hover:bg-base-content/6 hover:text-base-content'
                            }`}
                          >
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                            {label}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Role-specific links */}
                    {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                      <>
                        <div className="mx-3 my-1.5 border-t border-base-content/8" />
                        <div className="px-2 py-1">
                          {user?.role === 'ADMIN' && (
                            <Link
                              href={lp('/admin/dashboard')}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-error hover:bg-error/10 transition-colors"
                            >
                              {t('adminPanel')}
                            </Link>
                          )}
                          {user?.role === 'INSTRUCTOR' && (
                            <Link
                              href={lp('/instructor/dashboard')}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                            >
                              {t('instructorPortal')}
                            </Link>
                          )}
                        </div>
                      </>
                    )}

                    {/* Install app */}
                    {!hideDownload && isInstallable && (
                      <>
                        <div className="mx-3 my-1.5 border-t border-base-content/8" />
                        <div className="px-2 py-1">
                          <button
                            onClick={handleInstallClick}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/80 hover:bg-base-content/6 transition-colors"
                          >
                            <MonitorSmartphone className="w-4 h-4 shrink-0" />
                            {t('installApp')}
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logo */}
            <Link href={lp('')} className="flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-base-content/5 transition-colors">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-base-content/10 shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={32}
                  height={32}
                  priority
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold hidden sm:inline tracking-tight text-base-content">
                The{' '}
                <span className="text-primary">Codefather</span>
              </span>
            </Link>
          </div>

          {/* ── Center: Desktop nav links ────────────────────────────── */}
          <nav className="hidden lg:flex flex-1 justify-center min-w-0">
            <ul className="flex items-center gap-0.5">
              {navLinks.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`relative px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                        active
                          ? 'text-primary bg-primary/10'
                          : 'text-base-content/70 hover:text-base-content hover:bg-base-content/6'
                      }`}
                    >
                      {label}
                      {active && (
                        <motion.span
                          layoutId="navActiveDot"
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
              {user?.role === 'ADMIN' && (
                <li>
                  <Link
                    href={lp('/admin/dashboard')}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-error hover:bg-error/10 transition-colors whitespace-nowrap"
                  >
                    {t('adminPanel')}
                  </Link>
                </li>
              )}
              {user?.role === 'INSTRUCTOR' && (
                <li>
                  <Link
                    href={lp('/instructor/dashboard')}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                  >
                    {t('instructorPortal')}
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* ── Right: Controls ──────────────────────────────────────── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Install button */}
            {!hideDownload && isInstallable && (
              <>
                <button
                  onClick={handleInstallClick}
                  title={t('installApp')}
                  className="btn btn-ghost btn-sm btn-square rounded-xl hidden lg:flex xl:hidden"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                </button>
                <button
                  onClick={handleInstallClick}
                  className="btn btn-primary btn-sm gap-1.5 hidden xl:flex rounded-xl font-semibold"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                  {t('installApp')}
                </button>
              </>
            )}

            {/* Separator */}
            <div className="w-px h-4 bg-base-content/10 mx-0.5 hidden sm:block" />

            <LanguageSwitcher />
            <ThemeToggle />

            {/* Notifications */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Auth */}
            {isAuthenticated ? (
              <div className="dropdown dropdown-end ml-0.5">
                <button
                  tabIndex={0}
                  className="flex items-center gap-2 px-1.5 py-1 rounded-xl hover:bg-base-content/6 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl ring-2 ring-base-content/10 overflow-hidden shrink-0">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="Profile"
                        width={32}
                        height={32}
                        priority
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-black text-sm uppercase">
                        {user?.username?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-base-content/40 hidden sm:block shrink-0" />
                </button>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content mt-2 z-[100] py-2 shadow-2xl shadow-base-content/10 bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl w-52 overflow-hidden"
                >
                  <li className="px-2 pb-1">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-base-content/4 pointer-events-none">
                      <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 ring-1 ring-base-content/10">
                        {user?.avatar ? (
                          <Image src={user.avatar} alt="" width={28} height={28} className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-black text-xs uppercase">
                            {user?.username?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-base-content truncate">{user?.username}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wide text-primary/80">{user?.role}</span>
                      </div>
                    </div>
                  </li>
                  <li>
                    <Link href={lp('/profile')} className="flex items-center gap-2 px-3 py-2.5 mx-2 rounded-xl text-sm font-semibold hover:bg-base-content/6 transition-colors">
                      <User className="w-3.5 h-3.5 shrink-0 text-base-content/50" />
                      {t('profile')}
                    </Link>
                  </li>
                  <div className="mx-3 my-1 border-t border-base-content/8" />
                  <li>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-3 py-2.5 mx-2 rounded-xl text-sm font-semibold text-error hover:bg-error/10 transition-colors"
                    >
                      {t('logout')}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Link
                  href={lp('/login')}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-base-content/70 hover:text-base-content hover:bg-base-content/6 transition-colors hidden sm:inline-flex"
                >
                  {t('login')}
                </Link>
                <Link
                  href={lp('/register')}
                  className="btn-premium rounded-xl px-4 py-2 text-sm font-bold"
                >
                  {t('signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navbar ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 lg:hidden flex items-end z-50 pointer-events-none pb-safe shadow-[0_-1px_0_0_hsl(var(--bc)/0.08)]">
        <div className="flex-grow h-14 bg-base-100/95 backdrop-blur-lg pointer-events-auto" />

        <div className="w-20 h-16 relative shrink-0 pointer-events-auto">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 80 64"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0 16 L 10 16 C 18 16, 22 16, 26 22 C 30 28, 32 46, 40 46 C 48 46, 50 28, 54 22 C 58 16, 62 16, 70 16 L 80 16 L 80 64 L 0 64 Z"
              className="fill-base-100"
            />
            <path
              d="M 0 16 L 10 16 C 18 16, 22 16, 26 22 C 30 28, 32 46, 40 46 C 48 46, 50 28, 54 22 C 58 16, 62 16, 70 16 L 80 16"
              fill="none"
              className="stroke-base-content/8"
              strokeWidth="1"
            />
          </svg>
          {/* FAB */}
          <Link
            href={
              user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
                ? lp('/courses/create')
                : lp('/courses')
            }
            className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-base-100 hover:scale-105 active:scale-95 transition-transform"
          >
            {user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN' ? (
              <Plus className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Link>
        </div>

        <div className="flex-grow h-14 bg-base-100/95 backdrop-blur-lg pointer-events-auto" />
      </div>

      {/* Tab icons */}
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
              className="flex flex-col items-center justify-center pointer-events-auto relative py-1 px-4 rounded-full transition-all duration-200"
            >
              {active && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-primary/12 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                  active ? 'text-primary' : 'text-base-content/50'
                }`}
              />
              <span
                className={`text-[9px] font-extrabold relative z-10 tracking-wide transition-colors duration-200 ${
                  active ? 'text-primary' : 'text-base-content/45'
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

function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'PAYMENT': return { icon: CreditCard, color: 'text-success', bg: 'bg-success/12' };
      case 'COURSE': return { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/12' };
      case 'ASSIGNMENT': return { icon: Plus, color: 'text-warning', bg: 'bg-warning/12' };
      case 'MEETING': return { icon: Video, color: 'text-info', bg: 'bg-info/12' };
      default: return { icon: Bell, color: 'text-base-content/60', bg: 'bg-base-content/8' };
    }
  };

  return (
    <div ref={ref} className="relative ml-0.5">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150 ${
          isOpen ? 'bg-base-content/10' : 'hover:bg-base-content/6'
        }`}
        aria-label="Notifications"
      >
        <Bell className={`w-4.5 h-4.5 transition-colors ${unreadCount > 0 ? 'text-base-content' : 'text-base-content/60'}`} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error text-error-content text-[9px] font-black flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute ltr:right-0 rtl:left-0 top-full mt-2 w-80 sm:w-96 z-[100] bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl shadow-2xl shadow-base-content/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/8">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-base-content">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-error text-error-content text-[9px] font-black">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-[10px] text-primary font-bold hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto overscroll-contain divide-y divide-base-content/5">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-base-content/20 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-base-content/35">No notifications yet</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const { icon: Icon, color, bg } = getTypeConfig(item.type);
                  return (
                    <button
                      key={item._id}
                      onClick={() => !item.read && markAsRead(item._id)}
                      className={`w-full flex gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                        item.read
                          ? 'hover:bg-base-content/4'
                          : 'bg-primary/4 hover:bg-primary/8'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${item.read ? 'text-base-content/80' : 'text-base-content'}`}>
                            {item.title}
                          </p>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[10px] text-base-content/55 leading-relaxed mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                        <span className="text-[9px] text-base-content/35 font-semibold mt-1 block">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}