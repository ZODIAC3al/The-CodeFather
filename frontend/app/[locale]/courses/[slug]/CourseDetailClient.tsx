'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Users,
  Star,
  Play,
  CheckCircle2,
  ChevronRight,
  Lock,
  Share2,
  Award,
  Smartphone,
  Clock
} from 'lucide-react';

interface CourseDetailClientProps {
  course: any;
  locale: string;
}

export default function CourseDetailClient({ course, locale }: CourseDetailClientProps) {
  const router = useRouter();
  const slug = course?.slug || '';
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const lpUrl = (path: string) => `/${locale}${path}`;
  const t = useTranslations('courseDetail');
  const tCommon = useTranslations('common');

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'reviews'>('overview');

  const { data: enrollments } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const { data } = await api.get('/enrollments/my');
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: myMembership } = useQuery({
    queryKey: ['myMembership'],
    queryFn: async () => {
      const { data } = await api.get('/memberships/my');
      return data;
    },
    enabled: isAuthenticated,
  });

  const isEnrolled = enrollments?.some(
    (e: any) => e.courseId === course?.id || e.course?._id === course?.id
  ) || myMembership?.status === 'ACTIVE';

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const price = Number(course?.price ?? course?.discountPrice ?? 0);
      const hasActiveMembership = myMembership?.status === 'ACTIVE';
      if (price > 0 && !hasActiveMembership) {
        router.push(`/${locale}/checkout/purchase?courseId=${course.id || course._id}&type=individual`);
        return;
      }
      const { data } = await api.post('/enrollments/enroll', { courseId: course?.id || course?._id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
      router.push(`/${locale}/courses/${slug}/lessons/${course.lessons?.[0]?.id || course.lessons?.[0]?._id}`);
    },
    onError: (err: any) => {
      setCheckoutError(err.response?.data?.message || 'Failed to enroll');
    }
  });

  const handleEnroll = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    enrollMutation.mutate();
  };

  if (!course) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow flex-col">
          <h1 className="text-3xl font-bold text-base-content mb-4">Course not found</h1>
          <Link href={`/${locale}/courses`} className="btn-premium px-6 py-2 rounded-xl">Go Back</Link>
        </div>
      </div>
    );
  }

  const reviews = course.reviews || [];
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '4.8';

  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r: any) => {
    const starIdx = Math.max(0, Math.min(4, 5 - r.rating));
    starCounts[starIdx]++;
  });

  return (
    <div className="flex flex-col min-h-screen bg-base-100 font-sans text-base-content">
      <Navbar />

      <section className="relative bg-[#252641] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80"
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          <div className="lg:col-span-2 space-y-6 self-center">
            <div className="flex gap-2">
              <span className="badge badge-primary font-bold text-xs uppercase tracking-wider px-3.5 py-2">
                {course.category?.name || 'Programming'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-xl font-medium leading-relaxed">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-bold text-white/95">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span>{averageRating} ({totalReviews} {t('reviews')})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>{course.enrollmentCount || 0} {t('studentsEnrolled')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#29B2FE]" />
                <span>{course.lessons?.length || 0} {t('lessons')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card bg-base-100 dark:bg-base-200 text-base-content border border-base-300 shadow-2xl rounded-3xl overflow-hidden max-w-md mx-auto">
              <div className="relative aspect-video bg-base-300">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base-content/30 font-black">
                    Preview
                  </div>
                )}
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center pl-1 text-primary shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 fill-primary text-primary" />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-base-content">
                    {(() => {
                      const price = Number(course?.price ?? course?.discountPrice ?? 0);
                      return price === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : `$${price.toFixed(2)}`;
                    })()}
                  </span>
                  {(() => {
                    const price = Number(course?.price ?? course?.discountPrice ?? 0);
                    return price > 0 && (
                      <>
                        <span className="text-sm line-through text-base-content/50 font-bold">$99.99</span>
                        <span className="badge badge-success text-[10px] font-black uppercase text-success-content">{locale === 'ar' ? 'خصم 50%' : '50% OFF'}</span>
                      </>
                    );
                  })()}
                </div>
                <div className="text-xs font-bold text-error animate-pulse flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {t('hoursLeft')}
                </div>

                {checkoutError && (
                  <div className="alert alert-error text-xs font-bold p-3 rounded-xl">{checkoutError}</div>
                )}

                {isEnrolled ? (
                  <Link
                    href={`/${locale}/courses/${slug}/lessons/${course.lessons?.[0]?.id || course.lessons?.[0]?._id}`}
                    className="btn btn-primary w-full rounded-2xl font-bold py-3 text-white flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/45"
                  >
                    <Play className="w-4 h-4 fill-white text-white" /> {t('resumeCurriculum')}
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="btn btn-primary w-full rounded-2xl font-bold py-3 text-white flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/45"
                  >
                    {enrollMutation.isPending ? t('processing') : (() => {
                      const price = Number(course?.price ?? course?.discountPrice ?? 0);
                      return price === 0 ? t('enrollFree') : t('buyNow');
                    })()}
                  </button>
                )}

                <div className="space-y-3 pt-4 border-t border-base-300">
                  <h4 className="font-extrabold text-xs text-base-content/80 uppercase tracking-wider">{t('courseIncludes')}</h4>
                  <ul className="text-xs font-bold text-base-content/70 space-y-2.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" /> {t('moneyBack')}
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#29B2FE]" /> {t('lifetimeAccess')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-primary" /> {t('mobileAccess')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#33D190]" /> {t('certificate')}
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 pt-4 border-t border-base-300">
                  <div className="text-xs font-bold text-center space-y-2">
                    <div className="text-base-content/50">{t('trainingTeams')}</div>
                    <Link href={`/${locale}/checkout/purchase?courseId=${course.id || course._id}&type=group`} className="text-primary hover:underline font-bold block">
                      {locale === 'ar' ? 'شراء حق الوصول لتدريب الفريق' : 'Buy Team Training Access'}
                    </Link>
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-1 border-t border-base-300/50">
                    <span className="text-xs font-bold text-base-content/50">{t('share')}</span>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-primary" aria-label="Share on Facebook">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h3v-9h3.6l.4-3H12V6c0-.9.2-1.2 1.1-1.2H15V2h-2.8C9.5 2 9 3.5 9 5.8V8z" /></svg>
                      </button>
                      <button className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-primary" aria-label="Share on Twitter">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex border-b border-base-300 gap-6 overflow-x-auto">
            {['overview', 'syllabus', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 text-sm font-extrabold capitalize transition-all relative whitespace-nowrap ${activeTab === tab
                  ? 'text-primary font-black border-b-2 border-primary'
                  : 'text-base-content/60 hover:text-primary'
                  }`}
              >
                {tab === 'overview' ? t('overview') : tab === 'syllabus' ? t('syllabus') : t('reviews')}
              </button>
            ))}
          </div>

          <div className="pt-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="card bg-base-100 p-8 rounded-3xl border border-base-300 shadow-sm space-y-4">
                  <h3 className="text-xl font-extrabold text-[#1E2A38] dark:text-white">{t('aboutCourse')}</h3>
                  <p className="text-sm sm:text-base text-base-content/75 leading-relaxed font-medium">
                    {course.description}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'syllabus' && (
              <div className="card bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-base-300 bg-base-200/50">
                  <h3 className="font-extrabold text-[#1E2A38] dark:text-white">{t('courseCurriculum')}</h3>
                </div>
                <div className="divide-y divide-base-300">
                  {course.lessons?.map((lesson: any, idx: number) => (
                    <div key={lesson.id || lesson._id} className="p-5 flex items-center justify-between hover:bg-base-200/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-base-content text-sm">{lesson.title}</h4>
                          <span className="text-xs text-base-content/50 flex items-center gap-1 mt-1 font-semibold">
                            <Play className="w-3.5 h-3.5" /> {t('videoLesson', { duration: lesson.duration || 10 })}
                          </span>
                        </div>
                      </div>
                      {isEnrolled ? (
                        <Link href={`/${locale}/courses/${slug}/lessons/${lesson.id || lesson._id}`} className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 font-bold rounded-xl">
                          {t('watch')}
                        </Link>
                      ) : (
                        <Lock className="w-4 h-4 text-base-content/35 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm space-y-4">
                  <div className="text-center space-y-1">
                    <div className="text-5xl font-black text-[#1E2A38] dark:text-white">{averageRating}</div>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'fill-warning text-warning' : 'text-base-content/20'}`} />
                      ))}
                    </div>
                    <div className="text-[10px] font-bold text-base-content/50 uppercase">{t('ratingCount', { count: totalReviews })}</div>
                  </div>
                </div>

                <div className="md:col-span-2 card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((r: any) => (
                      <div key={r.id || r._id} className="border-b border-base-300 pb-5 last:border-0 last:pb-0 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold uppercase shrink-0">
                          {r.user?.username?.[0] || 'U'}
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-base-content">{r.user?.username || 'Student User'}</span>
                          </div>
                          <p className="text-sm text-base-content/80 font-semibold leading-relaxed pt-1">{r.comment}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-base-content/50 font-bold text-sm">
                      {t('noReviewsYet')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm">
            <h3 className="font-extrabold text-base-content/40 text-[10px] uppercase tracking-wider mb-4">
              {t('instructorProfile')}
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-xl uppercase shadow-inner">
                {course.instructor?.username?.[0] || 'I'}
              </div>
              <div>
                <h4 className="font-extrabold text-base-content text-lg leading-tight">
                  {course.instructor?.username || 'Unknown Instructor'}
                </h4>
                <span className="text-xs text-primary font-bold">{t('certifiedInstructor')}</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}