'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { useState, Suspense } from 'react';
import { CreditCard, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import Footer from '@/components/Footer';

function CheckoutPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch the course being purchased
  const { data: course, isLoading } = useQuery({
    queryKey: ['courseForCheckout', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data } = await api.get(`/courses/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      // Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Execute real backend enrollment (backend handles the mock charge)
      const { data } = await api.post('/enrollments', { courseId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
      if (course) {
        router.push(`/${locale}/courses/${course.slug || course.id}/lessons`);
      } else {
        router.push(`/${locale}/profile`);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Payment processing failed. Please try again.');
    }
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    setErrorMsg(null);
    enrollMutation.mutate();
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

  if (!courseId || !course) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow flex-col">
          <AlertCircle className="w-16 h-16 text-error mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-base-content mb-4">Invalid Checkout Session</h1>
          <button onClick={() => router.back()} className="btn-premium px-6 py-2 rounded-xl">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-base-content mb-2">Secure Checkout</h1>
          <p className="text-base-content/60 font-medium">Complete your purchase to unlock the full curriculum.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3">
            <div className="card-premium p-8 rounded-3xl border border-base-300">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-base-300">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-base-content">Payment Details</h2>
              </div>

              {errorMsg && (
                <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">Name on Card</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="0000 0000 0000 0000"
                      className="input-premium w-full pl-10 tracking-widest font-mono"
                    />
                    <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">Expiry Date</label>
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value.slice(0, 5))}
                      placeholder="MM/YY"
                      className="input-premium w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">CVC</label>
                    <input
                      type="text"
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className="input-premium w-full font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="btn-premium w-full py-4 rounded-xl font-bold mt-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex justify-center items-center gap-2"
                >
                  {enrollMutation.isPending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Pay ${course.price} securely
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-6 rounded-3xl border border-base-300">
              <h3 className="font-bold text-base-content mb-4 pb-4 border-b border-base-300">Order Summary</h3>
              
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-base-300 flex-shrink-0 overflow-hidden relative">
                  {course.thumbnail && (
                    <img src={course.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base-content text-sm leading-tight mb-1">{course.title}</h4>
                  <p className="text-xs text-base-content/60 font-medium">By {course.instructor?.username}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-base-300 font-medium text-base-content/80">
                <div className="flex justify-between">
                  <span>Original Price</span>
                  <span>${course.price}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Discounts</span>
                  <span>-$0.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-base-content">Total</span>
                <span className="text-2xl font-extrabold text-base-content">${course.price}</span>
              </div>
            </div>

            <div className="bg-base-100 rounded-3xl p-6 border border-base-300 shadow-sm flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-base-content text-sm mb-1">256-bit Secure Encryption</h4>
                <p className="text-xs text-base-content/60 font-medium leading-relaxed">
                  Your payment information is heavily encrypted and securely processed. We do not store your full card details on our servers.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    }>
      <CheckoutPage />
    </Suspense>
  );
}
