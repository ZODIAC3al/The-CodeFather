'use client';

import Navbar from '@/components/Navbar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Eye, User, ArrowLeft, ArrowRight, BookOpenCheck, Tag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Footer from '@/components/Footer';

export default function Blog() {
  const locale = useLocale();
  const t = useTranslations('blog');
  const [page, setPage] = useState(1);

  const { data: blogData, isLoading } = useQuery({
    queryKey: ['blogPosts', page],
    queryFn: async () => {
      const { data } = await api.get('/blog', { params: { page, limit: 6 } });
      return data;
    },
  });

  // Separate recent posts (left rail) from featured article (right)
  const posts: any[] = blogData?.data ?? [];
  const recentPosts = posts.slice(0, 6);
  const featuredPost = posts[0] ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">

        {/* Page header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="badge badge-primary badge-outline text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-block mb-3">
            {t('tagline')}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight leading-tight">
            {t('title')}
          </h1>
          <p className="text-base-content/60 text-sm mt-2 font-medium leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-base-100 h-24 rounded-2xl border border-base-300" />
              ))}
            </div>
            <div className="lg:col-span-8">
              <div className="animate-pulse bg-base-100 h-[600px] rounded-3xl border border-base-300" />
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-base-100 text-center py-20 px-4 rounded-3xl border border-base-300 max-w-md mx-auto">
            <BookOpenCheck className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-base-content mb-2">{t('noArticles')}</h3>
            <p className="text-base-content/60 text-sm">{t('noArticlesDesc')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

              {/* ── LEFT RAIL: Recent Blog Posts ── */}
              <aside className="lg:col-span-4">
                <div className="lg:sticky lg:top-24">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-base-content/50 mb-5 px-1">
                    {t('recentTitle')}
                  </h2>
                  <div className="space-y-3">
                    {recentPosts.map((post: any, idx: number) => (
                      <Link
                        key={post.id || post._id}
                        href={`/${locale}/blog/${post.slug}`}
                        className={`group flex gap-3 p-3 rounded-2xl border transition-all duration-200 hover:bg-base-100 hover:shadow-sm ${idx === 0
                          ? 'bg-base-100 border-primary/30 shadow-sm'
                          : 'bg-base-100/50 border-base-300'
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-base-300">
                          {post.thumbnail ? (
                            <img
                              src={post.thumbnail}
                              alt={post.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-base-content/20" />
                            </div>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-base-content line-clamp-2 leading-snug mb-1.5 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {post.tags?.slice(0, 2).map((tag: string, idx: number) => (
                              <span key={idx} className="badge badge-sm badge-ghost text-[10px] font-bold">
                                {tag}
                              </span>
                            ))}
                            <span className="text-[10px] text-base-content/40 font-medium ml-auto flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views || 0} {t('views')}
                            </span>
                          </div>
                          <p className="text-[10px] text-base-content/50 font-medium mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale) : t('draft')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination inside the left rail */}
                  {blogData?.total > 6 && (
                    <div className="flex items-center justify-between mt-6 px-1">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="p-2.5 rounded-full border border-base-300 bg-base-100 hover:bg-base-200 disabled:opacity-40 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-base-content" />
                      </button>
                      <span className="text-xs font-bold text-base-content/60">
                        {t('pageOf', { page, totalPages: Math.ceil(blogData.total / 6) })}
                      </span>
                      <button
                        disabled={page * 6 >= blogData.total}
                        onClick={() => setPage(page + 1)}
                        className="p-2.5 rounded-full border border-base-300 bg-base-100 hover:bg-base-200 disabled:opacity-40 transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-base-content" />
                      </button>
                    </div>
                  )}
                </div>
              </aside>

              {/* ── RIGHT RAIL: Featured Article ── */}
              <article className="lg:col-span-8">
                {featuredPost && (
                  <div className="bg-base-100 rounded-3xl border border-base-300 overflow-hidden shadow-sm">

                    {/* Hero image */}
                    {featuredPost.thumbnail ? (
                      <figure className="h-64 md:h-80 w-full overflow-hidden">
                        <img
                          src={featuredPost.thumbnail}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover"
                        />
                      </figure>
                    ) : (
                      <div className="h-64 md:h-80 w-full bg-base-300 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-base-content/20" />
                      </div>
                    )}

                    <div className="p-8">
                      {/* Tags */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {featuredPost.tags?.map((tag: string, idx: number) => (
                          <span key={idx} className="badge badge-primary badge-sm font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-extrabold text-base-content leading-tight mb-4">
                        {featuredPost.title}
                      </h2>

                      {/* Meta row */}
                      <div className="flex items-center gap-5 text-xs text-base-content/50 font-semibold mb-6 pb-6 border-b border-base-300">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {featuredPost.author?.username || (locale === 'ar' ? 'مسؤول' : 'Admin')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {featuredPost.publishedAt
                            ? new Date(featuredPost.publishedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
                            : t('draft')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          {featuredPost.views || 0} {t('views')}
                        </span>
                      </div>

                      {/* Article body — prose */}
                      <div
                        className="prose prose-sm max-w-none text-base-content/80 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: featuredPost.content || `<p>${featuredPost.content?.replace(/<[^>]*>?/gm, '').substring(0, 800) ?? ''}...</p>`,
                        }}
                      />

                      <Link
                        href={`/${locale}/blog/${featuredPost.slug}`}
                        className="btn btn-primary mt-8 rounded-xl font-bold"
                      >
                        {t('readFull')}
                      </Link>
                    </div>

                    {/* Newsletter footer inside article card */}
                    <div className="mx-8 mb-8 p-6 bg-base-200 rounded-2xl">
                      <h4 className="text-base font-extrabold text-base-content mb-1">{t('newsletterTitle')}</h4>
                      <p className="text-xs text-base-content/60 font-medium mb-4">
                        {t('newsletterDesc')}
                      </p>
                      <div className="join w-full">
                        <input
                          type="email"
                          placeholder={t('emailPlaceholder')}
                          className="input input-bordered join-item flex-1 rounded-l-xl text-sm focus:input-primary"
                        />
                        <button className="btn btn-primary join-item rounded-r-xl font-bold text-sm px-5">
                          {t('subscribe')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}