import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/*/admin/', '/instructor/', '/*/instructor/', '/profile/', '/*/profile/'],
    },
    sitemap: 'http://localhost:3000/sitemap.xml',
  };
}
