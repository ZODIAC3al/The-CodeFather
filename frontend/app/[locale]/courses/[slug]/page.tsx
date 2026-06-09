'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import {
  BookOpen,
  Users,
  Star,
  Play,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Share2,
  Calendar,
  Award,
  Smartphone,
  Clock
} from 'lucide-react';
import { useLocale } from 'next-intl';

export default function CourseDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const lpUrl = (path: string) => `/${locale}${path}`;

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'reviews'>('overview');

  // Fetch course details
  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${slug}`);
      return data;
    },
  });

  // Fetch user enrollments to check progress / enrollment state
  const { data: enrollments } = useQuery({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const { data } = await api.get('/enrollments/my');
      return data;
    },
    enabled: isAuthenticated,
  });

  const isEnrolled = enrollments?.some(
    (e: any) => e.courseId === course?.id || e.course?._id === course?.id
  );

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (course?.price > 0) {
        router.push(`/${locale}/checkout?courseId=${course.id || course._id}`);
        return;
      }
      const { data } = await api.post('/enrollments', { courseId: course?.id || course?._id });
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

  if (isCourseLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    );
  }

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

  const courseSchema = course ? {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "The Codefather",
      "sameAs": `http://localhost:3000/${locale}`
    },
    "image": course.thumbnail || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80",
    "offers": {
      "@type": "Offer",
      "price": course.price,
      "priceCurrency": "USD",
      "category": course.price === 0 ? "Free" : "Paid"
    },
    "instructor": {
      "@type": "Person",
      "name": course.instructor?.username || "Mentor"
    }
  } : null;

  return (
    <div className="flex flex-col min-h-screen bg-base-100 font-sans text-base-content">
      {courseSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
        />
      )}
      <Navbar />

      {/* ── 1. COURSE HERO BANNER & PREVIEW WIDGET ── */}
      <section className="relative bg-[#252641] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80"
            alt="Colleague work"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
          {/* Hero Left Content */}
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
                <span>{averageRating} ({totalReviews} Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>{course.enrollmentCount || 0} Students Enrolled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#29B2FE]" />
                <span>{course.lessons?.length || 0} Lessons</span>
              </div>
            </div>
          </div>

          {/* Hero Right Preview Box (Floating Purchase Card) */}
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

              {/* Purchase Card Body */}
              <div className="p-6 space-y-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-base-content">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                  {course.price > 0 && (
                    <>
                      <span className="text-sm line-through text-base-content/50 font-bold">$99.99</span>
                      <span className="badge badge-success text-[10px] font-black uppercase text-success-content">50% OFF</span>
                    </>
                  )}
                </div>
                <div className="text-xs font-bold text-error animate-pulse flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 10-hours left at this price!
                </div>

                {checkoutError && (
                  <div className="alert alert-error text-xs font-bold p-3 rounded-xl">{checkoutError}</div>
                )}

                {isEnrolled ? (
                  <Link
                    href={`/${locale}/courses/${slug}/lessons/${course.lessons?.[0]?.id || course.lessons?.[0]?._id}`}
                    className="btn btn-primary w-full rounded-2xl font-bold py-3 text-white flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/45"
                  >
                    <Play className="w-4 h-4 fill-white text-white" /> Resume Curriculum
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="btn btn-primary w-full rounded-2xl font-bold py-3 text-white flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/45"
                  >
                    {enrollMutation.isPending ? 'Processing...' : course.price === 0 ? 'Enroll for Free' : 'Buy Now'}
                  </button>
                )}

                {/* Inclusions */}
                <div className="space-y-3 pt-4 border-t border-base-300">
                  <h4 className="font-extrabold text-xs text-base-content/80 uppercase tracking-wider">This Course includes:</h4>
                  <ul className="text-xs font-bold text-base-content/70 space-y-2.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" /> 30-Day Money-Back Guarantee
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#29B2FE]" /> Full lifetime access
                    </li>
                    <li className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-primary" /> Access on mobile and TV
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#33D190]" /> Certificate of completion
                    </li>
                  </ul>
                </div>

                {/* Sharing and bulk offer */}
                <div className="space-y-4 pt-4 border-t border-base-300">
                  <div className="text-xs font-bold text-center">
                    <span className="text-base-content/50">Training 5 or more people?</span> <br />
                    <Link href={lpUrl('/membership')} className="text-primary hover:underline">Get business plan</Link>
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-1 border-t border-base-300/50">
                    <span className="text-xs font-bold text-base-content/50">Share:</span>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-primary" aria-label="Share on Facebook">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h3v-9h3.6l.4-3H12V6c0-.9.2-1.2 1.1-1.2H15V2h-2.8C9.5 2 9 3.5 9 5.8V8z" /></svg>
                      </button>
                      <button className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-primary" aria-label="Share on Twitter">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                      </button>
                      <button className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-primary" aria-label="Share on Instagram">
                        <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TABS & DETAILED SPECIFICATION (Overview, Syllabus, Reviews) ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs header */}
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
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="pt-2">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="card bg-base-100 p-8 rounded-3xl border border-base-300 shadow-sm space-y-4">
                  <h3 className="text-xl font-extrabold text-[#1E2A38] dark:text-white">About this course</h3>
                  <p className="text-sm sm:text-base text-base-content/75 leading-relaxed font-medium">
                    {course.description}
                  </p>
                  <p className="text-sm sm:text-base text-base-content/75 leading-relaxed font-medium">
                    Our dynamic study circles synchronize curriculum updates automatically. In this course, you will learn the foundations and advanced structures through comprehensive lectures, active programming tasks, and peer-to-peer coding meetups.
                  </p>
                </div>
              </div>
            )}

            {/* SYLLABUS TAB */}
            {activeTab === 'syllabus' && (
              <div className="card bg-base-100 rounded-3xl border border-base-300 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-base-300 bg-base-200/50">
                  <h3 className="font-extrabold text-[#1E2A38] dark:text-white">Course Curriculum</h3>
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
                            <Play className="w-3.5 h-3.5" /> Video Lesson ({lesson.duration || 10}m)
                          </span>
                        </div>
                      </div>
                      {isEnrolled ? (
                        <Link href={`/${locale}/courses/${slug}/lessons/${lesson.id || lesson._id}`} className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 font-bold rounded-xl">
                          Watch
                        </Link>
                      ) : (
                        <Lock className="w-4 h-4 text-base-content/35 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Rating breakdown */}
                <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm space-y-4">
                  <div className="text-center space-y-1">
                    <div className="text-5xl font-black text-[#1E2A38] dark:text-white">{averageRating}</div>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'fill-warning text-warning' : 'text-base-content/20'}`} />
                      ))}
                    </div>
                    <div className="text-[10px] font-bold text-base-content/50 uppercase">{totalReviews} Ratings</div>
                  </div>

                  {/* Bars */}
                  <div className="space-y-2 text-xs font-semibold">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = starCounts[5 - stars];
                      const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="w-12 text-base-content/70 text-end">{stars} Stars</span>
                          <div className="flex-grow bg-base-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-base-content/50 text-start">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="md:col-span-2 card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((r: any) => (
                      <div key={r.id || r._id} className="border-b border-base-300 pb-5 last:border-0 last:pb-0 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold uppercase shrink-0">
                          {r.user?.avatar ? (
                            <img src={r.user.avatar} alt={r.user.username} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            r.user?.username?.[0] || 'U'
                          )}
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-base-content">{r.user?.username || 'Student User'}</span>
                            <span className="text-[10px] text-base-content/40 font-bold">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-warning text-warning' : 'text-base-content/25'}`} />
                            ))}
                          </div>
                          <p className="text-sm text-base-content/80 font-semibold leading-relaxed pt-1">{r.comment}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-base-content/50 font-bold text-sm">
                      No student reviews registered yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Instructor Details */}
        <aside className="space-y-6">
          <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-sm">
            <h3 className="font-extrabold text-base-content/40 text-[10px] uppercase tracking-wider mb-4">
              Instructor Profile
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-xl uppercase shadow-inner">
                {course.instructor?.avatar ? (
                  <img src={course.instructor.avatar} alt={course.instructor.username} className="w-full h-full object-cover rounded-full" />
                ) : (
                  course.instructor?.username?.[0] || 'I'
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-base-content text-lg leading-tight">
                  {course.instructor?.username || 'Unknown Instructor'}
                </h4>
                <span className="text-xs text-primary font-bold">Certificated Instructor</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-base-content/75 leading-relaxed font-semibold">
              {course.instructor?.bio || 'An expert educator committed to teaching local community learners.'}
            </p>
          </div>
        </aside>
      </main>

      {/* ── 3. MARKETING ARTICLES SECTION ── */}
      <section className="py-20 bg-base-200/40 border-y border-base-300/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E2A38] dark:text-white">Marketing Articles</h2>
              <p className="text-xs sm:text-sm text-base-content/50 font-semibold">Read related career advice and industry tips.</p>
            </div>
            <Link href={lpUrl('/blog')} className="text-primary text-xs sm:text-sm font-extrabold hover:underline">
              See all
            </Link>
          </div>

          {/* 4 Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                category: 'Design',
                time: '3 Months',
                title: 'AWS Certified Solutions Architect',
                desc: 'A comprehensive syllabus analyzing cloud security, VPC networks, and scaling.',
                img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=80',
                price: '$80'
              },
              {
                category: 'Development',
                time: '2 Months',
                title: 'Introduction to Next.js App Router',
                desc: 'Dive into Next.js Server Components, static rendering, dynamic routing, and API cache.',
                img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80',
                price: '$49'
              },
              {
                category: 'Architecture',
                time: '1 Month',
                title: 'Mastering NestJS Microservices',
                desc: 'Analyze dependency injection, REST control modules, and Mongoose connection pipelines.',
                img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=80',
                price: '$65'
              },
              {
                category: 'Productivity',
                time: '4 Weeks',
                title: 'Developer PWA Caching Strategy',
                desc: 'Implement offline sandbox monitors, document fallbacks, and local storage state.',
                img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80',
                price: '$20'
              }
            ].map((art, i) => (
              <div key={i} className="card bg-base-100 rounded-2xl overflow-hidden border border-base-300 flex flex-col hover:shadow-xl transition-shadow duration-300">
                <div className="relative aspect-video bg-base-300">
                  <img src={art.img} alt={art.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 badge badge-primary text-[9px] font-extrabold uppercase py-2">
                    {art.category}
                  </span>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-base-content/40 flex items-center gap-1">
                      <span>Course Length:</span>
                      <span className="text-base-content/70 font-extrabold">{art.time}</span>
                    </div>
                    <h3 className="font-extrabold text-sm text-base-content leading-snug line-clamp-1">{art.title}</h3>
                    <p className="text-xs text-base-content/60 font-semibold line-clamp-2 leading-relaxed">{art.desc}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-base-300/40">
                    <span className="text-xs font-black text-primary">{art.price}</span>
                    <span className="text-[10px] font-extrabold text-base-content/40 hover:text-primary cursor-pointer transition-colors">Details</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. CLASSROOM PROMO CARD SECTION ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-[#1E2A38] dark:text-white leading-tight">
              Everything you can do in a physical classroom, <span className="text-primary">you can do with us</span>
            </h2>
            <p className="text-sm sm:text-base text-base-content/75 leading-relaxed font-semibold">
              The Codefather synchronizes student portals, live reviews, developer notes, and schedules to offer physical classroom efficacy in a flexible web browser.
            </p>
            <div className="pt-2">
              <Link href={lpUrl('/roadmap')} className="text-primary font-bold hover:underline inline-flex items-center gap-2">
                Curriculum Roadmap <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[16/10] border border-base-300">
            <img
              src="https://images.unsplash.com/photo-1544535830-9dff9a014bb0?w=800&auto=format&fit=crop&q=80"
              alt="Interactive Class"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 5. PROMOTION OFFERS AND DEALS ── */}
      <section className="py-16 bg-[#E2F0EF]/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E2A38] dark:text-white">Top Education offers and deals are listed here</h2>
            <p className="text-xs sm:text-sm text-base-content/50 font-bold">Benefit from local cohort discounts and memberships.</p>
          </div>

          {/* 3 cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { discount: '50%', label: 'FOR INSTRUCTORS', desc: 'Join as a local mentor to access professional grading tools and classroom inventory manager.' },
              { discount: '60%', label: 'FOR STUDENTS', desc: 'Acquire corporate membership plans to get unlimited Capstone project reviews.' },
              { discount: '60%', label: 'FOR TEAMS', desc: 'Register group study circles to split classroom booking fees and mentor reviews.' }
            ].map((deal, i) => (
              <div key={i} className="card bg-base-100 p-8 border border-base-300/80 shadow-md rounded-2xl flex flex-col justify-between items-center text-center relative overflow-hidden group">
                <div className="absolute top-4 left-4 bg-primary text-primary-content text-[10px] font-black uppercase px-2.5 py-1 rounded-full">{deal.discount}</div>
                <div className="space-y-4 pt-4">
                  <h3 className="font-extrabold text-sm text-base-content/40 tracking-wider uppercase">{deal.label}</h3>
                  <p className="text-xs sm:text-sm text-base-content/75 font-semibold leading-relaxed">{deal.desc}</p>
                </div>
                <Link href={lpUrl('/register')} className="btn btn-primary btn-sm rounded-xl font-bold mt-6 text-white px-6">
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
