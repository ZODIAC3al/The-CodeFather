'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { useState, Suspense } from 'react';
import { CreditCard, ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocale } from 'next-intl';

function CheckoutPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const planId = searchParams.get('planId');
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  const accessType = planId ? 'SUBSCRIPTION' : 'SINGLE';
  const t = useLocale();

  // Fetch the item being purchased
  const { data: item, isLoading } = useQuery({
    queryKey: ['itemForCheckout', courseId || planId],
    queryFn: async () => {
      if (courseId) {
        const { data } = await api.get(`/courses/${courseId}`);
        return { ...data, type: 'course' };
      } else if (planId) {
        const { data } = await api.get(`/membership/plans/${planId}`);
        return { ...data, type: 'plan' };
      }
      return null;
    },
    enabled: !!(courseId || planId),
  });

  // Stripe checkout mutation
  const stripeMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (courseId) payload.courseId = courseId;
      if (planId) payload.planId = planId;
      const endpoint = planId ? '/payments/checkout-subscription' : '/payments/checkout';
      const { data } = await api.post(endpoint, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myEnrollments'] });
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg('Invalid checkout session URL returned.');
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Payment session creation failed. Please try again.');
    }
  });

  // PayPal checkout mutation
  const paypalMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payments/paypal/create-order', {
        courseId: accessType === 'SINGLE' ? courseId : undefined,
        planId: accessType === 'SUBSCRIPTION' ? planId : undefined,
        accessType,
      });
      return data;
    },
    onSuccess: async (data) => {
      const approveLink = data.links?.find((l: any) => l.rel === 'approve');
      if (approveLink) {
        window.location.href = approveLink.href;
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'PayPal order creation failed. Please try again.');
    }
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    setErrorMsg(null);
    
    if (paymentMethod === 'paypal') {
      paypalMutation.mutate();
    } else {
      stripeMutation.mutate();
    }
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

  if (!courseId && !planId) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow flex-col">
          <AlertCircle className="w-16 h-16 text-error mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-base-content mb-4">Invalid Checkout Session</h1>
          <button onClick={() => router.back()} className="btn btn-primary rounded-xl font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  const itemName = item?.type === 'plan' ? `${item.name} Subscription` : item?.title;
  const price = item?.type === 'plan' ? item.price : item?.price || item?.discountPrice;

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-base-content mb-2">Secure Checkout</h1>
          <p className="text-base-content/60 font-medium">Complete your purchase to unlock {item?.type === 'plan' ? 'subscription benefits' : 'the full curriculum'}.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3">
            <div className="card-premium p-8 rounded-3xl border border-base-300 bg-base-100/80 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-base-300">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-base-content">Payment Method</h2>
              </div>

              {/* Payment Method Tabs */}
              <div className="join join-horizontal mb-6 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`join-item btn btn-sm font-bold ${paymentMethod === 'card' ? 'btn-primary text-primary-content' : 'btn-ghost'}`}
                >
                  Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`join-item btn btn-sm font-bold ${paymentMethod === 'paypal' ? 'btn-primary text-primary-content' : 'btn-ghost'}`}
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none">
                    <path d="M7.5 4.5H19.5V19.5C19.5 20.3284 18.8284 21 18 21H6C5.17157 21 4.5 20.3284 4.5 19.5V4.5H7.5V4.5Z" fill="currentColor"/>
                  </svg>
                  PayPal
                </button>
              </div>

              {errorMsg && (
                <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold mb-6 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-6">
                {paymentMethod === 'card' && (
                  <>
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
                  </>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#003087] rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                        <path d="M7.5 4.5H19.5V19.5C19.5 20.3284 18.8284 21 18 21H6C5.17157 21 4.5 20.3284 4.5 19.5V4.5H7.5V4.5Z" fill="white"/>
                        <path d="M12 7.5C9.23858 7.5 7.5 9.23858 7.5 12C7.5 14.7614 9.23858 16.5 12 16.5C14.7614 16.5 16.5 14.7614 16.5 12C16.5 9.23858 14.7614 7.5 12 7.5Z" fill="#003087"/>
                      </svg>
                    </div>
                    <p className="text-base-content/70 font-medium">Click "Pay Now" to complete your purchase via PayPal</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={stripeMutation.isPending || paypalMutation.isPending}
                  className="btn-premium w-full py-4 rounded-xl font-bold mt-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex justify-center items-center gap-2"
                >
                  {(stripeMutation.isPending || paypalMutation.isPending) ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Pay ${price} securely
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-6 rounded-3xl border border-base-300 shadow-sm">
              <h3 className="font-bold text-base-content mb-4 pb-4 border-b border-base-300">Order Summary</h3>
              
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-base-300 flex-shrink-0 overflow-hidden relative">
                  {item?.thumbnail && (
                    <img src={item.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                  )}
                  {item?.type === 'plan' && (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base-content text-sm leading-tight mb-1">{itemName}</h4>
                  <p className="text-xs text-base-content/60 font-medium">
                    {item?.type === 'plan' ? `${item.interval}ly subscription` : `By ${item?.instructor?.username}`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-base-300 font-medium text-base-content/80">
                <div className="flex justify-between">
                  <span>Original Price</span>
                  <span>${price}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Discounts</span>
                  <span>-$0.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-base-content">Total</span>
                <span className="text-2xl font-extrabold text-base-content">${price}</span>
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