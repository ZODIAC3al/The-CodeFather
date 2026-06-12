'use client';

import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  HelpCircle,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function RoadmapPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('roadmap');
  const isAr = locale === 'ar';

  const [activeTrack, setActiveTrack] = useState<'web' | 'mobile' | 'ai'>('web');
  const [activeCategory, setActiveCategory] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // ─── Roadmap Data ──────────────────────────────────────────────────────────
  const getRoadmapData = () => {
    switch (activeTrack) {
      case 'mobile':
        return {
          title: isAr ? 'منهج تطوير تطبيقات الهاتف' : 'Mobile Application Development',
          beginner: {
            title: isAr ? 'الخطوة الأولى: البداية والتأسيس' : 'Where to Start',
            desc: isAr ? 'تعلم أساسيات واجهات تطبيقات الهواتف الذكية وتثبيت بيئات العمل.' : 'Master mobile UI primitives, screen layout paradigms, and environment configuration.',
            nodes: [
              { id: 'mob-1', label: 'React Native & Expo', hours: '12 hrs', desc: isAr ? 'بناء تطبيقات عابرة للمنصات باستخدام React Native وحزمة Expo.' : 'Build cross-platform apps using React Native and the Expo framework.' },
              { id: 'mob-2', label: 'Flutter & Dart', hours: '15 hrs', desc: isAr ? 'استخدام لغة Dart ومحرك Flutter لتصميم واجهات تفاعلية.' : 'Utilize Dart and Flutter engine for high fidelity widgets.' },
              { id: 'mob-3', label: 'SwiftUI & Compose', hours: '18 hrs', desc: isAr ? 'البرمجة الأصلية باستخدام SwiftUI لنظام iOS و Jetpack Compose لنظام Android.' : 'Native UI layouts using SwiftUI for iOS and Jetpack Compose for Android.' }
            ]
          },
          intermediate: {
            title: isAr ? 'الخطوة الثانية: البنية البرمجية والمزامنة' : 'Core Architectures',
            desc: isAr ? 'ربط التطبيق بالخوادم وإدارة الحالات الأمنية وقواعد البيانات المحلية.' : 'Integrate backend web sockets, manage user states, and scale offline storage.',
            nodes: [
              { id: 'mob-4', label: 'REST & WebSockets Sync', hours: '20 hrs', desc: isAr ? 'الاتصال التفاعلي مع الخوادم باستعمال بروتوكولات REST والويب سوكت.' : 'Synchronize frontends with REST endpoints and live WebSocket events.' },
              { id: 'mob-5', label: 'Zustand State Engine', hours: '10 hrs', desc: isAr ? 'إدارة الحالة العامة للتطبيق بكفاءة وسلاسة.' : 'Optimize client states using Zustand lightweight store.' },
              { id: 'mob-6', label: 'Firebase & Supabase Auth', hours: '14 hrs', desc: isAr ? 'تأمين الحسابات عبر تقنيات تسجيل الدخول والتوثيق السحابي.' : 'Integrate cloud authentication and social logins securely.' }
            ]
          },
          advanced: {
            title: isAr ? 'الخطوة الثالثة: الأمان والنشر' : 'Specialized Paths',
            desc: isAr ? 'حفظ البيانات محلياً وتأمينها ثم إرسال التطبيقات للمتاجر.' : 'Secure keychains, store offline databases, and deploy to App Store and Google Play.',
            nodes: [
              { id: 'mob-7', label: 'SQLite & Keychain Storage', hours: '22 hrs', desc: isAr ? 'استعمال قواعد بيانات SQLite المشفرة وتأمين المفاتيح في الهاتف.' : 'Persist offline data using SQLite and secure iOS/Android Keychains.' },
              { id: 'mob-8', label: 'App Store Submissions', hours: '15 hrs', desc: isAr ? 'نشر التطبيقات وتوزيعها عبر متاجر أبل وجوجل الرسمية.' : 'Release products to Apple App Store and Google Play Store.' },
              { id: 'mob-9', label: 'CI/CD Pipelines (Fastlane)', hours: '25 hrs', desc: isAr ? 'أتمتة بناء واختبار وتوزيع التطبيقات باستخدام Fastlane.' : 'Build automated compilation and testing triggers using Fastlane pipelines.' }
            ]
          }
        };
      case 'ai':
        return {
          title: isAr ? 'منهج الذكاء الاصطناعي وعلوم البيانات' : 'AI & Data Science Curriculum',
          beginner: {
            title: isAr ? 'الخطوة الأولى: البداية والتأسيس' : 'Where to Start',
            desc: isAr ? 'تعلم أساسيات لغة بايثون والمفاهيم الرياضية لعلوم البيانات.' : 'Learn data manipulation primitives, linear algebra, and Python syntax.',
            nodes: [
              { id: 'ai-1', label: 'Python & NumPy Core', hours: '10 hrs', desc: isAr ? 'أساسيات البرمجة بلغة بايثون وهياكل مصفوفات NumPy.' : 'Basic programming logic in Python and NumPy array structures.' },
              { id: 'ai-2', label: 'Linear Algebra & Calculus', hours: '20 hrs', desc: isAr ? 'الجبر الخطي والتفاضل والتكامل اللازم لفهم خوارزميات التعلم.' : 'Mathematical concepts including matrix transforms and derivatives.' },
              { id: 'ai-3', label: 'Pandas & Visualization', hours: '12 hrs', desc: isAr ? 'تنظيف وتحليل البيانات وعرضها باستخدام Pandas و Seaborn.' : 'Dataframe wrangling and plotting diagrams using Seaborn.' }
            ]
          },
          intermediate: {
            title: isAr ? 'الخطوة الثانية: نماذج تعلم الآلة' : 'Core Architectures',
            desc: isAr ? 'تطبيق خوارزميات التصنيف والأنواع المختلفة لتعلم الآلة.' : 'Apply classification, regression, and clustering algorithms.',
            nodes: [
              { id: 'ai-4', label: 'Scikit-Learn Workflows', hours: '18 hrs', desc: isAr ? 'تدريب خوارزميات التعلم الخاضع وغير الخاضع للإشراف.' : 'Fit supervised and unsupervised ML models using Scikit-Learn.' },
              { id: 'ai-5', label: 'Vector DBs (Pinecone)', hours: '15 hrs', desc: isAr ? 'تخزين واسترجاع متجهات البيانات في قواعد البيانات المتجهة.' : 'Index embeddings in vector spaces using Pinecone or Milvus.' },
              { id: 'ai-6', label: 'BigQuery Pipelines (ETL)', hours: '22 hrs', desc: isAr ? 'تصميم خطوط معالجة وتصفية كميات البيانات الضخمة.' : 'Write pipelines to clean big data in Google BigQuery.' }
            ]
          },
          advanced: {
            title: isAr ? 'الخطوة الثالثة: التعلم العميق والـ LLMs' : 'Specialized Paths',
            desc: isAr ? 'بناء الشبكات العصبية العميقة واستخدام النماذج اللغوية الكبيرة.' : 'Design neural network structures and finetune large language models.',
            nodes: [
              { id: 'ai-7', label: 'TensorFlow & PyTorch Core', hours: '30 hrs', desc: isAr ? 'التعامل مع الأوزان والشبكات العصبية العميقة باستخدام PyTorch.' : 'Construct neural layer stacks and backpropagation triggers.' },
              { id: 'ai-8', label: 'Transformer Networks', hours: '25 hrs', desc: isAr ? 'فهم معمارية الـ Transformers وبناء نماذج تحليل النصوص.' : 'Understand attention mechanisms and build sequence-to-sequence models.' },
              { id: 'ai-9', label: 'Finetuning LLMs (HuggingFace)', hours: '35 hrs', desc: isAr ? 'ضبط وتعديل النماذج اللغوية المفتوحة المهام لتعليم مهام مخصصة.' : 'Finetune open source LLMs on domain specific datasets.' }
            ]
          }
        };
      case 'web':
      default:
        return {
          title: isAr ? 'منهج تطوير الويب الشامل' : 'Web / Fullstack Curriculum',
          beginner: {
            title: isAr ? 'الخطوة الأولى: البداية والتأسيس' : 'Where to Start',
            desc: isAr ? 'تعلم أساسيات تصميم وهندسة واجهات الويب التفاعلية.' : 'Master semantic structure, visual layout configurations, and type safety.',
            nodes: [
              { id: 'web-1', label: 'TypeScript Strict Mode', hours: '10 hrs', desc: isAr ? 'استخدام نظام الأنواع الصارم في البرمجة لضمان أمان الكود.' : 'Write highly maintainable client-side logic using strict type declarations.' },
              { id: 'web-2', label: 'Semantic HTML5 & CSS Grid', hours: '12 hrs', desc: isAr ? 'بناء هياكل صفحات متوافقة وتصميم تخطيطات مرنة باستخدام Grid.' : 'Build accessible structures (WCAG) and layouts with CSS Grid/Flexbox.' },
              { id: 'web-3', label: 'Next.js App Router Layouts', hours: '15 hrs', desc: isAr ? 'تخطيط وتقسيم الصفحات بشكل متداخل وسلس في Next.js.' : 'Structure applications with nested pages, dynamic layouts, and loading states.' }
            ]
          },
          intermediate: {
            title: isAr ? 'الخطوة الثانية: هندسة الواجهات الخلفية' : 'Core Architectures',
            desc: isAr ? 'برمجة خوادم الويب وتأمينها وبناء واجهات التطبيقات البرمجية.' : 'Construct scalable server architectures, database modeling, and token security.',
            nodes: [
              { id: 'web-4', label: 'REST API Design & Guards', hours: '18 hrs', desc: isAr ? 'بناء واجهات برمجية آمنة وتصميم حراس مسارات مرور البيانات.' : 'Design endpoints with request validations, error payloads, and route guards.' },
              { id: 'web-5', label: 'Prisma ORM & PostgreSQL', hours: '20 hrs', desc: isAr ? 'التعامل مع قواعد البيانات العلائقية ومزامنة مخططاتها باستخدام Prisma.' : 'Model database systems and deploy relational schemas with PostgreSQL.' },
              { id: 'web-6', label: 'JWT Access/Refresh Tokens', hours: '14 hrs', desc: isAr ? 'إعداد دورة تسجيل دخول آمنة باستخدام رموز JWT الثنائية.' : 'Implement stateless security via access and refresh token rotations.' }
            ]
          },
          advanced: {
            title: isAr ? 'الخطوة الثالثة: الإنتاج والتحسين' : 'Specialized Paths',
            desc: isAr ? 'تحسين سرعة الصفحات ومزامنة الكود للعمل دون اتصال بالإنترنت.' : 'Build service worker precaches, serverless caching, and server actions.',
            nodes: [
              { id: 'web-7', label: 'Service Worker & Offline Cache', hours: '22 hrs', desc: isAr ? 'مزامنة الكود وحفظه محلياً ليعمل الموقع بالكامل دون اتصال بالإنترنت.' : 'Configure client-side service workers to enable full offline workspace operations.' },
              { id: 'web-8', label: 'Edge Runtime & Server Actions', hours: '25 hrs', desc: isAr ? 'تشغيل العمليات البرمجية على السيرفرات القريبة واستخدام Edge.' : 'Optimize performance using lightweight Edge compute routes.' },
              { id: 'web-9', label: 'GraphQL & Apollo Federation', hours: '30 hrs', desc: isAr ? 'بناء بوابات بيانات متطورة وموحدة للمشاريع الكبيرة.' : 'Aggregate multi-service backend schemas into a single gateway.' }
            ]
          }
        };
    }
  };

  const currentRoadmap = getRoadmapData();
  const categories: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];

  const catMeta: Record<string, { icon: any; color: string; ring: string; dot: string }> = {
    beginner: { icon: Compass, color: 'primary', ring: 'ring-primary', dot: 'bg-primary' },
    intermediate: { icon: Shield, color: 'secondary', ring: 'ring-secondary', dot: 'bg-secondary' },
    advanced: { icon: Award, color: 'accent', ring: 'ring-accent', dot: 'bg-accent' },
  };

  const catLabels: Record<string, string> = {
    beginner: isAr ? 'مبتدئ' : 'Beginner',
    intermediate: isAr ? 'متوسط' : 'Intermediate',
    advanced: isAr ? 'متقدم' : 'Advanced',
  };

  const handleNodeClick = (node: any, cat: 'beginner' | 'intermediate' | 'advanced') => {
    setActiveCategory(cat);
    setSelectedNode(node);
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full relative">
        {/* Glow decorations */}
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl -z-10" />

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="badge badge-primary gap-2 p-3.5 font-bold uppercase tracking-wider text-xs shadow-md">
            <Sparkles className="w-4 h-4 text-white" /> {t('interactiveMindmap')}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-base-content leading-tight">
            {currentRoadmap.title}
          </h1>
          <p className="text-xs md:text-sm text-base-content/60 font-semibold max-w-lg mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Track Selector */}
        <div className="flex justify-center mb-14">
          <div className="bg-base-100 p-1.5 rounded-full border border-base-300 shadow-sm flex gap-1 flex-wrap justify-center">
            {[
              { key: 'web', label: t('trackWeb') },
              { key: 'mobile', label: t('trackMobile') },
              { key: 'ai', label: t('trackAI') },
            ].map((track) => {
              const active = activeTrack === track.key;
              return (
                <button
                  key={track.key}
                  onClick={() => {
                    setActiveTrack(track.key as any);
                    setSelectedNode(null);
                    setActiveCategory('beginner');
                  }}
                  className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${active
                    ? 'bg-primary text-primary-content shadow-md'
                    : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                    }`}
                >
                  {track.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TREE VISUALIZATION ───────────────────────────────────────── */}
        <div className="relative max-w-5xl mx-auto pb-16">
          {/* Root node */}
          <div className="flex flex-col items-center mb-2 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary text-primary-content flex items-center justify-center shadow-xl shadow-primary/30 border-4 border-base-100">
              <Sparkles className="w-7 h-7 sm:w-9 sm:h-9" />
            </div>
            <span className="mt-3 text-xs sm:text-sm font-black uppercase tracking-wider text-base-content/70 text-center px-4">
              {currentRoadmap.title}
            </span>
          </div>

          {/* Trunk line down from root */}
          <div className="flex justify-center">
            <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-primary/60 to-base-300" />
          </div>

          {/* Branch row connector (desktop horizontal spread) */}
          <div className="hidden md:block relative h-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-base-300" />
            <div className="absolute top-1/2 left-[16.66%] right-[16.66%] h-[2px] bg-base-300" />
            {categories.map((cat, idx) => (
              <div
                key={cat}
                className="absolute top-1/2 w-[2px] h-1/2 bg-base-300"
                style={{ left: `${16.66 + idx * 33.33}%` }}
              />
            ))}
          </div>
          <div className="md:hidden flex justify-center">
            <div className="w-px h-6 bg-base-300" />
          </div>

          {/* Category trunk nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {categories.map((cat) => {
              const meta = catMeta[cat];
              const Icon = meta.icon;
              const data = currentRoadmap[cat];
              const isActiveCat = activeCategory === cat;

              return (
                <div key={cat} className="flex flex-col items-center">
                  {/* Trunk node button */}
                  <button
                    onClick={() => {
                      setActiveCategory(cat);
                      setSelectedNode(null);
                    }}
                    className={`group flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 ${isActiveCat ? 'scale-105' : 'hover:scale-105'
                      }`}
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-md border-2 transition-all duration-200 ${isActiveCat
                        ? `bg-${meta.color} text-${meta.color}-content border-${meta.color} shadow-lg`
                        : 'bg-base-100 text-base-content/50 border-base-300 group-hover:border-base-content/30'
                        }`}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-base-content/40">
                        {catLabels[cat]}
                      </h4>
                      <p className="text-xs sm:text-sm font-extrabold text-base-content mt-0.5 max-w-[160px] leading-snug">
                        {data.title}
                      </p>
                    </div>
                  </button>

                  {/* Connector line down to leaves */}
                  <div className="w-px h-6 sm:h-8 bg-base-300 my-1" />

                  {/* Leaf nodes (children) */}
                  <div className="w-full flex flex-col gap-3 relative">
                    {/* vertical spine for this branch */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-6 w-px bg-base-300 -z-10 hidden sm:block" />

                    {data.nodes.map((node: any, idx: number) => {
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div key={node.id} className="relative flex items-center">
                          {/* horizontal tick */}
                          <div className="hidden sm:block absolute left-1/2 -translate-x-full w-3 h-px bg-base-300" />
                          <button
                            onClick={() => handleNodeClick(node, cat)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${isSelected
                              ? `bg-${meta.color}/10 border-${meta.color} shadow-sm`
                              : 'bg-base-100 border-base-300 hover:bg-base-200/60 hover:border-base-content/20'
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black ${isSelected
                                  ? `bg-${meta.color} text-${meta.color}-content`
                                  : 'bg-base-300 text-base-content/60'
                                  }`}
                              >
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <h5
                                  className={`text-xs font-extrabold truncate transition-colors ${isSelected ? `text-${meta.color}` : 'text-base-content group-hover:text-primary'
                                    }`}
                                >
                                  {node.label}
                                </h5>
                                <span className="text-[9px] text-base-content/45 font-bold flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {node.hours}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-base-content/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Node Detail Drawer (slide-over) ─────────────────────────── */}
        {selectedNode && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
              onClick={() => setSelectedNode(null)}
            />

            {/* Drawer */}
            <div
              className={`fixed top-0 ${isAr ? 'left-0' : 'right-0'} h-full w-full sm:w-[400px] bg-base-100 z-50 shadow-2xl p-6 sm:p-8 flex flex-col gap-5 overflow-y-auto animate-slideIn`}
            >
              <div className="flex items-center justify-between">
                <div className={`badge badge-${catMeta[activeCategory].color} badge-outline text-[9px] font-black uppercase tracking-wider`}>
                  {catLabels[activeCategory]} {isAr ? 'عقدة' : 'Node'}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="btn btn-sm btn-ghost btn-circle"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${catMeta[activeCategory].color}/10 text-${catMeta[activeCategory].color}`}
              >
                {(() => {
                  const Icon = catMeta[activeCategory].icon;
                  return <Icon className="w-6 h-6" />;
                })()}
              </div>

              <h3 className="text-xl font-black text-base-content leading-snug">
                {selectedNode.label}
              </h3>

              <p className="text-sm text-base-content/70 leading-relaxed font-semibold">
                {selectedNode.desc}
              </p>

              <div className="pt-4 border-t border-base-300 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-base-content/60">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {isAr ? 'الوقت المقدر:' : 'Estimated Duration:'}
                  </span>
                  <span className={`text-${catMeta[activeCategory].color} font-black`}>{selectedNode.hours}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-base-content/60">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    {isAr ? 'مستوى الصعوبة:' : 'Difficulty Level:'}
                  </span>
                  <span className="badge badge-sm badge-neutral text-[9px] font-black uppercase py-2">
                    {catLabels[activeCategory]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-base-content/60">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isAr ? 'المسار:' : 'Track:'}
                  </span>
                  <span className="capitalize">{activeTrack}</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/${locale}/courses`)}
                className={`btn btn-${catMeta[activeCategory].color} w-full rounded-xl font-bold flex items-center justify-center gap-1.5 mt-auto`}
              >
                {t('startChallenge')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Helper hint when nothing selected */}
        {!selectedNode && (
          <div className="text-center max-w-md mx-auto mt-4 space-y-2 text-base-content/40">
            <HelpCircle className="w-6 h-6 mx-auto animate-pulse" />
            <p className="text-xs font-bold leading-relaxed">
              {isAr
                ? 'اضغط على أي عقدة في الشجرة لعرض تفاصيلها وبدء التحدي.'
                : 'Tap any node in the tree above to view its details and start the challenge.'}
            </p>
          </div>
        )}
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(${isAr ? '-100%' : '100%'}); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}