"use client";

import { Menu, MessageSquare, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import InstructorSidebar from "@/components/InstructorSidebar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function InstructorReviewsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tInstructor = useTranslations("instructor");

  if (!authLoading && (!isAuthenticated || user?.role !== "INSTRUCTOR")) {
    router.push(`/${locale}/login`);
  }

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["instructorReviews"],
    queryFn: async () => {
      const { data } = await api.get("/instructor/reviews");
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === "INSTRUCTOR"),
  });

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (
          reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) /
          totalReviews
        ).toFixed(1)
      : null;

  if (authLoading || reviewsLoading) {
    return (
      <div
        className="flex flex-col min-h-screen bg-base-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans transition-all duration-300"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Navbar />

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-base-100 border-b border-base-300">
        <button
          onClick={() => setSidebarOpen(true)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold text-base-content">
          {tInstructor("reviews")}
        </span>
      </div>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <InstructorSidebar
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                {tInstructor("reviews")}
              </h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">
                {isRTL
                  ? "تحليل التقييمات وآراء الطلاب في الدورات"
                  : "Analyze ratings and course critiques from students"}
              </p>
            </div>

            {/* Average Rating badge */}
            {avgRating && (
              <div className="flex items-center gap-2 bg-base-100 px-4 py-2 rounded-2xl border border-base-300 shadow-sm">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-black text-base-content">
                  {avgRating} / 5
                </span>
                <span className="text-[10px] text-base-content/40 font-bold">
                  ({totalReviews} {isRTL ? "تقييم" : "reviews"})
                </span>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-black text-base-content mb-6">
              {isRTL ? "آخر التقييمات" : "Recent Critiques"}
            </h2>

            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((r: any) => (
                  <div
                    key={r.id}
                    className="pb-6 border-b border-base-300 last:border-none last:pb-0 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold uppercase shrink-0 overflow-hidden">
                      {r.user?.avatar ? (
                        <img
                          src={r.user.avatar}
                          alt={r.user.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        r.user?.username?.[0] || "U"
                      )}
                    </div>
                    <div className="flex-grow space-y-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 flex-wrap">
                        <div>
                          <span className="font-extrabold text-sm text-base-content">
                            {r.user?.username ||
                              (isRTL ? "طالب" : "Student User")}
                          </span>
                          <span className="text-[10px] font-bold text-base-content/40 ms-2">
                            {isRTL ? "في" : "on"}{" "}
                            {r.course?.title || (isRTL ? "دورة" : "Course")}
                          </span>
                        </div>
                        <span className="text-[10px] text-base-content/40 font-semibold">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString(
                                isRTL ? "ar-EG" : undefined,
                              )
                            : "—"}
                        </span>
                      </div>
                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-warning text-warning" : "text-base-content/20"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-base-content/75 font-semibold leading-relaxed pt-1.5">
                        {r.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">
                  {isRTL
                    ? "لا توجد تقييمات مسجلة بعد."
                    : "No reviews registered yet."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
