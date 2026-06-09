'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { BookOpen, Calendar, Eye, User, ArrowLeft, Tag, BookOpenCheck } from 'lucide-react';

export default function BlogPostPage() {
  const locale = useLocale();
  const t = useTranslations('blog');
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const lp = (path: string) => `/${locale}${path}`;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blogPost', slug],
    queryFn: async () => {
      const { data } = await api.get(`/blog/${slug}`);
      return data;
    },
    enabled: !!slug,
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.thumbnail || "http://localhost:3000/icons/icon-192x192.png",
    "datePublished": post.publishedAt || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author?.username || "Admin"
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Codefather",
      "logo": {
        "@type": "ImageObject",
        "url": "http://localhost:3000/icons/icon-192x192.png"
      }
    },
    "description": post.body?.replace(/<[^>]*>?/gm, '').substring(0, 160) || post.title
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full flex flex-col gap-6">
        
        {/* Back navigation */}
        <Link 
          href={lp('/blog')} 
          className="btn btn-ghost btn-sm rounded-xl gap-2 font-bold w-fit text-base-content/60 hover:text-base-content transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> 
          <span>{t('backToBlog')}</span>
        </Link>

        {isLoading ? (
          <div className="space-y-6">
            <div className="animate-pulse bg-base-100 h-10 w-2/3 rounded-xl border border-base-300" />
            <div className="animate-pulse bg-base-100 h-6 w-1/3 rounded-xl border border-base-300" />
            <div className="animate-pulse bg-base-100 h-80 w-full rounded-3xl border border-base-300" />
            <div className="space-y-3">
              <div className="animate-pulse bg-base-100 h-4 w-full rounded-lg border border-base-300" />
              <div className="animate-pulse bg-base-100 h-4 w-5/6 rounded-lg border border-base-300" />
              <div className="animate-pulse bg-base-100 h-4 w-4/5 rounded-lg border border-base-300" />
            </div>
          </div>
        ) : error || !post ? (
          <div className="bg-base-100 text-center py-20 px-4 rounded-3xl border border-base-300 max-w-md mx-auto w-full">
            <BookOpenCheck className="w-16 h-16 text-error/35 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-base-content mb-2">
              {t('articleNotFound')}
            </h3>
            <p className="text-base-content/60 text-sm mb-6">
              {t('articleNotFoundDesc')}
            </p>
            <Link href={lp('/blog')} className="btn btn-primary rounded-xl font-bold">
              {t('browseOther')}
            </Link>
          </div>
        ) : (
          <article className="flex flex-col gap-6">
            
            {/* Header / Meta */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-black text-base-content tracking-tight leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-5 text-xs text-base-content/50 font-bold border-b border-base-300/40 pb-6">
                {post.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    {t('by')}: {post.author.username}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {post.publishedAt 
                    ? new Date(post.publishedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
                    : t('draft')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  {post.views || 0} {t('views')}
                </span>
              </div>
            </div>

            {/* Thumbnail banner */}
            {post.thumbnail ? (
              <figure className="relative aspect-[21/9] w-full overflow-hidden rounded-[2rem] border border-base-300 shadow-sm bg-base-300">
                <img 
                  src={post.thumbnail} 
                  alt={post.title} 
                  className="w-full h-full object-cover" 
                />
              </figure>
            ) : (
              <div className="aspect-[21/9] w-full bg-base-300 rounded-[2rem] flex items-center justify-center border border-base-300 text-base-content/25">
                <BookOpen className="w-16 h-16" />
              </div>
            )}

            {/* Main Article Body */}
            <div 
              className="prose prose-md max-w-none text-base-content/85 leading-relaxed font-sans py-4"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-6 border-t border-base-300/40">
                {post.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="badge badge-primary font-bold text-xs flex items-center gap-1 px-3 py-2.5 rounded-xl">
                    <Tag className="w-3.5 h-3.5" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Profile card */}
            {post.author && (
              <div className="card bg-base-100 border border-base-300 p-6 rounded-[2rem] shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5 mt-8">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-base-200 border border-base-300 shrink-0 shadow-sm">
                  {post.author.avatar ? (
                    <img src={post.author.avatar} alt={post.author.username} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-extrabold text-2xl uppercase">
                      {post.author.username?.[0]}
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-start space-y-1.5">
                  <h4 className="font-extrabold text-base-content">
                    {t('author')}: {post.author.username}
                  </h4>
                  <p className="text-xs text-base-content/60 font-medium leading-relaxed max-w-2xl">
                    {post.author.bio || t('defaultBio')}
                  </p>
                </div>
              </div>
            )}

          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
