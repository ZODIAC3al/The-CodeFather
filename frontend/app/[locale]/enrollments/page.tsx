'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Award,
  Play,
} from 'lucide-react';

export default function MyEnrollmentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  if (!authLoading && !isAuthenticated) {
    router.push(`/${locale}/login`);
  }

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const { data } = await api.get('/enrollments/my');
      return data || [];
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
              <h1 className="text-2xl font-black text-base-content tracking-tight">{t('tabCourses')}</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {enrollments.length} {tCommon('all')} {t('tabCourses')}
              </p>
            </div>
          </div>

          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => (
                <div key={enrollment.id || enrollment._id} className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden card-premium">
                  <div className="relative h-40">
                    <img
                      src={enrollment.course?.thumbnail || '/placeholder.jpg'}
                      alt={enrollment.course?.title || 'Course'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg leading-tight truncate">
                        {enrollment.course?.title || 'Course Title'}
                      </h3>
                      <p className="text-white/70 text-xs mt-1">
                        {enrollment.course?.instructor?.username || enrollment.course?.instructorName || 'Instructor'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${enrollment.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary">{enrollment.progress || 0}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-base-content/60 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {enrollment.course?.lectures?.length || 5} {tCommon('lecturesLabel')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {tCommon('badgeAdmission')}
                      </span>
                    </div>

                    <Link
                      href={`/${locale}/courses/${enrollment.course?.slug || enrollment.courseId}/lessons/${enrollment.course?.lessons?.[0]?.id || enrollment.course?.lessons?.[0]?._id}`}
                      className="btn btn-primary w-full rounded-xl font-bold"
                    >
                      <Play className="w-4 h-4" /> {t('resumeLearning')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-base-content/25 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-base-content mb-2">{t('noCourses')}</h3>
              <p className="text-sm text-base-content/50 mb-4">{t('noCoursesDesc')}</p>
              <Link href={`/${locale}/courses`} className="btn btn-primary rounded-xl font-bold">
                {t('browseCourses')}
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}