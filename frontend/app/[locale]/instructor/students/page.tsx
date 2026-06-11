"use client";

import { GraduationCap, Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import InstructorSidebar from "@/components/InstructorSidebar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function InstructorStudentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tInstructor = useTranslations("instructor");
  const tAdmin = useTranslations("admin");

  if (!authLoading && (!isAuthenticated || user?.role !== "INSTRUCTOR")) {
    router.push(`/${locale}/login`);
  }

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["instructorStudents"],
    queryFn: async () => {
      const { data } = await api.get("/instructor/students");
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === "INSTRUCTOR"),
  });

  if (authLoading || studentsLoading) {
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
          {tInstructor("students")}
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
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              {tInstructor("students")}
            </h1>
            <p className="text-xs text-base-content/50 font-medium mt-0.5">
              {isRTL
                ? "تتبع الطلاب المسجلين في دوراتك"
                : "Track students enrolled in your courses"}
            </p>
          </div>

          {/* Students list */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-4 border-b border-base-300">
              <h2 className="text-sm font-black text-base-content">
                {isRTL
                  ? `المتعلمون النشطون (${students.length})`
                  : `Active Learners (${students.length})`}
              </h2>
            </div>

            {students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-base-200/50 text-[10px] uppercase tracking-wider text-base-content/40 font-black">
                      <th className="py-3 px-4 sm:px-5">
                        {tAdmin("dashboardPage.user")}
                      </th>
                      <th className="py-3 px-4 sm:px-5">{tAdmin("courses")}</th>
                      <th className="py-3 px-4 sm:px-5">
                        {isRTL ? "تاريخ التسجيل" : "Enrolled Date"}
                      </th>
                      <th className="py-3 px-4 sm:px-5">
                        {isRTL ? "التقدم" : "Progress"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-300">
                    {students.map((entry: any) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-base-200/30 transition-colors"
                      >
                        <td className="py-4 px-4 sm:px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary-content/5 overflow-hidden">
                              {entry.student?.avatar ? (
                                <img
                                  src={entry.student.avatar}
                                  alt=""
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                entry.student?.username?.[0]?.toUpperCase() ||
                                "S"
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-base-content text-sm">
                                {entry.student?.username ||
                                  (isRTL ? "طالب" : "Student")}
                              </p>
                              <p className="text-[10px] text-base-content/40 font-semibold">
                                {entry.student?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-5 font-bold text-base-content/85 text-xs truncate max-w-[160px]">
                          {entry.course?.title ||
                            (isRTL ? "دورة غير معروفة" : "Unknown Course")}
                        </td>
                        <td className="py-4 px-4 sm:px-5 text-base-content/50 text-xs font-semibold">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString(
                                isRTL ? "ar-EG" : undefined,
                              )
                            : "—"}
                        </td>
                        <td className="py-4 px-4 sm:px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 sm:w-24 bg-base-200 rounded-full h-2 overflow-hidden border border-base-300 shrink-0">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${entry.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-extrabold text-base-content">
                              {entry.progress || 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <GraduationCap className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                <p className="text-sm text-base-content/40 font-medium">
                  {isRTL
                    ? "لا يوجد طلاب مسجلون في دوراتك بعد."
                    : "No students enrolled in your courses yet."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
