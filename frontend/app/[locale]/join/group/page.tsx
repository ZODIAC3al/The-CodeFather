"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { ShieldCheck, Users, CheckCircle2 } from "lucide-react";
import { useLocale } from "next-intl";
import { Suspense, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

function GroupJoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const token = searchParams.get("token");

  const { data: groupData, isLoading } = useQuery({
    queryKey: ["groupDetails", token],
    queryFn: async () => {
      if (!token) return null;
      const { data } = await api.get(`/payments/group/${token}`);
      return data;
    },
    enabled: !!token,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/payments/group/${token}/join`);
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.alreadyEnrolled) return;
      if (data?.enrolled && groupData?.courseId) {
        const courseId = typeof groupData.courseId === 'object' ? groupData.courseId._id : groupData.courseId;
        router.push(`/${locale}/courses/${courseId}/lessons/${groupData.courseId?.lessons?.[0]?._id || groupData.courseId?.lessons?.[0]?.id || ''}`);
      }
    },
  });

  const handleJoin = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?callbackUrl=/join/group?token=${token}`);
      return;
    }
    joinMutation.mutate();
  };

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

  if (!groupData) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <div className="text-center">
            <ShieldCheck className="w-16 h-16 text-error mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-base-content mb-2">Group Not Found</h1>
            <p className="text-base-content/60">The group enrollment link may be invalid or expired.</p>
          </div>
        </div>
      </div>
    );
  }

  const courseTitle = typeof groupData.courseId === "object" ? groupData.courseId?.title : "Course";

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 w-full flex-grow flex flex-col justify-center animate-fade-in">
        <div className="card-premium p-8 sm:p-12 rounded-3xl border border-base-300 shadow-xl text-center relative overflow-hidden bg-base-100/80 backdrop-blur-md">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary">
              <Users className="w-8 h-8" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content mb-3 tracking-tight">
            Join Team Training
          </h1>
          <p className="text-base-content/70 max-w-md mx-auto mb-6 font-medium">
            You've been invited to join a group enrollment for: <strong>{courseTitle}</strong>
          </p>

<div className="p-4 bg-base-200/50 rounded-2xl border border-base-300/50 max-w-lg mx-auto mb-6 text-left">
             <div className="text-xs font-semibold text-base-content/60 space-y-2">
               <div className="flex justify-between">
                 <span>Enrollment Type:</span>
                 <span className="font-bold text-base-content">Team Access</span>
               </div>
               <div className="flex justify-between">
                 <span>Unit Price:</span>
                 <span className="font-bold text-base-content">${Number(groupData.amount || 0).toFixed(2)}</span>
               </div>
             </div>
           </div>

          <button
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="btn-premium py-4 px-8 rounded-xl font-bold flex justify-center items-center gap-2"
          >
            {joinMutation.isPending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Join Team
              </>
            )}
          </button>

          {joinMutation.isSuccess && joinMutation.data?.enrolled && (
            <div className="mt-4 text-success font-medium text-sm">
              Successfully enrolled! Redirecting to course...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function GroupJoinPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    }>
      <GroupJoinPage />
    </Suspense>
  );
}