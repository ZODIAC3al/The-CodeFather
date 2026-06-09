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
  CreditCard, Settings, HelpCircle, Plus, Eye, Layers
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

export default function InstructorCoursesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  if (!authLoading && (!isAuthenticated || user?.role !== 'INSTRUCTOR')) {
    router.push(`/${locale}/login`);
  }

  const { data: myCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['instructorCourses', user?.sub],
    queryFn: async () => {
      const { data } = await api.get('/courses', {
        params: { instructorId: user?.sub, showAll: 'true' },
      });
      return data.data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR' && user?.sub),
  });

  if (authLoading || coursesLoading) {
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
              <h1 className="text-2xl font-black text-base-content tracking-tight">My Courses</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">Manage and organize your course blue print list</p>
            </div>
            <Link href={`/${locale}/courses/create`}
              className="btn btn-primary btn-sm rounded-xl flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" /> New Course
            </Link>
          </div>

          {/* Courses Table Card */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-base-300">
              <h2 className="text-sm font-black text-base-content">
                All Courses ({myCourses.length})
              </h2>
            </div>

            {myCourses.length > 0 ? (
              <div className="divide-y divide-base-300">
                {myCourses.map((course: any) => (
                  <div key={course.id ?? course._id}
                    className="px-5 py-4 flex items-center justify-between hover:bg-base-200/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-base-300 overflow-hidden shrink-0 shadow-sm border border-base-300">
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-bold text-base-content leading-tight">{course.title}</p>
                        <p className="text-[10px] text-base-content/50 font-medium flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />{course.enrollmentCount ?? 0} students enrolled
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />{course.lessons?.length ?? course.lessonCount ?? 0} lessons
                          </span>
                          {course.price != null && (
                            <span className="font-bold text-primary">${course.price}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`badge badge-sm font-bold ${course.status === 'PUBLISHED' || course.published
                        ? 'badge-success text-success-content' : 'badge-warning text-warning-content'
                        }`}>
                        {course.status ?? (course.published ? 'Published' : 'Draft')}
                      </span>
                      <div className="flex gap-1.5">
                        <Link href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}`}
                          className="btn btn-xs btn-ghost text-base-content/60 hover:text-primary flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        <Link href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}/edit`}
                          className="btn btn-xs btn-primary btn-outline rounded-lg flex items-center gap-1 font-bold">
                          <Settings className="w-3.5 h-3.5" /> Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">No courses created yet.</p>
                <Link href={`/${locale}/courses/create`} className="btn btn-primary btn-sm rounded-xl font-bold mt-4">
                  Create Your First Course
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
