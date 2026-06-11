'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Moon, Sun, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');

  if (!authLoading && !isAuthenticated) {
    router.push(`/${locale}/login`);
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/settings');
      return data;
    },
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-base-content tracking-tight">{t('settings')}</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">{settings?.siteDescription || ''}</p>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-6">
            <h2 className="text-sm font-black text-base-content mb-4">{t('language')}</h2>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${locale === 'ar' ? 'en' : 'ar'}/settings`)}
                className="btn btn-outline btn-sm rounded-xl font-bold"
              >
                <Globe className="w-4 h-4" />
                {locale === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}