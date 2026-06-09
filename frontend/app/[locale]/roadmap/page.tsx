'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function RoadmapPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('roadmap');

  const [activeTrack, setActiveTrack] = useState<'web' | 'mobile' | 'ai'>('web');

  const getTrackData = () => {
    switch (activeTrack) {
      case 'mobile':
        return {
          central: t('mobileCentral'),
          node1: {
            title: t('mobileNode1'),
            items: [t('mobileN1Item1'), t('mobileN1Item2'), t('mobileN1Item3')],
            mobileItem3: t('mobileN1MobileItem3'),
            subItems: [t('mobileN1Item4'), t('mobileN1Item5')],
          },
          node2: {
            title: t('mobileNode2'),
            items: [t('mobileN2Item1'), t('mobileN2Item2'), t('mobileN2Item3')],
          },
          node3: {
            title: t('mobileNode3'),
            items: [t('mobileN3Item1'), t('mobileN3Item2'), t('mobileN3Item3')],
          },
          nodeData: {
            title: t('mobileNodeData'),
            items: [t('mobileDataItem1'), t('mobileDataItem2'), t('mobileDataItem3')],
          },
        };
      case 'ai':
        return {
          central: t('aiCentral'),
          node1: {
            title: t('aiNode1'),
            items: [t('aiN1Item1'), t('aiN1Item2'), t('aiN1Item3')],
            mobileItem3: t('aiN1MobileItem3'),
            subItems: [t('aiN1Item4'), t('aiN1Item5')],
          },
          node2: {
            title: t('aiNode2'),
            items: [t('aiN2Item1'), t('aiN2Item2'), t('aiN2Item3')],
          },
          node3: {
            title: t('aiNode3'),
            items: [t('aiN3Item1'), t('aiN3Item2'), t('aiN3Item3')],
          },
          nodeData: {
            title: t('aiNodeData'),
            items: [t('aiDataItem1'), t('aiDataItem2'), t('aiDataItem3')],
          },
        };
      case 'web':
      default:
        return {
          central: t('webDev'),
          node1: {
            title: t('node1'),
            items: [t('n1Item1'), t('n1Item2'), t('n1Item3')],
            mobileItem3: t('n1MobileItem3'),
            subItems: [t('n1Item4'), t('n1Item5')],
          },
          node2: {
            title: t('node2'),
            items: [t('n2Item1'), t('n2Item2'), t('n2Item3')],
          },
          node3: {
            title: t('node3'),
            items: [t('n3Item1'), t('n3Item2'), t('n3Item3')],
          },
          nodeData: {
            title: t('nodeData'),
            items: [t('dataItem1'), t('dataItem2'), t('dataItem3')],
          },
        };
    }
  };

  const data = getTrackData();

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full relative">

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-4">
          <div className="badge badge-warning gap-2 p-3 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> {t('interactiveMindmap')}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-base-content leading-tight">
            {t('title')}
          </h1>
          <p className="text-xs md:text-sm opacity-70 font-semibold max-w-lg mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Tracks Selector Tab */}
        <div className="flex justify-center mb-12">
          <div className="bg-base-100 p-1.5 rounded-full border border-base-300 shadow-sm flex gap-1">
            {[
              { key: 'web', label: t('trackWeb') },
              { key: 'mobile', label: t('trackMobile') },
              { key: 'ai', label: t('trackAI') },
            ].map((track) => {
              const active = activeTrack === track.key;
              return (
                <button
                  key={track.key}
                  onClick={() => setActiveTrack(track.key as any)}
                  className={`px-5 py-2 rounded-full text-xs font-black transition-all ${
                    active 
                      ? 'bg-primary text-primary-content shadow-sm shadow-primary/10' 
                      : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50'
                  }`}
                >
                  {track.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Mindmap Tree (visible on md+) */}
        <div className="hidden md:block relative min-h-[750px] max-w-5xl mx-auto">

          {/* Vertical dividing dotted line in the center */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-l border-dashed border-base-300 -translate-x-1/2 z-0"></div>

          {/* Central Node */}
          <div className="absolute top-[280px] left-1/2 -translate-x-1/2 z-20">
            <div className="btn btn-warning shadow-lg text-lg cursor-default pointer-events-none">
              {data.central}
            </div>

            {/* Desktop horizontal branch links extending left and right from the center */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-[60px] h-0.5 bg-base-300"></div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 w-[60px] h-0.5 bg-base-300"></div>
          </div>

          {/* LEFT BRANCHES CONTAINER */}
          <div className="absolute left-0 w-[42%] space-y-12">

            {/* Top Left: Node 1 */}
            <div className="card bg-base-100 border border-base-200 shadow-xl relative z-10">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.node1.title}
                </div>
                <div className="space-y-2">
                  {data.node1.items.map((item, idx) => (
                    <div key={idx} className="badge badge-warning badge-outline w-full p-4 hover:scale-105 transition-transform cursor-pointer">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Connecting line to left central path */}
              <div className="absolute right-[-62px] top-[75px] w-[62px] h-[180px] border-t-2 border-r-2 border-base-300 rounded-tr-3xl pointer-events-none"></div>

              {/* Sub-branch link to Double Diamond */}
              <div className="absolute left-[-40px] top-[75px] w-[40px] h-[100px] border-b-2 border-l-2 border-base-300 rounded-bl-3xl pointer-events-none"></div>
            </div>

            {/* Far Left Sub-Branch items */}
            <div className="absolute left-[-170px] top-[70px] w-[140px] space-y-2 z-10">
              {data.node1.subItems?.map((subItem, idx) => (
                <div key={idx} className="badge badge-warning badge-outline w-full text-[10px] p-3">
                  {subItem}
                </div>
              ))}
            </div>

            {/* Bottom Left: Node 3 */}
            <div className="card bg-base-100 border border-base-200 shadow-xl relative !mt-44">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.node3.title}
                </div>
                <div className="space-y-2">
                  {data.node3.items.map((item, idx) => (
                    <div key={idx} className="badge badge-warning badge-outline w-full p-4 hover:scale-105 transition-transform cursor-pointer">
                      {item}
                    </div>
                  ))}

                  <button
                    onClick={() => router.push(`/${locale}/courses`)}
                    className="btn btn-warning w-full mt-2"
                  >
                    {t('startChallenge')}
                  </button>
                </div>
              </div>

              {/* Connecting line to left central path */}
              <div className="absolute right-[-62px] bottom-[75px] w-[62px] h-[180px] border-b-2 border-r-2 border-base-300 rounded-br-3xl pointer-events-none"></div>
            </div>

          </div>

          {/* RIGHT BRANCHES CONTAINER */}
          <div className="absolute right-0 w-[42%] space-y-12">

            {/* Top Right: Node 2 */}
            <div className="card bg-base-100 border border-base-200 shadow-xl relative z-10">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.node2.title}
                </div>
                <div className="space-y-2">
                  {data.node2.items.map((item, idx) => (
                    <div key={idx} className="badge badge-warning badge-outline w-full p-4 hover:scale-105 transition-transform cursor-pointer">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Connecting line to right central path */}
              <div className="absolute left-[-62px] top-[75px] w-[62px] h-[180px] border-t-2 border-l-2 border-base-300 rounded-tl-3xl pointer-events-none"></div>
            </div>

            {/* Bottom Right: Node Data */}
            <div className="card bg-base-100 border border-base-200 shadow-xl relative !mt-44">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.nodeData.title}
                </div>
                <div className="space-y-2">
                  {data.nodeData.items.map((item, idx) => (
                    <div key={idx} className="badge badge-warning badge-outline w-full p-4 hover:scale-105 transition-transform cursor-pointer">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Connecting line to right central path */}
              <div className="absolute left-[-62px] bottom-[75px] w-[62px] h-[180px] border-b-2 border-l-2 border-base-300 rounded-bl-3xl pointer-events-none"></div>
            </div>

          </div>

        </div>

        {/* Mobile Mindmap Stacking (visible on mobile/tablet) */}
        <div className="block md:hidden max-w-md mx-auto space-y-8 relative">

          <div className="text-center">
            <div className="btn btn-warning">
              {data.central}
            </div>
          </div>

          <div className="space-y-6">

            {/* Card 1 */}
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.node1.title}
                </div>
                <div className="space-y-2">
                  {data.node1.items.map((item, idx) => {
                    const displayItem = idx === 2 ? data.node1.mobileItem3 : item;
                    return (
                      <div key={idx} className="badge badge-warning badge-outline w-full p-4 text-center h-auto py-2">
                        {displayItem}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.node2.title}
                </div>
                <div className="space-y-2">
                  {data.node2.items.map((item, idx) => (
                    <div key={idx} className="badge badge-warning badge-outline w-full p-4">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.nodeData.title}
                </div>
                <div className="space-y-2">
                  {data.nodeData.items.map((item, idx) => (
                    <div key={idx} className="badge badge-warning badge-outline w-full p-4">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="badge badge-neutral w-full p-4 mb-2 font-bold">
                  {data.node3.title}
                </div>
                <div className="space-y-2">
                  {data.node3.items.map((item, idx) => (
                    <div key={idx} className="badge badge-warning badge-outline w-full p-4">
                      {item}
                    </div>
                  ))}

                  <button
                    onClick={() => router.push(`/${locale}/courses`)}
                    className="btn btn-warning w-full mt-2"
                  >
                    {t('startChallenge')}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
}
