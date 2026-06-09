'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { 
  LayoutDashboard, BookOpen, Users, Calendar, Star, Video, 
  CreditCard, Settings, HelpCircle, DollarSign, Wallet
} from 'lucide-react';

const NAV_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/instructor/dashboard' },
  { label: 'My Courses', icon: BookOpen, href: '/instructor/courses' },
  { label: 'Students', icon: Users, href: '/instructor/students' },
  { label: 'Schedule', icon: Calendar, href: '/instructor/schedule' },
  { label: 'Reviews', icon: Star, href: '/instructor/reviews' },
];
const NAV_OTHERS = [
  { label: 'Meetings', icon: Video, href: '/meetings' },
  { label: 'Payments', icon: CreditCard, href: '/instructor/payments' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

export default function InstructorPaymentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

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

  // Total Earnings calculation
  const totalEarnings = payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

  if (authLoading || paymentsLoading) {
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
        
        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <div className="bg-base-100 rounded-2xl border border-base-300 p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-primary-content text-sm shrink-0">
              {user?.username?.[0]?.toUpperCase() ?? 'I'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-base-content truncate">{user?.username}</p>
              <p className="text-[10px] text-base-content/50 font-medium">Instructor</p>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">Menu</p>
            {NAV_MENU.map(({ label, icon: Icon, href }) => {
              const active = pathname?.includes(href);
              return (
                <Link key={href} href={`/${locale}${href}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />{label}
                </Link>
              );
            })}
            <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">Others</p>
            {NAV_OTHERS.map(({ label, icon: Icon, href }) => (
              <Link key={href} href={`/${locale}${href}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-150"
              >
                <Icon className="w-4 h-4 shrink-0" />{label}
              </Link>
            ))}
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-base-content tracking-tight">Payments & Revenue</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">Track your earnings and student purchases</p>
            </div>

            {/* Total Earnings KPI Box */}
            <div className="flex items-center gap-3 bg-base-100 px-5 py-3 rounded-2xl border border-base-300 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wide">Total Earnings</p>
                <p className="text-lg font-black text-base-content">${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-base-300">
              <h2 className="text-sm font-black text-base-content">
                Payment Transactions History ({payments.length})
              </h2>
            </div>

            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr className="bg-base-200/50 text-[10px] uppercase tracking-wider text-base-content/40 font-black">
                      <th className="py-3 px-5">Student</th>
                      <th className="py-3 px-5">Course</th>
                      <th className="py-3 px-5">Transaction Date</th>
                      <th className="py-3 px-5">Earnings ($ USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {payments.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-base-200/30 transition-colors">
                        <td className="py-4 px-5">
                          <div>
                            <p className="font-bold text-base-content text-sm">{entry.user?.username || 'Student'}</p>
                            <p className="text-[10px] text-base-content/40 font-semibold">{entry.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-bold text-base-content/85 text-xs truncate max-w-[200px]">
                          {entry.course?.title || 'Unknown Course'}
                        </td>
                        <td className="py-4 px-5 text-base-content/50 text-xs font-semibold">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-5 text-primary font-black text-sm">
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
                <p className="text-sm text-base-content/40 font-medium">No sales recorded yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
