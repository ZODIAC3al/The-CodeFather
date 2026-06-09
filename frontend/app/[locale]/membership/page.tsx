'use client';

import Navbar from '@/components/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Zap, Users, Award, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Footer from '@/components/Footer';

// Static tier table data (matches the Beam reference style)
const TIER_TABLE = [
  { sends: '2,500', price: 'Included', bold: false },
  { sends: '5,000', price: '$32/mo', bold: true },
  { sends: '7,500', price: '$49/mo', bold: true },
  { sends: '10,000', price: '$99/mo', bold: true },
  { sends: '12,500', price: '$125/mo', bold: true },
];

// Plan feature lists
const PLAN_FEATURES: Record<string, string[]> = {
  monthly: [
    'Unlimited Access to Video Courses',
    'Source Code Downloads',
    'Community Forum Access',
    'Email Support',
  ],
  yearly: [
    'Unlimited Access to Video Courses',
    'Source Code Downloads',
    'Community Forum Access',
    '1-on-1 Mentor Session',
  ],
};

// Plan icons
const PLAN_ICONS: Record<string, React.ElementType> = {
  monthly: Zap,
  yearly: Sparkles,
};

export default function Membership() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('membership');

  const featuresMonthly = [
    t('feature1'),
    t('feature2'),
    t('feature3'),
    t('feature4'),
  ];
  const featuresYearly = [
    t('feature1'),
    t('feature2'),
    t('feature3'),
    t('feature5'),
  ];

  const [isYearly, setIsYearly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: dbPlans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: async () => {
      const { data } = await api.get('/memberships/plans');
      return data;
    },
  });

  const { data: myMembership } = useQuery({
    queryKey: ['myMembership'],
    queryFn: async () => {
      const { data } = await api.get('/memberships/my');
      return data;
    },
    enabled: isAuthenticated,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post('/memberships/subscribe', { planId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMembership'] });
      setMessage('Successfully subscribed! Welcome to Premium.');
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || 'Failed to subscribe');
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) { router.push(`/${locale}/login`); return; }
    subscribeMutation.mutate(planId);
  };

  // Displayed plans: filter by billing toggle
  const displayedPlans = dbPlans?.filter((p: any) =>
    isYearly ? p.interval === 'year' : p.interval === 'month'
  ) ?? [];

  const PlanIcon1 = PLAN_ICONS.yearly;
  const PlanIcon2 = PLAN_ICONS.monthly;

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow w-full">

        {/* Header + Toggle */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">{t('upgradeTitle')}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-base-content tracking-tight leading-tight mb-3">
                {t('mainTitle')}<br />
                <span className="text-primary">{t('premium')}</span>
              </h1>
              <p className="text-base-content/60 text-base font-medium max-w-lg">
                {t('subtitle')}
              </p>
            </div>
            {/* Monthly / Yearly toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-base-content' : 'text-base-content/40'}`}>{t('monthly')}</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={isYearly}
                onChange={() => setIsYearly(!isYearly)}
              />
              <span className={`text-sm font-bold transition-colors ${isYearly ? 'text-base-content' : 'text-base-content/40'}`}>{t('yearly')}</span>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-8 p-4 bg-primary/10 text-primary rounded-xl font-bold text-center border border-primary/20">
            {message}
          </div>
        )}

        {isPlansLoading ? (
          <div className="flex justify-center my-20">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* If we have DB plans, render Beam-style cards */}
            {displayedPlans.length > 0 ? (
              displayedPlans.map((plan: any) => {
                const planId = plan.id || plan._id;
                const isAnnual = plan.interval === 'year';
                const isActive = myMembership?.planId === planId && myMembership?.status === 'ACTIVE';
                const PlanIcon = isAnnual ? PLAN_ICONS.yearly : PLAN_ICONS.monthly;
                const features = isAnnual ? featuresYearly : featuresMonthly;

                return (
                  <div
                    key={planId}
                    className="bg-base-100 rounded-3xl border border-base-300 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* LEFT: plan info */}
                      <div className="p-8 border-b lg:border-b-0 lg:border-r border-base-300">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <PlanIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-extrabold text-base-content">{locale === 'ar' && plan.name === 'Monthly Pass' ? 'الاشتراك الشهري' : locale === 'ar' && plan.name === 'Annual Pass' ? 'الاشتراك السنوي' : plan.name}</h3>
                            <p className="text-sm text-base-content/60 mt-0.5">
                              {isAnnual
                                ? t('yearlyPlanDesc')
                                : t('monthlyPlanDesc')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                          {features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-base-content/70">{feat}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          {isActive ? (
                            <button disabled className="btn btn-ghost px-6 rounded-xl font-bold text-sm bg-base-200 text-base-content/50 cursor-not-allowed flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" /> {t('currentPlan')}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSubscribe(planId)}
                                disabled={subscribeMutation.isPending}
                                className="btn btn-neutral px-6 rounded-xl font-bold text-sm"
                              >
                                {subscribeMutation.isPending ? t('processing') : t('startDeploying')}
                              </button>
                              <button className="btn btn-ghost px-4 rounded-xl font-bold text-sm text-base-content/70">
                                {t('getDemo')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* RIGHT: tier table */}
                      <div className="overflow-x-auto">
                        <table className="table w-full">
                          <thead>
                            <tr className="bg-neutral text-neutral-content">
                              <th className="text-xs font-bold uppercase tracking-wider py-4 px-6">{t('weeklySends')}</th>
                              <th className="text-xs font-bold uppercase tracking-wider py-4 px-6 text-right">{t('price')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {TIER_TABLE.map((tier, i) => (
                              <tr key={i} className="border-base-300 hover:bg-base-200/50 transition-colors">
                                <td className="py-3.5 px-6 text-sm text-base-content/70 font-medium">{tier.sends}</td>
                                <td className={`py-3.5 px-6 text-sm text-right font-bold ${tier.bold ? 'text-base-content' : 'text-primary'}`}>
                                  {locale === 'ar' && tier.price === 'Included' ? 'مشمول' : tier.price}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Fallback: no DB plans but show Enterprise-style card */
              <div className="bg-base-100 rounded-3xl border border-base-300 overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="p-8 border-b lg:border-b-0 lg:border-r border-base-300">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-base-content">{t('addOns')}</h3>
                        <p className="text-sm text-base-content/60 mt-0.5">{t('addOnsDesc')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {featuresYearly.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" /></svg>
                          </div>
                          <span className="text-xs font-medium text-base-content/70">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleSubscribe('default')} className="btn btn-neutral px-6 rounded-xl font-bold text-sm">{t('startNow')}</button>
                      <button className="btn btn-ghost px-4 rounded-xl font-bold text-sm text-base-content/70">{t('getDemo')}</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr className="bg-neutral text-neutral-content">
                          <th className="text-xs font-bold uppercase tracking-wider py-4 px-6">{t('weeklySends')}</th>
                          <th className="text-xs font-bold uppercase tracking-wider py-4 px-6 text-right">{t('price')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TIER_TABLE.map((tier, i) => (
                          <tr key={i} className="border-base-300 hover:bg-base-200/50 transition-colors">
                            <td className="py-3.5 px-6 text-sm text-base-content/70 font-medium">{tier.sends}</td>
                            <td className={`py-3.5 px-6 text-sm text-right font-bold ${tier.bold ? 'text-base-content' : 'text-primary'}`}>
                              {locale === 'ar' && tier.price === 'Included' ? 'مشمول' : tier.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Enterprise card (always shown at bottom) */}
            <div className="bg-base-100 rounded-3xl border border-base-300 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-base-content">{t('enterprise')}</h3>
                    <p className="text-sm text-base-content/60 mt-0.5">{t('enterpriseDesc')}</p>
                  </div>
                </div>
                <button className="btn btn-accent px-6 rounded-xl font-bold text-sm whitespace-nowrap">
                  {locale === 'ar' ? 'اتصل بنا ← 250$' : 'Contact Us → $250'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-20 border-t border-base-300 pt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { Icon: Zap, title: t('badge1Title'), desc: t('badge1Desc') },
            { Icon: Users, title: t('badge2Title'), desc: t('badge2Desc') },
            { Icon: Award, title: t('badge3Title'), desc: t('badge3Desc') },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="p-4">
              <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
              <h4 className="font-bold text-base-content text-lg mb-2">{title}</h4>
              <p className="text-sm text-base-content/60 font-medium">{desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}