import { notFound } from 'next/navigation';
import CourseDetailClient from './CourseDetailClient';

export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://the-code-father-iota.vercel.app';
    const res = await fetch(`${baseUrl}/courses`);
    if (!res.ok) return [];
    const data = await res.json();
    const courses = data.data || [];
    return courses.flatMap((course: any) =>
      ['en', 'ar'].map((locale) => ({ locale, slug: course.slug }))
    );
  } catch {
    return [];
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${slug}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) notFound();
  const course = await res.json();
  return <CourseDetailClient course={course} locale={locale} />;
}