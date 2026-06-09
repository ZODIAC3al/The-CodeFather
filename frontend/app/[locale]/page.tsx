'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { 
  ArrowRight, 
  Play, 
  Star, 
  BookOpen, 
  Users, 
  Calendar, 
  CheckCircle2, 
  MessageSquare, 
  Layers, 
  Tv, 
  FileText, 
  Layout, 
  UserCheck, 
  Clock, 
  Heart,
  ChevronRight
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const locale = useLocale();
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [activeCategory, setActiveCategory] = useState('All');

  const lp = (path: string) => `/${locale}${path}`;

  // Fetch recommended/latest courses for the course listing section
  const { data: courses } = useQuery<any[]>({
    queryKey: ['recommendedCourses'],
    queryFn: async () => {
      const { data } = await api.get('/courses/recommended');
      return data || [];
    }
  });

  // Unique categories for filtering with labels
  const categories = [
    { id: 'All', label: tCommon('all') },
    { id: 'Development', label: locale === 'ar' ? 'تطوير' : 'Development' },
    { id: 'Design', label: locale === 'ar' ? 'تصميم' : 'Design' },
    { id: 'Marketing', label: locale === 'ar' ? 'تسويق' : 'Marketing' },
  ];

  const filteredCourses = courses?.filter(course => {
    if (activeCategory === 'All') return true;
    const catName = course.category?.name || '';
    return catName.toLowerCase().includes(activeCategory.toLowerCase());
  }) || [];

  return (
    <div className="min-h-screen bg-base-100 font-sans text-base-content">
      {/* Navbar with download button hidden */}
      <Navbar hideDownload={true} />

      {/* ── 1. HERO SECTION ── */}
      <section className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#E2F0EF]/45 via-base-100 to-base-100 rounded-b-[4rem]">
        {/* Background curved shape */}
        <div className="absolute top-0 right-0 w-[50%] h-[80%] bg-[#E2F0EF]/40 rounded-bl-[15rem] -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Text Content */}
          <div className="flex-1 space-y-6 text-center lg:text-start">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E2A38] dark:text-white tracking-tight leading-[1.15]">
              {locale === 'ar' ? (
                <>
                  {t('heroTitle')}{' '}
                  <span className="text-primary">{t('heroHighlight')}</span>
                </>
              ) : (
                <>
                  <span className="text-primary">Studying</span> Online is now <br className="hidden sm:block" />
                  much easier
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg text-base-content/70 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              {t('heroSubtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href={isAuthenticated ? lp('/courses') : lp('/register')}
                className="btn btn-primary btn-md rounded-full px-8 font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/45 w-full sm:w-auto"
              >
                {t('heroCta')}
              </Link>
              <Link
                href={lp('/courses')}
                className="flex items-center gap-3 font-extrabold text-[#1E2A38] dark:text-white hover:text-primary transition-colors py-2"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-base-200 shadow-md flex items-center justify-center text-primary">
                  <Play className="w-4 h-4 fill-primary text-primary" />
                </div>
                <span>{t('heroSecondary')}</span>
              </Link>
            </div>
          </div>

          {/* Right Visual Image & Badges */}
          <div className="flex-1 relative w-full max-w-md lg:max-w-none flex justify-center">
            <div className="relative">
              <div className="w-72 sm:w-96 aspect-[4/5] rounded-[3rem] overflow-hidden border-8 border-white dark:border-base-300 shadow-2xl bg-base-300 relative">
                <Image 
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80" 
                  alt="Student learning"
                  fill
                  priority
                  sizes="(max-w-640px) 288px, 384px"
                  className="object-cover" 
                />
              </div>

              {/* Floating Badge 1: Online Courses */}
              <div className="absolute -left-12 top-[20%] bg-white/95 dark:bg-base-100 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-base-200/50 flex items-center gap-3 animate-bounce" style={{ animationDuration: '6s' }}>
                <div className="w-10 h-10 bg-info/20 text-info rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">{tCommon('filter')}</div>
                  <div className="text-xs font-extrabold text-base-content">{t('coursesCount')}</div>
                </div>
              </div>

              {/* Floating Badge 2: Congratulations */}
              <div className="absolute -right-8 bottom-[25%] bg-white/95 dark:bg-base-100 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-base-200/50 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-success/20 text-success rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-success uppercase tracking-widest">{t('badgeCongratulations')}</div>
                  <div className="text-xs font-extrabold text-base-content">{t('badgeAdmission')}</div>
                </div>
              </div>

              {/* Floating Badge 3: Message / Assistant */}
              <div className="absolute left-4 -bottom-6 bg-white/95 dark:bg-base-100 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-base-200/50 flex items-center gap-3">
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img src="https://i.pravatar.cc/100?img=33" alt="Mentor" />
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-base-content/40 uppercase">{t('badgeInstructor')}</div>
                  <div className="text-[11px] font-extrabold text-base-content">{t('badgeQuery')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SUCCESS METRICS SECTION ── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold text-[#1E2A38] dark:text-white">{t('successTitle')}</h2>
          <p className="text-sm text-base-content/60 max-w-md mx-auto font-medium">
            {t('successSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {[
            { value: '15K+', label: t('statStudents') },
            { value: '75%', label: t('statSuccessRate') },
            { value: '35', label: t('statClassrooms') },
            { value: '26', label: t('statAssistants') },
            { value: '16+', label: t('statExperience') },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-4xl md:text-5xl font-extrabold text-primary">{stat.value}</div>
              <div className="text-xs sm:text-sm text-base-content/70 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. CLOUD SOFTWARE CARD GRID ── */}
      <section className="py-16 bg-base-200/40 border-y border-base-300/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#1E2A38] dark:text-white">{t('cloudTitle')}</h2>
            <p className="text-sm text-base-content/60 font-medium">
              {t('cloudSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-6 h-6 text-primary" />,
                title: t('billingTitle'),
                desc: t('billingDesc')
              },
              {
                icon: <Layout className="w-6 h-6 text-[#29B2FE]" />,
                title: t('schedulingTitle'),
                desc: t('schedulingDesc')
              },
              {
                icon: <Users className="w-6 h-6 text-[#33D190]" />,
                title: t('peopleTitle'),
                desc: t('peopleDesc')
              }
            ].map((card, i) => (
              <div key={i} className="card bg-base-100 hover:shadow-2xl transition-all duration-300 border border-base-300/60 p-8 text-center rounded-2xl">
                <div className="w-14 h-14 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  {card.icon}
                </div>
                <h3 className="text-lg font-extrabold text-[#1E2A38] dark:text-white mb-3 leading-snug">{card.title}</h3>
                <p className="text-sm text-base-content/70 font-medium leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. WHAT IS CODEFATHER? SECTION ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1E2A38] dark:text-white">{t('whatIsCodefather')}</h2>
          <p className="text-sm text-base-content/70 font-medium">
            {t('codefatherDesc')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1: Instructors */}
          <div className="relative rounded-[2rem] overflow-hidden aspect-[16/10] group shadow-xl border border-base-300/55">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80" 
              alt="Instructors" 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/45 flex flex-col justify-center items-center text-center p-6 space-y-3 transition-opacity">
              <h3 className="text-2xl font-black text-white">{t('forInstructors')}</h3>
              <p className="text-xs text-white/80 max-w-xs font-semibold">
                {t('instructorsDesc')}
              </p>
              <Link 
                href={lp('/instructor/dashboard')} 
                className="btn btn-outline btn-white rounded-full font-extrabold px-6"
              >
                {t('accessPortal')}
              </Link>
            </div>
          </div>

          {/* Card 2: Students */}
          <div className="relative rounded-[2rem] overflow-hidden aspect-[16/10] group shadow-xl border border-base-300/55">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80" 
              alt="Students" 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-[#3DBDB3]/75 flex flex-col justify-center items-center text-center p-6 space-y-3 transition-opacity">
              <h3 className="text-2xl font-black text-white">{t('forStudents')}</h3>
              <p className="text-xs text-white/95 max-w-xs font-semibold">
                {t('studentsDesc')}
              </p>
              <Link 
                href={lp('/courses')} 
                className="btn bg-white text-primary border-none hover:bg-neutral hover:text-white rounded-full font-extrabold px-6"
              >
                {t('browseCourses')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PHYSICAL VS VIRTUAL FEATURES ── */}
      <section className="py-20 bg-base-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E2A38] dark:text-white leading-tight">
              {locale === 'ar' ? (
                <>
                  {t('physicalVirtualTitle')}
                </>
              ) : (
                <>
                  Everything you can do in a physical classroom, <span className="text-primary">you can do with us</span>
                </>
              )}
            </h2>
            <p className="text-sm sm:text-base text-base-content/70 leading-relaxed font-medium">
              {t('physicalVirtualDesc')}
            </p>
            <div className="pt-2">
              <Link href={lp('/roadmap')} className="text-primary font-bold hover:underline inline-flex items-center gap-2">
                {t('exploreRoadmap')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] overflow-hidden shadow-2xl aspect-[16/10] border border-base-300 relative">
            <Image 
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80" 
              alt="Interactive learning"
              fill
              sizes="(max-w-1024px) 100vw, 50vw"
              className="object-cover" 
            />
          </div>
        </div>
      </section>

      {/* ── 6. DYNAMIC CHOICE COURSES SECTION ── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-[#1E2A38] dark:text-white">{t('choiceCourses')}</h2>
            <p className="text-sm text-base-content/60 font-semibold">{t('choiceCoursesDesc')}</p>
          </div>

          {/* Tab Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all border ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-primary-content border-primary shadow-md' 
                    : 'bg-base-100 hover:bg-base-200 border-base-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Listing Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredCourses.map((course) => (
              <div key={course.id} className="card bg-base-100 border border-base-300 hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-base-300">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base-content/30 font-extrabold text-sm uppercase">
                      No Image
                    </div>
                  )}
                  <span className="absolute top-3 right-3 badge badge-primary text-[10px] font-bold uppercase py-2">
                    {course.category?.name || 'Code'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-base-content line-clamp-1 leading-snug">{course.title}</h3>
                    <p className="text-xs text-base-content/60 font-medium line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Instructor & Stats */}
                    <div className="flex items-center justify-between text-xs font-bold text-base-content/50 border-t border-base-300/50 pt-3">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        {course.enrollmentCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                        4.9
                      </span>
                    </div>

                    {/* Price & Action Button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-md font-black text-base-content">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </div>
                      <Link
                        href={lp(`/courses/${course.slug || course.id}`)}
                        className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1"
                      >
                        Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-base-content/50 font-bold border border-dashed border-base-300 rounded-3xl">
            {t('noCoursesFound')}
          </div>
        )}
      </section>

      {/* ── 7. TESTIMONIALS SECTION ── */}
      <section className="py-24 bg-[#E2F0EF]/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Testimonial slider visual */}
          <div className="relative flex justify-center">
            <div className="relative">
              <div className="w-72 sm:w-80 aspect-[4/5] rounded-[3rem] overflow-hidden border-8 border-white dark:border-base-300 shadow-xl bg-base-300 relative">
                <Image 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80" 
                  alt="Student reviewer"
                  fill
                  sizes="(max-w-640px) 288px, 320px"
                  className="object-cover" 
                />
              </div>

              {/* Review floating panel */}
              <div className="absolute left-[10%] -bottom-6 right-[10%] bg-white dark:bg-base-100 p-5 rounded-2xl shadow-xl border border-base-200/50 space-y-2 text-center">
                <p className="text-xs text-base-content/85 font-semibold leading-relaxed">
                  {t('gloriaQuote')}
                </p>
                <div className="text-xs font-extrabold text-primary">{t('gloriaName')}</div>
                <div className="text-[10px] font-bold text-base-content/50">{t('gloriaTitle')}</div>
              </div>
            </div>
          </div>

          {/* Testimonial Text & Info */}
          <div className="space-y-6 text-center lg:text-start pt-6 lg:pt-0">
            <div className="inline-block h-1 w-16 bg-primary mx-auto lg:mx-0"></div>
            <h2 className="text-3xl font-extrabold text-[#1E2A38] dark:text-white leading-snug">{t('testimonialsTitle')}</h2>
            <p className="text-base-content/70 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
              {t('testimonialsDesc')}
            </p>
            <div className="pt-2">
              <Link 
                href={lp('/courses')} 
                className="btn btn-outline btn-primary rounded-full px-8 font-bold"
              >
                {t('exploreStories')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer component */}
      <Footer />
    </div>
  );
}
