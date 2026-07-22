'use client';

import {
	BookOpen,
	Eye,
	Layers,
	Menu,
	Plus,
	Settings,
	Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import InstructorSidebar from '@/components/InstructorSidebar';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function InstructorCoursesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router   = useRouter();
  const locale   = useLocale();
  const isRTL    = locale === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tAdmin      = useTranslations('admin');
  const tInstructor = useTranslations('instructor');
  const tCommon     = useTranslations('common');

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
        <span className="text-sm font-extrabold text-base-content">{tInstructor('myCourses')}</span>
      </div>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        <InstructorSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                {tInstructor('myCourses')}
              </h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {isRTL
                  ? 'إدارة وتنظيم قائمة الدورات'
                  : 'Manage and organize your course blueprint list'}
              </p>
            </div>
            <Link
              href={`/${locale}/courses/create`}
              className="btn btn-primary btn-sm rounded-xl flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" />
              {isRTL ? 'دورة جديدة' : 'New Course'}
            </Link>
          </div>

          {/* Courses Table Card */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-4 border-b border-base-300">
              <h2 className="text-sm font-black text-base-content">
                {isRTL ? `جميع الدورات (${myCourses.length})` : `All Courses (${myCourses.length})`}
              </h2>
            </div>

            {myCourses.length > 0 ? (
              <div className="divide-y divide-base-300">
                {myCourses.map((course: any) => (
                  <div
                    key={course.id ?? course._id}
                    className="px-4 sm:px-5 py-4 flex items-center justify-between hover:bg-base-200/40 transition-colors gap-3 flex-wrap"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-base-300 overflow-hidden shrink-0 shadow-sm border border-base-300">
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-base-content leading-tight truncate max-w-[200px] sm:max-w-none">
                          {course.title}
                        </p>
                        <p className="text-[10px] text-base-content/50 font-medium flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {course.enrollmentCount ?? 0}{' '}
                            {isRTL ? 'طالب' : 'students enrolled'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {course.lessons?.length ?? course.lessonCount ?? 0}{' '}
                            {isRTL ? 'دروس' : 'lessons'}
                          </span>
                          {course.price != null && (
                            <span className="font-bold text-primary">${course.price}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <span className={`badge badge-sm font-bold ${
                        course.status === 'PUBLISHED' || course.published
                          ? 'badge-success text-success-content'
                          : 'badge-warning text-warning-content'
                      }`}>
                        {course.status === 'PUBLISHED' || course.published
                          ? (isRTL ? 'منشور' : 'PUBLISHED')
                          : (isRTL ? 'مسودة' : 'DRAFT')}
                      </span>
                      <div className="flex gap-1.5">
                        <Link
                          href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}`}
                          className="btn btn-xs btn-ghost text-base-content/60 hover:text-primary flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{tCommon('view')}</span>
                        </Link>
                        <Link
                          href={`/${locale}/courses/${course.slug ?? course.id ?? course._id}/edit`}
                          className="btn btn-xs btn-primary btn-outline rounded-lg flex items-center gap-1 font-bold"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{tCommon('edit')}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">
                  {isRTL ? 'لم يتم إنشاء دورات بعد.' : 'No courses created yet.'}
                </p>
                <Link href={`/${locale}/courses/create`} className="btn btn-primary btn-sm rounded-xl font-bold mt-4">
                  {isRTL ? 'إنشاء دورتك الأولى' : 'Create Your First Course'}
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}