'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, MonitorSmartphone, Home, BookOpen, Video, User, Plus, Search } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const locale = useLocale();
  const t = useTranslations('nav');

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
  const pathname = usePathname();

  const mobileTabs = [
    { label: t('home'), href: lp(''), icon: Home },
    { label: t('courses'), href: lp('/courses'), icon: BookOpen },
    { label: 'Center', isCenter: true },
    { label: t('meetings'), href: lp('/meetings'), icon: Video },
    { label: t('profile'), href: lp('/profile'), icon: User },
  ];

  return (
    <>
      <div className={`navbar bg-base-100 sticky top-0 z-50 navbar-sticky ${scrolled ? 'shadow-lg bg-base-100/95 backdrop-blur border-b border-base-300/30' : 'border-b border-base-300/10'}`}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          <div className="navbar-start flex items-center">
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                <Menu className="h-5 w-5" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                {[
                  { href: lp(''), label: t('home') },
                  { href: lp('/courses'), label: t('courses') },
                  { href: lp('/roadmap'), label: t('roadmap') },
                  { href: lp('/meetings'), label: t('meetings') },
                  { href: lp('/blog'), label: t('blog') },
                  { href: lp('/membership'), label: t('membership') },
                ].map(({ href, label }) => (
                  <li key={href}><Link href={href} className="font-bold">{label}</Link></li>
                ))}

                {user?.role === 'ADMIN' && (
                  <li><Link href={lp('/admin/dashboard')} className="text-error font-bold">{t('adminPanel')}</Link></li>
                )}
                {user?.role === 'INSTRUCTOR' && (
                  <li><Link href={lp('/instructor/dashboard')} className="text-primary font-bold">{t('instructorPortal')}</Link></li>
                )}
              </ul>
            </div>
            <Link href={lp('')} className="btn btn-ghost text-xl flex items-center gap-2 px-2">
              <Image src="/logo.jpg" alt="Logo" width={32} height={32} priority className="object-contain rounded" />
              <span className="font-extrabold hidden sm:inline">The <span className="text-primary">Codefather</span></span>
            </Link>
          </div>

          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 gap-1">
              {[
                { href: lp(''), label: t('home') },
                { href: lp('/courses'), label: t('courses') },
                { href: lp('/roadmap'), label: t('roadmap') },
                { href: lp('/meetings'), label: t('meetings') },
                { href: lp('/blog'), label: t('blog') },
                { href: lp('/membership'), label: t('membership') },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} className="font-bold">{label}</Link></li>
              ))}
              {user?.role === 'ADMIN' && (
                <li><Link href={lp('/admin/dashboard')} className="text-error font-bold">{t('adminPanel')}</Link></li>
              )}
              {user?.role === 'INSTRUCTOR' && (
                <li><Link href={lp('/instructor/dashboard')} className="text-primary font-bold">{t('instructorPortal')}</Link></li>
              )}
            </ul>
          </div>

          <div className="navbar-end gap-2 flex items-center justify-end">
            {!hideDownload && isInstallable && (
              <button onClick={handleInstallClick} className="btn btn-primary btn-sm hidden sm:flex">
                <MonitorSmartphone className="w-4 h-4" /> {t('installApp')}
              </button>
            )}

            <LanguageSwitcher />
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                  <div className="w-10 h-10 rounded-full border border-base-300 overflow-hidden relative">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt="Profile" width={40} height={40} priority className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-bold text-lg uppercase">
                        {user?.username?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                </div>
                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                  <li>
                    <Link href={lp('/profile')} className="justify-between font-bold">
                      {t('profile')}
                      <span className="badge badge-primary">{user?.role}</span>
                    </Link>
                  </li>
                  <li><button onClick={logout} className="text-error font-bold">{t('logout')}</button></li>
                </ul>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href={lp('/login')} className="btn btn-ghost rounded-full font-bold">
                  {t('login')}
                </Link>
                <Link href={lp('/register')} className="btn-premium rounded-full px-6 py-2.5 text-sm">
                  {t('signUp')}
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navbar Notch & Curve background */}
      <div className="fixed bottom-0 left-0 right-0 h-16 lg:hidden flex items-end z-50 select-none pointer-events-none pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.04)]">
        {/* Left Side Fill */}
        <div className="flex-grow h-14 bg-base-100 border-t border-base-300 pointer-events-auto" />
        
        {/* Center Notch SVG */}
        <div className="w-20 h-16 relative bg-transparent shrink-0 pointer-events-auto">
          <svg className="absolute inset-0 w-full h-full text-base-100 fill-current" viewBox="0 0 80 64">
            <path d="M 0 16 L 10 16 C 18 16, 22 16, 26 22 C 30 28, 32 46, 40 46 C 48 46, 50 28, 54 22 C 58 16, 62 16, 70 16 L 80 16 L 80 64 L 0 64 Z" />
            <path d="M 0 16 L 10 16 C 18 16, 22 16, 26 22 C 30 28, 32 46, 40 46 C 48 46, 50 28, 54 22 C 58 16, 62 16, 70 16 L 80 16" fill="none" className="stroke-base-300" strokeWidth="1.5" />
          </svg>
          
          {/* Floating Circle Button */}
          <Link
            href={user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN' ? lp('/courses/create') : lp('/courses')}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-neutral text-neutral-content flex items-center justify-center shadow-lg border-4 border-base-100 hover:scale-105 active:scale-95 transition-transform"
          >
            {user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN' ? (
              <Plus className="w-5 h-5 text-neutral-content" />
            ) : (
              <Search className="w-5 h-5 text-neutral-content" />
            )}
          </Link>
        </div>

        {/* Right Side Fill */}
        <div className="flex-grow h-14 bg-base-100 border-t border-base-300 pointer-events-auto" />
      </div>

      {/* Mobile Bottom Navbar Tabs overlay */}
      <div className="fixed bottom-0 left-0 right-0 h-14 lg:hidden z-50 flex items-center justify-around px-2 pointer-events-none pb-safe">
        {mobileTabs.map((tab, idx) => {
          if (tab.isCenter) {
            return <div key={idx} className="w-20" />;
          }

          const active = pathname === tab.href || (tab.href !== lp('') && pathname?.startsWith(tab.href + '/'));
          const Icon = tab.icon as any;

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
              <Icon className={`w-5 h-5 relative z-10 transition-colors duration-300 ${active ? 'text-primary' : 'text-base-content/65'}`} />
              <span className={`text-[9px] font-extrabold relative z-10 tracking-wide transition-colors duration-300 ${active ? 'text-primary' : 'text-base-content/55'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
