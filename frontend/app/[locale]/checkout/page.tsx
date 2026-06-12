"use client";

import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function CheckoutPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const planId = searchParams.get("planId");
  const preselectedAccessType = searchParams.get("accessType") as "SINGLE" | "GROUP" | null;
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [quantity, setQuantity] = useState(preselectedAccessType === "GROUP" ? 5 : 1);

  const accessType = planId ? "SUBSCRIPTION" : (preselectedAccessType === "GROUP" ? "GROUP" : (quantity >= 5 ? "GROUP" : "SINGLE"));
  const t = useTranslations("checkout");

// Fetch the item being purchased
  const { data: item, isLoading } = useQuery({
    queryKey: ['itemForCheckout', courseId || planId],
    queryFn: async () => {
      if (courseId) {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);
        const endpoint = isObjectId ? `/courses/by-id/${courseId}` : `/courses/${courseId}`;
        const { data } = await api.get(endpoint);
        return { ...data, type: 'course' };
      } else if (planId) {
        const { data } = await api.get(`/memberships/plans/${planId}`);
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
       payload.accessType = accessType;
       payload.quantity = quantity;
       const endpoint = planId
         ? "/payments/checkout-subscription"
         : "/payments/checkout";
       const { data } = await api.post(endpoint, payload);
       return data;
     },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg("Invalid checkout session URL returned.");
      }
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.message ||
          "Payment session creation failed. Please try again.",
      );
    },
  });

  // PayPal checkout mutation
const paypalMutation = useMutation({
     mutationFn: async () => {
       const { data } = await api.post("/payments/paypal/create-order", {
         courseId: accessType !== "SUBSCRIPTION" ? courseId : undefined,
         planId: accessType === "SUBSCRIPTION" ? planId : undefined,
         accessType,
         quantity,
       });
       return data;
     },
    onSuccess: async (data) => {
      const approveLink = data.links?.find((l: any) => l.rel === "approve");
      if (approveLink) {
        window.location.href = approveLink.href;
      }
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.message ||
          "PayPal order creation failed. Please try again.",
      );
    },
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    setErrorMsg(null);

    if (paymentMethod === "paypal") {
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
          <h1 className="text-2xl font-bold text-base-content mb-4">
            {t('invalidSession')}
          </h1>
          <button
            onClick={() => router.back()}
            className="btn btn-primary rounded-xl font-bold"
          >
            {t('goBack')}
          </button>
        </div>
      </div>
    );
  }

  const itemName =
    item?.type === "plan"
      ? (locale === 'ar' && item.name === 'Monthly Pass'
        ? 'الاشتراك الشهري'
        : locale === 'ar' && item.name === 'Annual Pass'
          ? 'الاشتراك السنوي'
          : `${item.name} Subscription`)
      : item?.title;
  const unitPrice = Number(item?.type === "plan" ? item.price : (item?.discountPrice ?? item?.price ?? 0));
  const totalPrice = unitPrice * quantity;

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-base-content mb-2">
            {t('title')}
          </h1>
          <p className="text-base-content/60 font-medium">
            {item?.type === "plan"
              ? (locale === 'ar' ? 'أكمل عملية الشراء لفتح ميزات الاشتراك.' : 'Complete your purchase to unlock subscription benefits.')
              : accessType === "GROUP"
                ? (locale === 'ar' ? 'أكمل عملية الشراء لفتح وصول تدريب الفريق.' : 'Complete your purchase to unlock team training access.')
                : t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="card-premium p-8 rounded-3xl border border-base-300 bg-base-100/80 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-base-300">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-base-content">
                  {t('paymentDetails')}
                </h2>
              </div>

              {/* Payment Method Tabs */}
              <div className="join join-horizontal mb-6 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`join-item btn btn-sm font-bold ${paymentMethod === "card" ? "btn-primary text-primary-content" : "btn-ghost"}`}
                >
                  {locale === 'ar' ? 'بطاقة الائتمان' : 'Credit Card'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`join-item btn btn-sm font-bold ${paymentMethod === "paypal" ? "btn-primary text-primary-content" : "btn-ghost"}`}
                >
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
                {item?.type === "course" && (
                  <div>
                    <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">
                      {locale === 'ar' ? 'عدد الطلاب' : 'Number of Students'}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-premium w-24 font-mono"
                      />
                      <span className="text-sm text-base-content/60">
                        {quantity >= 5 && (
                          <span className="text-success font-medium">
                            {locale === 'ar' ? 'تم تطبيق خصم الفريق!' : 'Team discount applied!'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">
                        {t('nameOnCard')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('nameOnCardPlaceholder')}
                        className="input-premium w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">
                        {t('cardNumber')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) =>
                            setCardNumber(
                              e.target.value.replace(/\D/g, "").slice(0, 16),
                            )
                          }
                          placeholder={t('cardNumberPlaceholder')}
                          className="input-premium w-full pl-10 tracking-widest font-mono"
                        />
                        <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">
                          {t('expiryDate')}
                        </label>
                        <input
                          type="text"
                          required
                          value={expiry}
                          onChange={(e) =>
                            setExpiry(e.target.value.slice(0, 5))
                          }
                          placeholder={t('expiryPlaceholder')}
                          className="input-premium w-full font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">
                          {t('cvc')}
                        </label>
                        <input
                          type="text"
                          required
                          value={cvc}
                          onChange={(e) =>
                            setCvc(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          placeholder={t('cvcPlaceholder')}
                          className="input-premium w-full font-mono"
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === "paypal" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#003087] rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-10 h-10"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M7.5 4.5H19.5V19.5C19.5 20.3284 18.8284 21 18 21H6C5.17157 21 4.5 20.3284 4.5 19.5V4.5H7.5V4.5Z"
                          fill="white"
                        />
                        <path
                          d="M12 7.5C9.23858 7.5 7.5 9.23858 7.5 12C7.5 14.7614 9.23858 16.5 12 16.5C14.7614 16.5 16.5 14.7614 16.5 12C16.5 9.23858 14.7614 7.5 12 7.5Z"
                          fill="#003087"
                        />
                      </svg>
                    </div>
                    <p className="text-base-content/70 font-medium">
                      {locale === 'ar' ? 'انقر فوق زر الدفع لإكمال عملية الشراء عبر PayPal' : 'Click the payment button to complete your purchase via PayPal'}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    stripeMutation.isPending || paypalMutation.isPending
                  }
                  className="btn-premium w-full py-4 rounded-xl font-bold mt-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex justify-center items-center gap-2"
                >
                  {stripeMutation.isPending || paypalMutation.isPending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> {t('paySecurely', { amount: (totalPrice || 0).toFixed(2) })}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-6 rounded-3xl border border-base-300 shadow-sm">
              <h3 className="font-bold text-base-content mb-4 pb-4 border-b border-base-300">
                {t('orderSummary')}
              </h3>

              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-base-300 flex-shrink-0 overflow-hidden relative">
                  {item?.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item?.type === "plan" && (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base-content text-sm leading-tight mb-1">
                    {itemName}
                  </h4>
                  <p className="text-xs text-base-content/60 font-medium">
                    {item?.type === "plan"
                      ? (locale === 'ar' ? `اشتراك ${item.interval === 'year' ? 'سنوي' : 'شهري'}` : `${item.interval}ly subscription`)
                      : `${locale === 'ar' ? 'بواسطة' : 'By'} ${item?.instructor?.username}`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-base-300 font-medium text-base-content/80">
                <div className="flex justify-between">
                  <span>{item?.type === "course" ? (locale === 'ar' ? 'سعر الوحدة' : 'Unit Price') : (locale === 'ar' ? 'السعر' : 'Price')}</span>
                  <span>${unitPrice}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between">
                    <span>{locale === 'ar' ? 'الكمية' : 'Quantity'}</span>
                    <span>{quantity}</span>
                  </div>
                )}
                <div className="flex justify-between text-success">
                  <span>{t('discounts')}</span>
                  <span>-$0.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-base-content">{t('total')}</span>
                <span className="text-2xl font-extrabold text-base-content">
                  ${totalPrice}
                </span>
              </div>
              {accessType === "GROUP" && (
                <p className="text-xs text-success text-center mt-2">
                  {locale === 'ar' ? 'تسجيل المجموعة: شارك رابط الشراء لإضافة أعضاء الفريق بعد الدفع' : 'Group enrollment: Share your purchase link to add team members after checkout'}
                </p>
              )}
            </div>

            <div className="bg-base-100 rounded-3xl p-6 border border-base-300 shadow-sm flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold text-base-content text-sm mb-1">
                  {t('encryptionTitle')}
                </h4>
                <p className="text-xs text-base-content/60 font-medium leading-relaxed">
                  {t('encryptionDesc')}
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
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-base-200">
          <Navbar />
          <div className="flex justify-center items-center flex-grow">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      }
    >
      <CheckoutPage />
    </Suspense>
  );
}
