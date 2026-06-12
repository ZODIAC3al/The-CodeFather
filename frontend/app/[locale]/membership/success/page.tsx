'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useLocale } from 'next-intl';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Suspense, useEffect } from 'react';

function MembershipSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  
  const planId = searchParams.get('plan_id');
  const sessionId = searchParams.get('session_id');
  const paypalReturn = searchParams.get('paypal_return');

  const { data: plan, isLoading: isPlanLoading } = useQuery({
    queryKey: ['membershipPlan', planId],
    queryFn: async () => {
      if (!planId) return null;
      const { data } = await api.get(`/memberships/plans/${planId}`);
      return data;
    },
    enabled: !!planId,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
    queryClient.invalidateQueries({ queryKey: ['myMembership'] });
  }, [queryClient]);

  useEffect(() => {
    if (paypalReturn || sessionId) {
      queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
    }
  }, [paypalReturn, sessionId, queryClient]);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 w-full flex-grow flex flex-col justify-center">
        <div className="card-premium p-8 sm:p-12 rounded-3xl border border-base-300 shadow-xl text-center bg-base-100/80 backdrop-blur-md">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-success/10 rounded-full blur-3xl -z-10" />

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center text-success">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-base-content mb-3 tracking-tight">
            Subscription Activated!
          </h1>
<p className="text-base-content/70 max-w-md mx-auto mb-8 font-medium">
             Your membership has been successfully activated. You now have access to all premium features.
           </p>

           {plan && !isPlanLoading && (
             <div className="p-6 bg-base-200/50 rounded-2xl border border-base-300/50 max-w-lg mx-auto mb-8 text-left space-y-4">
               <div className="flex gap-4">
                 <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                   <ShieldCheck className="w-8 h-8 text-primary" />
                 </div>
                 <div>
                   <span className="text-xs font-bold text-primary tracking-wider uppercase">Subscription Plan</span>
                   <h4 className="font-bold text-base-content text-sm leading-tight mt-0.5">{plan.name}</h4>
                   <span className="text-xs text-base-content/50 font-medium">${Number(plan.price || 0).toFixed(2)}/{plan.interval === 'month' ? 'month' : 'year'}</span>
                 </div>
               </div>

               <div className="pt-4 border-t border-base-300/50 text-xs font-semibold text-base-content/60 space-y-2">
                 <div className="flex justify-between">
                   <span>Status</span>
                   <span className="badge badge-success text-[10px] font-black uppercase tracking-wider text-success-content px-2 py-1">ACTIVE</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Order ID</span>
                   <span className="font-mono text-base-content font-bold">{sessionId?.slice(0, 18) || 'paypal_order'}...</span>
                 </div>
               </div>
             </div>
           )}

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => router.push(`/${locale}/courses`)}
              className="btn btn-primary flex-grow py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40"
            >
              <ArrowRight className="w-4 h-4" /> Browse Courses
            </button>
            <button
              onClick={() => router.push(`/${locale}/profile`)}
              className="btn btn-outline border-base-300/80 hover:bg-base-200 text-base-content font-bold px-6 py-4 rounded-xl"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MembershipSuccessWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    }>
      <MembershipSuccessPage />
    </Suspense>
  );
}