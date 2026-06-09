'use client';

import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Search, Compass, BookOpen, Users, ArrowLeft, ArrowRight,
  ChevronDown, X, Clock, LayoutList, Star, Award, Sparkles
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Footer from '@/components/Footer';

const WHY_FEATURES = [
  { icon: '🕐', titleKey: 'whyFeature1Title', descKey: 'whyFeature1Desc', color: 'text-primary' },
  { icon: '🏆', titleKey: 'whyFeature2Title', descKey: 'whyFeature2Desc', color: 'text-secondary' },
  { icon: '📋', titleKey: 'whyFeature3Title', descKey: 'whyFeature3Desc', color: 'text-accent' },
  { icon: '🌐', titleKey: 'whyFeature4Title', descKey: 'whyFeature4Desc', color: 'text-primary' },
];

/* ─── Star rating component ─────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.floor(rating) ? 'fill-accent text-accent' : 'text-base-300'}`}
        />
      ))}
    </div>
  );
}

/* ─── Main page content ─────────────────────────────────────────── */
function CoursesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('courses');
  const th = useTranslations('home');
  const isRTL = locale === 'ar';

  // Search parameters state mapping
  const searchParamQuery = searchParams.get('search') || '';
  const categoryParamQuery = searchParams.get('category') || '';
  const minPriceParamQuery = searchParams.get('minPrice') || '';
  const maxPriceParamQuery = searchParams.get('maxPrice') || '';
  const pageParamQuery = searchParams.get('page') || '1';

  const [searchText, setSearchText] = useState(searchParamQuery);
  const [selectedCategory, setSelectedCategory] = useState(categoryParamQuery);
  const [minPrice, setMinPrice] = useState(minPriceParamQuery);
  const [maxPrice, setMaxPrice] = useState(maxPriceParamQuery);
  const [page, setPage] = useState(Number(pageParamQuery));

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);

  // Sync inputs with URL parameter updates
  useEffect(() => {
    setSearchText(searchParamQuery);
    setSelectedCategory(categoryParamQuery);
    setMinPrice(minPriceParamQuery);
    setMaxPrice(maxPriceParamQuery);
    setPage(Number(pageParamQuery));
  }, [searchParamQuery, categoryParamQuery, minPriceParamQuery, maxPriceParamQuery, pageParamQuery]);

  // Query categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/courses/categories');
      return data;
    },
  });

  // Query filtered courses
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', selectedCategory, minPrice, maxPrice, searchParamQuery, page],
    queryFn: async () => {
      const params: any = { page };
      if (selectedCategory) params.category = selectedCategory;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (searchParamQuery) params.search = searchParamQuery;

      const { data } = await api.get('/courses', { params });
      return data;
    },
  });

  const applyFilters = (newParams: any) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.keys(newParams).forEach((key) => {
      const val = newParams[key];
      if (val !== undefined && val !== null && val !== '') {
        nextParams.set(key, val);
      } else {
        nextParams.delete(key);
      }
    });

    router.push(`/${locale}/courses?${nextParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search: searchText, page: '1' });
  };

  const handleCategorySelect = (categoryName: string) => {
    const nextVal = selectedCategory === categoryName ? '' : categoryName;
    applyFilters({ category: nextVal, page: '1' });
  };

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    router.push(`/${locale}/courses`);
  };

  // Mock list of creators/instructors
  const creators = [
    { name: 'John Anderson', role: 'UX/UI Designer', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80' },
    { name: 'Austin Cole', role: 'Web Developer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { name: 'Tamara Reed', role: 'Art Director', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-16 pb-16">

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-base-200 py-16 md:py-24">
        {/* Decorative blobs */}
        <div className="absolute top-8 start-8 w-36 h-36 bg-accent/90 rounded-[60%_40%_70%_30%/50%_60%_40%_50%] flex items-center justify-center p-4 shadow-lg z-10">
          <p className="text-[10px] font-black text-white text-center leading-snug">
            {th('heroJoinBlob')}
          </p>
        </div>
        {/* Green squiggle decoration */}
        <svg className="absolute bottom-4 start-24 w-20 opacity-60 hidden md:block" viewBox="0 0 80 20" fill="none">
          <path d="M0 10 Q10 0 20 10 Q30 20 40 10 Q50 0 60 10 Q70 20 80 10" stroke="#22c55e" strokeWidth="2.5" fill="none" />
        </svg>
        {/* Red blob top-right area */}
        <div className="absolute top-12 end-1/3 w-12 h-12 bg-red-400/80 rounded-full hidden lg:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: text */}
            <div className="space-y-7 text-center lg:text-start relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-base-content leading-[1.1] tracking-tight">
                {th('heroTitle')} <br />
                <span className="relative inline-block text-primary">
                  {th('heroHighlight')}
                  {/* Underline squiggle */}
                  <svg className="absolute -bottom-2 start-0 w-full" viewBox="0 0 200 10" preserveAspectRatio="none">
                    <path d="M0 6 Q50 0 100 6 Q150 12 200 6" stroke="#f97316" strokeWidth="3" fill="none" />
                  </svg>
                </span>
              </h1>

              <p className="text-sm text-base-content/55 leading-relaxed max-w-md mx-auto lg:mx-0">
                {th('heroSubtitle')}
              </p>

              {/* CTA row */}
              <div className="flex items-center gap-3 justify-center lg:justify-start flex-wrap">
                <div className="flex items-center bg-base-100 border border-base-300 rounded-full p-1.5 shadow-sm gap-3">
                  <span className="text-xs font-semibold px-2 text-base-content/60">{th('heroDaysTrial')}</span>
                  <Link
                    href={`/${locale}/register`}
                    className="btn btn-primary btn-sm rounded-full font-bold px-4"
                  >
                    {th('heroGetStarted')}
                  </Link>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {[
                  { val: '12k+', label: th('statStudents') },
                  { val: '9+', label: th('statExperience') },
                  { val: '356+', label: th('statAssistants') },
                  { val: '50+', label: th('statClassrooms'), highlight: true },
                ].map((s, i) => (
                  <div key={i} className={`text-center lg:text-start rounded-2xl p-3 ${s.highlight ? 'bg-secondary text-white rounded-[40%_60%_50%_60%/60%_40%_60%_40%]' : ''}`}>
                    <div className={`text-2xl font-black ${s.highlight ? 'text-white' : 'text-base-content'}`}>
                      {s.highlight ? (
                        <span>
                          <span className="text-3xl">20%</span>
                          <span className="block text-xs font-bold uppercase tracking-widest mt-0.5">OFF</span>
                          <span className="block text-[9px] opacity-80 font-semibold">Only For the First Time</span>
                        </span>
                      ) : s.val}
                    </div>
                    {!s.highlight && <div className="text-[11px] text-base-content/50 font-semibold mt-0.5">{s.label}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: hero image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96">
                {/* Purple circle behind image */}
                <div className="absolute inset-4 rounded-full bg-primary/20 border-4 border-primary/30" />
                <img
                  src="https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=500&q=80"
                  alt="Student"
                  className="relative z-10 w-full h-full object-cover rounded-full border-4 border-white shadow-2xl"
                />
                {/* Small floating student avatar bottom-left */}
                <div className="absolute -bottom-4 -start-4 w-20 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg z-20 bg-base-100">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80"
                    alt="Student 2"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHY ONLINE LEARNING — left text + right 4-grid features
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-8 relative overflow-hidden">
        {/* Red blob decoration */}
        <div className="absolute top-1/2 -start-8 w-16 h-20 bg-red-400/70 rounded-full -translate-y-1/2 hidden md:block" />
        {/* Green squiggle right */}
        <svg className="absolute top-8 end-8 w-16 opacity-50 hidden md:block" viewBox="0 0 60 60">
          <path d="M30 5 C 40 15, 20 25, 30 35 C 40 45, 20 55, 30 60" stroke="#22c55e" strokeWidth="2.5" fill="none" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-5">
              <h2 className="text-3xl md:text-4xl font-black text-base-content leading-tight">
                {th('whyTitle')}
              </h2>
              <p className="text-sm text-base-content/55 leading-relaxed max-w-md">
                {th('whyDesc')}
              </p>
              <p className="text-sm text-base-content/55 leading-relaxed max-w-md">
                {th('whyDesc2')}
              </p>
              <Link href={`/${locale}/courses`} className="btn btn-primary rounded-full font-bold px-8">
                {th('learnMore')}
              </Link>
            </div>

            {/* Right: 4 feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHY_FEATURES.map((f, i) => (
                <div key={i} className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
                  <div className={`text-2xl mb-3`}>{f.icon}</div>
                  <h4 className={`text-sm font-black mb-1.5 ${f.color}`}>
                    {t(f.titleKey as any)}
                  </h4>
                  <p className="text-[11px] text-base-content/50 leading-relaxed">
                    {t(f.descKey as any)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          COURSES SEARCH AND GRID
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Search & Filter Header */}
        <div className="bg-base-100 border border-base-300 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-base-content tracking-tight">
              {t('allCoursesTitle')}
            </h2>

            {/* Combined Search bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center w-full max-w-xl bg-base-200 rounded-2xl sm:rounded-full border border-base-300/60 p-1.5 gap-2 sm:gap-0 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all"
            >
              {/* Category Selector */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setIsPriceDropdownOpen(false);
                  }}
                  className="btn btn-ghost hover:bg-base-300/50 rounded-xl sm:rounded-full btn-sm h-10 w-full sm:w-auto px-4 text-xs font-black text-base-content/80 flex items-center justify-between sm:justify-start gap-1.5 border-none"
                >
                  <span>{selectedCategory || t('allCategories')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-base-content/40 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                    <ul className="absolute top-full start-0 mt-2 z-30 menu p-1.5 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-full sm:w-56 text-start animate-in fade-in slide-in-from-top-2 duration-150">
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            handleCategorySelect('');
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`rounded-xl font-bold text-xs py-2 px-3 justify-between ${!selectedCategory ? 'bg-primary text-primary-content' : 'text-base-content/75 hover:bg-base-200'}`}
                        >
                          {t('allSubjects')}
                        </button>
                      </li>
                      {categories?.map((cat: any) => {
                        const isSelected = selectedCategory === cat.name;
                        return (
                          <li key={cat.id || cat._id}>
                            <button
                              type="button"
                              onClick={() => {
                                handleCategorySelect(cat.name);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`rounded-xl font-bold text-xs py-2 px-3 mt-1 ${isSelected ? 'bg-primary text-primary-content' : 'text-base-content/75 hover:bg-base-200'}`}
                            >
                              {cat.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>

              {/* Divider line */}
              <div className="hidden sm:block w-[1px] h-6 bg-base-300 mx-1 shrink-0"></div>

              {/* Search input */}
              <div className="flex items-center flex-1 min-w-0 px-2 gap-2 h-10 bg-base-300/30 sm:bg-transparent rounded-xl sm:rounded-none">
                <Search className="w-4 h-4 text-base-content/40 shrink-0" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-transparent border-none outline-none focus:outline-none w-full text-xs sm:text-sm font-semibold text-base-content placeholder:text-base-content/40"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-circle btn-sm w-8 h-8 shrink-0 flex items-center justify-center text-primary-content shadow-md shadow-primary/20 sm:hidden"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="submit"
                className="hidden sm:flex btn btn-primary btn-circle btn-sm w-9 h-9 shrink-0 items-center justify-center text-primary-content shadow-md shadow-primary/20"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Price Range and static filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-base-200/50">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsPriceDropdownOpen(!isPriceDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                }}
                className={`btn btn-sm rounded-full font-bold text-xs ${minPrice || maxPrice ? 'btn-primary text-primary-content' : 'btn-outline bg-base-100 border-base-300'}`}
              >
                <span>{t('priceRange')} {(minPrice || maxPrice) ? `($${minPrice || '0'} - $${maxPrice || '∞'})` : ''}</span>
                <ChevronDown className="w-3.5 h-3.5 text-current/60" />
              </button>

              {isPriceDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsPriceDropdownOpen(false)}></div>
                  <div className="absolute top-full start-0 mt-2 z-30 p-4 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-64 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-start">
                    <p className="text-[10px] font-black text-base-content/50 uppercase tracking-widest">{t('priceRange')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-base-content/40 uppercase">{t('minPrice')}</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="input input-bordered input-sm rounded-xl font-semibold w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-base-content/40 uppercase">{t('maxPrice')}</label>
                        <input
                          type="number"
                          placeholder="1000"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="input input-bordered input-sm rounded-xl font-semibold w-full text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                          applyFilters({ minPrice: '', maxPrice: '', page: '1' });
                          setIsPriceDropdownOpen(false);
                        }}
                        className="btn btn-ghost btn-xs rounded-md font-bold"
                      >
                        {t('clearFiltersBtn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          applyFilters({ minPrice, maxPrice, page: '1' });
                          setIsPriceDropdownOpen(false);
                        }}
                        className="btn btn-primary btn-xs rounded-md font-bold text-primary-content"
                      >
                        {t('apply')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="btn btn-sm btn-ghost hover:bg-base-200/50 rounded-full border border-base-300 text-xs font-bold text-base-content/75">{t('ratings')}</div>
            <div className="btn btn-sm btn-ghost hover:bg-base-200/50 rounded-full border border-base-300 text-xs font-bold text-base-content/75">{t('program')}</div>
            <div className="btn btn-sm btn-ghost hover:bg-base-200/50 rounded-full border border-base-300 text-xs font-bold text-base-content/75">{t('language')}</div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between border-b border-base-300/60 pb-3">
          <h3 className="text-xs sm:text-sm font-black text-base-content/60 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary animate-pulse" />
            <span>{t('searchResults')}</span>
          </h3>
          {(selectedCategory || searchParamQuery || minPrice || maxPrice) && (
            <button
              onClick={clearAllFilters}
              className="btn btn-xs btn-error btn-outline rounded-lg font-bold flex items-center gap-1"
            >
              <X className="w-3 h-3" /> {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Grid or Empty */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 border border-base-300 rounded-3xl p-4 space-y-4 shadow-sm animate-pulse">
                <div className="skeleton aspect-video w-full rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded-md"></div>
                  <div className="skeleton h-3 w-5/6 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !coursesData?.data || coursesData.data.length === 0 ? (
          <div className="bg-base-100 text-center py-16 px-6 rounded-3xl border border-base-300 shadow-sm max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mx-auto text-base-content/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-base-content">{t('noCoursesFound')}</h3>
              <p className="text-base-content/50 text-xs mt-1 leading-relaxed">{t('noCoursesDesc')}</p>
            </div>
            <button onClick={clearAllFilters} className="btn btn-primary btn-sm rounded-xl font-bold">{t('clearFiltersBtn')}</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesData.data.map((course: any) => {
                const discountPrice = course.discountPrice;
                const originalPrice = course.price;
                const hasDiscount = discountPrice != null && discountPrice < originalPrice;

                return (
                  <Link
                    key={course.id || course._id}
                    href={`/${locale}/courses/${course.slug}`}
                    className="group bg-base-100 rounded-2xl overflow-hidden border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-base-200">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                          <BookOpen className="w-10 h-10 opacity-30" />
                        </div>
                      )}
                      {/* Category Badge */}
                      {course.category?.name && (
                        <span className="absolute top-3 end-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-content">
                          {course.category.name}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col gap-2 flex-grow">
                      {/* Instructor */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-base-300 overflow-hidden relative shrink-0">
                          {course.instructor?.avatar ? (
                            <img src={course.instructor.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-[8px] font-bold uppercase">{course.instructor?.username?.[0] || 'M'}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-base-content/50">{course.instructor?.username || 'Mentor'}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-black text-base-content leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-[11px] text-base-content/50 font-medium mt-auto pt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {course.duration || '8 Hours'}
                        </span>
                        <span className="flex items-center gap-1">
                          <LayoutList className="w-3.5 h-3.5" />
                          {course.lectures || 20} {t('lecturesLabel')}
                        </span>
                      </div>

                      {/* Price + rating */}
                      <div className="flex items-center justify-between pt-3 border-t border-base-200 mt-2">
                        <div className="flex items-center gap-1.5">
                          {hasDiscount ? (
                            <>
                              <span className="text-xs text-base-content/40 line-through">${originalPrice}</span>
                              <span className="font-black text-sm text-primary">${discountPrice}</span>
                            </>
                          ) : (
                            <span className="font-black text-sm text-primary">
                              {originalPrice === 0 ? (
                                <span className="badge badge-success badge-sm font-bold text-[10px] py-2 text-success-content">{t('free')}</span>
                              ) : (
                                `$${originalPrice}.00`
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Stars rating={course.rating || 4.5} />
                          <span className="text-[10px] text-base-content/50 font-bold">({course.reviews || 10})</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {coursesData.totalPages > 1 && (
              <div className="join flex justify-center pt-8">
                <button
                  disabled={page === 1}
                  onClick={() => applyFilters({ page: String(page - 1) })}
                  className="join-item btn btn-outline btn-sm rounded-l-xl font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button className="join-item btn btn-sm btn-outline no-animation pointer-events-none text-xs font-bold">
                  {t('pageOf', { page, totalPages: coursesData.totalPages })}
                </button>
                <button
                  disabled={page === coursesData.totalPages}
                  onClick={() => applyFilters({ page: String(page + 1) })}
                  className="join-item btn btn-outline btn-sm rounded-r-xl font-bold"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CLOUD COLLEGE PROMO
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card bg-primary/5 text-base-content border border-primary/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
          <div className="relative z-10 space-y-1 text-center md:text-start">
            <h3 className="font-black text-lg flex items-center justify-center md:justify-start gap-1.5">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>{t('promoTitle')}</span>
            </h3>
            <p className="text-xs font-semibold text-base-content/60 leading-relaxed max-w-xl">{t('promoDesc')}</p>
          </div>
          <Link href={`/${locale}/membership`} className="btn btn-primary rounded-xl font-bold z-10 shrink-0">
            {t('startLearning')}
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CREATORS / INSTRUCTORS
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h3 className="font-black text-xs sm:text-sm text-base-content/75 uppercase tracking-widest flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-primary" />
          <span>{t('creatorsTitle')}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {creators.map((c, i) => (
            <div
              key={i}
              className="card-premium group text-center p-6 flex flex-col items-center justify-center space-y-4 hover:border-primary/30"
            >
              <div className="avatar">
                <div className="w-16 h-16 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300">
                  <img src={c.avatar} alt={c.name} loading="lazy" className="object-cover" />
                </div>
              </div>
              <div>
                <h4 className="font-black text-base-content text-sm leading-tight group-hover:text-primary transition-colors">{c.name}</h4>
                <div className="badge badge-sm badge-ghost font-bold text-[10px] tracking-wider uppercase mt-1">{c.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROMOTION OFFERS
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h3 className="font-black text-xs sm:text-sm text-base-content/75 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
          <span>{t('offersTitle')}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          <div className="card bg-neutral text-neutral-content shadow-sm rounded-3xl border border-neutral-content/10 relative overflow-hidden group">
            <div className="card-body p-6">
              <div className="badge badge-warning text-[9px] font-black tracking-wider uppercase absolute top-4 right-4 py-2">50% OFF</div>
              <h4 className="card-title text-sm font-black pt-2">Web Development Pass</h4>
              <p className="text-xs opacity-70 leading-relaxed">Save big on monthly study circle premium subscription fees.</p>
            </div>
          </div>

          <div className="card bg-primary text-primary-content shadow-sm rounded-3xl border border-primary-content/10 relative overflow-hidden group">
            <div className="card-body p-6">
              <div className="badge badge-neutral text-[9px] font-black tracking-wider uppercase absolute top-4 right-4 py-2">10% OFF</div>
              <h4 className="card-title text-sm font-black pt-2">Annual Pass Discount</h4>
              <p className="text-xs opacity-80 leading-relaxed">Attending physical meetups and earning certifications.</p>
            </div>
          </div>

          <div className="card bg-secondary text-secondary-content shadow-sm rounded-3xl border border-secondary-content/10 relative overflow-hidden group">
            <div className="card-body p-6">
              <div className="badge badge-warning text-[9px] font-black tracking-wider uppercase absolute top-4 right-4 py-2">50% OFF</div>
              <h4 className="card-title text-sm font-black pt-2">Music Production course</h4>
              <p className="text-xs opacity-75 leading-relaxed">Get access to professional local studio workshop slots.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-base-100 py-16 rounded-3xl border border-base-200">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-2xl md:text-3xl font-black text-base-content">
            {th('testimonialsTitle')}
          </h2>
          <p className="text-sm text-base-content/55 leading-relaxed">
            {th('testimonialsDesc')}
          </p>

          <div className="relative px-8 pt-4">
            <div className="space-y-4">
              <img src="https://i.pravatar.cc/80?img=47" alt="Jessica" className="w-16 h-16 rounded-full border-4 border-primary/20 shadow-md mx-auto object-cover" />
              <div>
                <div className="font-black text-base-content">Jessica Andra</div>
                <div className="text-xs text-base-content/50 font-semibold">Student</div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-8">
          <div className="skeleton h-12 w-full max-w-sm mx-auto mb-6 rounded-full"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 border border-base-300 rounded-3xl p-4 space-y-4">
                <div className="skeleton aspect-video w-full rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded-md"></div>
                  <div className="skeleton h-3 w-1/2 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <CoursesContent />
      </Suspense>
      <Footer />
    </div>
  );
}
