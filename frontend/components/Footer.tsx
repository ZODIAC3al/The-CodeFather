'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import logo from '@/public/logo.jpg';
import {
  FaXTwitter,
  FaFacebookF,
  FaInstagram,
  FaGithub,
} from 'react-icons/fa6';
import Image from 'next/image';

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const lp = (path: string) => `/${locale}${path}`;

  return (
    <>
      {/* ── CTA Wave Section ── */}
      <section className="bg-primary relative overflow-hidden">
        {/* subtle radial glow inside the primary block */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 50%, oklch(from var(--color-primary) calc(l + 0.12) c h / 0.35) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-28">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary-content leading-tight tracking-tight mb-6 max-w-2xl">
            {t('readyText')}
          </h2>
          <Link
            href={lp('/register')}
            className="btn btn-neutral rounded-full px-10 py-3 text-base font-bold shadow-xl hover:scale-105 transition-transform duration-200"
          >
            {t('signUpFree')}
          </Link>
        </div>

        {/* Wave SVG divider — transitions into footer bg */}
        <div className="relative z-10 w-full overflow-hidden leading-[0]" style={{ height: 72 }}>
          <svg
            viewBox="0 0 1440 72"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,36 C240,80 480,0 720,36 C960,72 1200,8 1440,36 L1440,72 L0,72 Z"
              className="fill-[#252641]"
            />
          </svg>
        </div>
      </section>

      {/* ── Multi-Column Footer ── */}
      <footer className="bg-[#252641] text-white pt-10 pb-10 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Grid: brand col + nav cols */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10">

            {/* Brand + Social */}
            <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-primary/20">
                  <Image height={40} width={40} src={logo} alt="Logo" className="w-full h-full rounded-lg" />
                </div>
                <div>
                  <p className="text-base font-extrabold tracking-tight leading-tight">The Codefather</p>
                  <p className="text-[10px] text-white/50 font-medium">{t('subTitle')}</p>
                </div>
              </div>

              <p className="text-xs text-white/50 font-medium leading-relaxed max-w-[200px]">
                {t('desc')}
              </p>

              <div className="flex items-center gap-3 mt-1">
                {[
                  { Icon: FaXTwitter, href: '#' },
                  { Icon: FaFacebookF, href: '#' },
                  { Icon: FaInstagram, href: '#' },
                  { Icon: FaGithub, href: '#' },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors duration-200"
                  >
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">{t('company')}</p>
              {[
                { label: locale === 'ar' ? 'من نحن' : 'About', path: '/' },
                { label: locale === 'ar' ? 'المميزات' : 'Features', path: '/' },
                { label: locale === 'ar' ? 'أعمالنا' : 'Works', path: '/' },
                { label: locale === 'ar' ? 'وظائف' : 'Career', path: '/' },
              ].map((item) => (
                <Link key={item.label} href={lp(item.path)} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Help */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">{t('help')}</p>
              {[
                { label: locale === 'ar' ? 'دعم العملاء' : 'Customer Support', path: '/' },
                { label: locale === 'ar' ? 'تفاصيل التوصيل' : 'Delivery Details', path: '/' },
                { label: locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', path: '/' },
                { label: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', path: '/' },
              ].map((item) => (
                <Link key={item.label} href={lp(item.path)} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Resources */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">{t('resources')}</p>
              {[
                { label: locale === 'ar' ? 'الكتب الإلكترونية' : 'Free eBooks', path: '/' },
                { label: locale === 'ar' ? 'دروس التطوير' : 'Development Tutorial', path: '/blog' },
                { label: locale === 'ar' ? 'المدونة' : 'How to – Blog', path: '/blog' },
                { label: locale === 'ar' ? 'قناة اليوتيوب' : 'Youtube Playlist', path: '/' },
              ].map((item) => (
                <Link key={item.label} href={lp(item.path)} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Newsletter */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">{t('newsletter')}</p>
              <p className="text-xs text-white/50 font-medium leading-relaxed">
                {t('newsletterDesc')}
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2 mt-1">
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:border-primary text-xs font-semibold text-white placeholder:text-white/40 transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 rounded-xl bg-primary hover:brightness-110 text-white font-extrabold text-xs shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-150"
                >
                  {subscribed ? t('subscribed') : t('subscribe')}
                </button>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/40 font-medium">
            <div className="flex flex-wrap justify-center gap-5">
              {[
                { label: locale === 'ar' ? 'من نحن' : 'About us', path: '/' },
                { label: locale === 'ar' ? 'اتصل بنا' : 'Contact', path: '/' },
                { label: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy policy', path: '/' },
                { label: locale === 'ar' ? 'خريطة الموقع' : 'Sitemap', path: '/' },
                { label: locale === 'ar' ? 'شروط الاستخدام' : 'Terms of Use', path: '/' },
              ].map((item) => (
                <Link key={item.label} href={lp(item.path)} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="text-center md:text-end">
              © {new Date().getFullYear()} {locale === 'ar' ? 'جميع الحقوق محفوظة. شركة Class Technologies Inc.' : 'Class Technologies Inc. All rights reserved.'}
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}
