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
  CreditCard, Settings, HelpCircle, MessageSquare
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

export default function InstructorReviewsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  if (!authLoading && (!isAuthenticated || user?.role !== 'INSTRUCTOR')) {
    router.push(`/${locale}/login`);
  }

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['instructorReviews'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/reviews');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  // Average Rating calculation
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
    : 'No reviews';

  if (authLoading || reviewsLoading) {
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
              <h1 className="text-2xl font-black text-base-content tracking-tight">Reviews</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">Analyze ratings and course critiques from students</p>
            </div>
            
            {/* Average Rating KPI Badge */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 bg-base-100 px-4 py-2 rounded-2xl border border-base-300 shadow-sm">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-black text-base-content">{avgRating} / 5</span>
                <span className="text-[10px] text-base-content/40 font-bold">({totalReviews} reviews)</span>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm p-6">
            <h2 className="text-sm font-black text-base-content mb-6">Recent Critiques</h2>

            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((r: any) => (
                  <div key={r.id} className="pb-6 border-b border-base-300 last:border-none last:pb-0 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold uppercase shrink-0">
                      {r.user?.avatar ? (
                        <img src={r.user.avatar} alt={r.user.username} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        r.user?.username?.[0] || 'U'
                      )}
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-extrabold text-sm text-base-content">{r.user?.username || 'Student User'}</span>
                          <span className="text-[10px] font-bold text-base-content/40 ml-2">on {r.course?.title || 'Course'}</span>
                        </div>
                        <span className="text-[10px] text-base-content/40 font-semibold">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-warning text-warning' : 'text-base-content/20'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-base-content/75 font-semibold leading-relaxed pt-1.5">{r.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">No reviews registered yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
