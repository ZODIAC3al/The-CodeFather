'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { BookOpen, Users, Star, Award, MapPin, ExternalLink } from 'lucide-react';
import { useLocale } from 'next-intl';
import Footer from '@/components/Footer';

export default function InstructorProfile() {
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();

  // Fetch Instructor Profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['instructor', id],
    queryFn: async () => {
      const { data } = await api.get('/courses', {
        params: { instructorId: id }
      });
      
      const publishedCourses = data.data || [];
      
      return {
        id,
        username: publishedCourses[0]?.instructor?.username || 'Mentor',
        bio: publishedCourses[0]?.instructor?.bio || 'An expert educator committed to teaching local community learners.',
        courses: publishedCourses
      };
    },
  });

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

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow flex-col">
          <h1 className="text-3xl font-bold text-base-content mb-4">Mentor not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-base-100 border-b border-base-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-[2rem] bg-primary/20 flex items-center justify-center text-primary text-5xl font-extrabold uppercase shadow-inner border border-primary/20">
              {profile.username[0]}
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="badge badge-primary font-bold text-xs uppercase tracking-wider">Verified Mentor</span>
                <span className="flex items-center gap-1 text-xs font-bold text-base-content/60"><MapPin className="w-3 h-3" /> Local Circle</span>
              </div>
              <h1 className="text-4xl font-extrabold text-base-content mb-3">{profile.username}</h1>
              <p className="text-base-content/70 font-medium max-w-xl text-lg leading-relaxed">{profile.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-16 py-6 text-sm font-bold text-base-content/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
              <div>
                <div className="text-lg font-extrabold text-base-content">{profile.courses.length}</div>
                <div className="text-xs text-base-content/50 uppercase tracking-wider">Courses</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><Users className="w-5 h-5 text-secondary" /></div>
              <div>
                <div className="text-lg font-extrabold text-base-content">142</div>
                <div className="text-xs text-base-content/50 uppercase tracking-wider">Students</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Star className="w-5 h-5 text-accent" /></div>
              <div>
                <div className="text-lg font-extrabold text-base-content">4.9/5</div>
                <div className="text-xs text-base-content/50 uppercase tracking-wider">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h2 className="text-2xl font-bold text-base-content mb-8 flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" /> Published Courses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {profile.courses.length > 0 ? (
            profile.courses.map((course: any) => (
              <div key={course.id || course._id} className="card-premium h-full flex flex-col group overflow-hidden border border-base-300">
                {course.thumbnail ? (
                  <figure className="h-48 w-full relative overflow-hidden bg-base-300">
                    <img src={course.thumbnail} alt={course.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </figure>
                ) : (
                  <div className="h-48 w-full bg-base-300 flex items-center justify-center group-hover:bg-base-300/80 transition-colors">
                    <BookOpen className="w-12 h-12 text-base-content/20" />
                  </div>
                )}
                
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex gap-2 mb-3">
                    <span className="badge badge-primary badge-outline badge-sm font-bold uppercase tracking-wider">
                      {course.category?.name || 'Tech'}
                    </span>
                  </div>
                  
                  <Link href={`/${locale}/courses/${course.slug || course.id || course._id}`} className="hover:text-primary transition-colors">
                    <h3 className="text-xl font-bold text-base-content mb-2 line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                  </Link>
                  
                  <p className="text-base-content/60 text-sm mb-6 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-base-300">
                    <div className="font-extrabold text-lg text-base-content">
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </div>
                    <Link href={`/${locale}/courses/${course.slug || course.id || course._id}`} className="btn btn-sm btn-ghost text-primary">
                      Enroll <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-base-content/50 font-medium card-premium border border-base-300">
              No courses published by this mentor yet.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
