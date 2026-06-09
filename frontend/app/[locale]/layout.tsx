import { notFound } from 'next/navigation';
import { Nunito, DM_Sans, Noto_Kufi_Arabic } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { getMessages, getTranslations } from 'next-intl/server';
import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import '../globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800', '900'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const notoKufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  weight: ['400', '600', '700', '800', '900'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    applicationName: 'The Codefather',
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: `${SITE_URL}/${locale}`,
      siteName: 'The Codefather',
      images: [
        {
          url: `${SITE_URL}/icons/icon-192x192.png`,
          width: 192,
          height: 192,
        },
      ],
      locale: locale === 'ar' ? 'ar_EG' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [`${SITE_URL}/icons/icon-192x192.png`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const isRtl = locale === 'ar';

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Codefather",
    "url": `${SITE_URL}/${locale}`,
    "logo": `${SITE_URL}/icons/icon-192x192.png`,
    "sameAs": [
      "https://github.com",
      "https://twitter.com"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "The Codefather",
    "url": `${SITE_URL}/${locale}`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/${locale}/courses?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${nunito.variable} ${dmSans.variable} ${notoKufi.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="The Codefather" />
        <meta name="apple-mobile-web-app-title" content="The Codefather" />
        <meta name="theme-color" content="#8B0000" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Providers locale={locale} messages={messages as Record<string, unknown>}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
