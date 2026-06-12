"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Users, ArrowRight, ShieldCheck, BookOpen, Award, Smartphone, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

function PurchasePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("purchaseConfirmation");
  const { isAuthenticated } = useAuth();
  const courseId = searchParams.get("courseId");
  const purchaseType = searchParams.get("type") || "individual";
  const [quantity, setQuantity] = useState(purchaseType === "group" ? 5 : 1);

  const { data: course, isLoading } = useQuery({
    queryKey: ["courseForPurchase", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);
      const endpoint = isObjectId ? `/courses/by-id/${courseId}` : `/courses/${courseId}`;
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!courseId,
  });

const price = Number(course?.discountPrice ?? course?.price ?? 0);
   const originalPrice = Number(course?.price ?? course?.discountPrice ?? price);
   const totalPrice = price * quantity;
   const hasDiscount = course?.discountPrice && course?.discountPrice < course?.price;

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?callbackUrl=/checkout/purchase?courseId=${courseId}&type=${purchaseType}`);
      return;
    }
    const accessType = purchaseType === "group" ? "GROUP" : "SINGLE";
    router.push(`/${locale}/checkout?courseId=${courseId}&accessType=${accessType}&quantity=${quantity}`);
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

  if (!course) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <h1 className="text-2xl font-bold text-base-content">Course not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-base-content mb-2">{t('title')}</h1>
          <p className="text-base-content/60 font-medium">
            {purchaseType === "group" ? t('teamAccess') : t('individualAccess')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="card-premium p-8 rounded-3xl border border-base-300 bg-base-100/80 backdrop-blur-md">
            <h3 className="font-bold text-base-content mb-6 pb-4 border-b border-base-300">{t('orderSummary')}</h3>

            <div className="flex gap-4 mb-6">
              <div className="w-24 h-24 rounded-xl bg-base-300 flex-shrink-0 overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base-content/30 font-black">
                    Preview
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-base-content text-sm leading-tight mb-1">{course.title}</h4>
                <p className="text-xs text-base-content/60 font-medium">{locale === 'ar' ? 'بواسطة' : 'By'} {course.instructor?.username}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm mb-6 pb-6 border-b border-base-300 font-medium text-base-content/80">
              <div className="flex justify-between">
                <span>{t('originalPrice')}</span>
                <span className="line-through">${originalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>{t('discount')}</span>
                <span>-50%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('finalPrice')}</span>
                <span className="font-bold text-base-content">${price.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-base-content">{t('total')}</span>
              <span className="text-2xl font-extrabold text-primary">${totalPrice.toFixed(2)}</span>
            </div>

            {purchaseType === "group" && (
              <div>
                <label className="block text-xs font-bold text-base-content/80 uppercase tracking-wider mb-2">
                  {t('teamMembersCount')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(5, parseInt(e.target.value) || 5))}
                  className="input-premium w-24 font-mono mb-3"
                />
                <span className="text-sm text-success font-medium block mb-4">{t('teamDiscountApplied')}</span>
              </div>
            )}

            {purchaseType === "group" && (
              <div className="p-4 bg-base-200/50 rounded-xl border border-base-300/50 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm text-primary">{t('teamAccessEnabled')}</span>
                </div>
                <p className="text-xs text-base-content/70">
                  {t('teamAccessDesc')}
                </p>
              </div>
            )}
          </div>

          <div className="card-premium p-8 rounded-3xl border border-base-300 bg-base-100/80 backdrop-blur-md">
            <h3 className="font-bold text-base-content mb-6 pb-4 border-b border-base-300">{t('whatYouGet')}</h3>

            <ul className="text-sm font-medium text-base-content/80 space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>{t('moneyBack')}</span>
              </li>
              <li className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{t('lifetimeAccess')}</span>
              </li>
              <li className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <span>{t('mobileAccess')}</span>
              </li>
              <li className="flex items-start gap-3">
                <Award className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>{t('certificate')}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <span>{t('hoursLeft')}</span>
              </li>
            </ul>

            <button
              onClick={handleProceedToCheckout}
              className="btn-premium w-full py-4 rounded-xl font-bold mt-8 flex justify-center items-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {t('proceedToCheckout')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PurchasePageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    }>
      <PurchasePage />
    </Suspense>
  );
}