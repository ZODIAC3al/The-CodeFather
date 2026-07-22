'use client';

import { DollarSign, Menu, Wallet } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import InstructorSidebar from '@/components/InstructorSidebar';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function InstructorPaymentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router  = useRouter();
  const locale  = useLocale();
  const isRTL   = locale === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tAdmin   = useTranslations('admin');
  const tPayPage = useTranslations('admin.paymentsPage');

  if (!authLoading && (!isAuthenticated || user?.role !== 'INSTRUCTOR')) {
    router.push(`/${locale}/login`);
  }

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['instructorPayments'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/payments');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  const totalEarnings = payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

  if (authLoading || paymentsLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans transition-all duration-300"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Navbar />

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-base-100 border-b border-base-300">
        <button
          onClick={() => setSidebarOpen(true)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold text-base-content">{tPayPage('title')}</span>
      </div>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        <InstructorSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                {tPayPage('title')}
              </h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {tPayPage('subtitle')}
              </p>
            </div>

            {/* Total Earnings KPI */}
            <div className="flex items-center gap-3 bg-base-100 px-4 sm:px-5 py-3 rounded-2xl border border-base-300 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wide">
                  {tPayPage('totalRevenue')}
                </p>
                <p className="text-lg font-black text-base-content">
                  ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-4 border-b border-base-300">
              <h2 className="text-sm font-black text-base-content">
                {isRTL
                  ? `سجل معاملات الدفع (${payments.length})`
                  : `Payment Transactions History (${payments.length})`}
              </h2>
            </div>

            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-base-200/50 text-[10px] uppercase tracking-wider text-base-content/40 font-black">
                      <th className="py-3 px-4 sm:px-5">{tPayPage('student')}</th>
                      <th className="py-3 px-4 sm:px-5">{tPayPage('course')}</th>
                      <th className="py-3 px-4 sm:px-5">{tPayPage('date')}</th>
                      <th className="py-3 px-4 sm:px-5">{tPayPage('amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {payments.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-base-200/30 transition-colors">
                        <td className="py-4 px-4 sm:px-5">
                          <div>
                            <p className="font-bold text-base-content text-sm">
                              {entry.user?.username || (isRTL ? 'طالب' : 'Student')}
                            </p>
                            <p className="text-[10px] text-base-content/40 font-semibold">{entry.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-5 font-bold text-base-content/85 text-xs truncate max-w-[160px]">
                          {entry.course?.title || (isRTL ? 'دورة غير معروفة' : 'Unknown Course')}
                        </td>
                        <td className="py-4 px-4 sm:px-5 text-base-content/50 text-xs font-semibold">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : undefined)
                            : '—'}
                        </td>
                        <td className="py-4 px-4 sm:px-5 text-primary font-black text-sm">
                          +${entry.amount ? Number(entry.amount).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <Wallet className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">
                  {isRTL ? 'لا توجد مبيعات مسجلة بعد.' : 'No sales recorded yet.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}