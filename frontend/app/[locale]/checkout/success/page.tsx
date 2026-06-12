'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, PlayCircle, Receipt, ArrowRight, ShieldCheck, Users, Copy } from 'lucide-react';
import { Suspense, useState, useEffect } from 'react';

function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('course_id');
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('checkoutSuccess');
  const queryClient = useQueryClient();

  // Fetch course details
  const { data: course, isLoading } = useQuery({
    queryKey: ['courseSuccessDetail', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);
      const endpoint = isObjectId ? `/courses/by-id/${courseId}` : `/courses/${courseId}`;
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch order details for group token
  const { data: order } = useQuery({
    queryKey: ['orderSuccessDetail', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await api.get(`/payments/orders/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
    retry: false,
  });

  // Invalidate enrollments on mount to refresh user's access
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
  }, [queryClient]);

  const [copied, setCopied] = useState(false);
  const groupToken = order?.groupToken;

  const copyGroupLink = () => {
    if (groupToken) {
      const link = `${window.location.origin}/${locale}/join/group?token=${groupToken}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    );
  }

  const courseSlug = course?.slug || courseId;

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 w-full flex-grow flex flex-col justify-center animate-fade-in">
        <div className="card-premium p-8 sm:p-12 rounded-3xl border border-base-300 shadow-xl text-center relative overflow-hidden bg-base-100/80 backdrop-blur-md">
          {/* Top glow decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-success/10 rounded-full blur-3xl -z-10" />

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center text-success animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-base-content mb-3 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-base-content/70 max-w-md mx-auto mb-8 font-medium">
            {t('subtitle')}
          </p>

          {course && (
            <div className="p-6 bg-base-200/50 rounded-2xl border border-base-300/50 max-w-lg mx-auto mb-8 text-left space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-base-300 flex-shrink-0 overflow-hidden relative">
                  {course.thumbnail && (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">{t('enrolledCourse')}</span>
                  <h4 className="font-bold text-base-content text-sm leading-tight mt-0.5">{course.title}</h4>
                </div>
              </div>

              <div className="pt-4 border-t border-base-300/50 text-xs font-semibold text-base-content/60 space-y-2">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Receipt className="w-3.5 h-3.5 text-base-content/40" /> {t('orderId')}</span>
                  <span className="font-mono text-base-content font-bold">{sessionId?.slice(0, 18) || 'paypal_order'}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-success" /> {t('status')}</span>
                  <span className="badge badge-success text-[10px] font-black uppercase tracking-wider text-success-content px-2 py-1">{t('paid')}</span>
                </div>
              </div>
            </div>
          )}

          {groupToken && (
            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300/50 max-w-lg mx-auto mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{locale === 'ar' ? 'تسجيل المجموعة' : 'Group Enrollment'}</span>
              </div>
              <p className="text-xs text-base-content/70 mb-3">
                {locale === 'ar' ? 'شارك هذا الرابط مع فريقك لمنحهم حق الوصول إلى هذه الدورة' : 'Share this link with your team to grant them access to this course'}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/join/group?token=${groupToken}`}
                  className="input input-xs flex-1 font-mono text-xs"
                />
                <button
                  onClick={copyGroupLink}
                  className="btn btn-xs btn-primary font-bold"
                >
                  {copied ? (locale === 'ar' ? 'تم النسخ!' : 'Copied!') : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => {
                const firstLessonId = course?.lessons?.[0]?.id || course?.lessons?.[0]?._id;
                if (courseSlug && firstLessonId) {
                  router.push(`/${locale}/courses/${courseSlug}/lessons/${firstLessonId}`);
                } else if (courseSlug) {
                  router.push(`/${locale}/courses/${courseSlug}`);
                } else {
                  router.push(`/${locale}/courses`);
                }
              }}
              className="btn-premium flex-grow py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 cursor-pointer"
            >
              <PlayCircle className="w-5 h-5" /> {t('startLearning')} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push(`/${locale}/profile`)}
              className="btn btn-outline border-base-300/80 hover:bg-base-200 text-base-content font-bold px-6 py-4 rounded-xl cursor-pointer"
            >
              {t('goToProfile')}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    }>
      <CheckoutSuccess />
    </Suspense>
  );
}
