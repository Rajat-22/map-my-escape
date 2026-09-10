'use client';

import dynamic from 'next/dynamic';
import ItineraryForm from '@/components/ItineraryForm';

// Dynamically load MapComponent to prevent window is not defined errors during SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
        <span>Loading Real Map...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12">
      <div className="z-10 w-full max-w-6xl space-y-8">
        <header className="text-center">
          <span className="inline-block rounded-full bg-sky-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-sky-400 border border-sky-500/20 mb-3">
            Step 1 Baseline
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            MapMyEscape
          </h1>
          <p className="mt-2 text-slate-400 text-base max-w-xl mx-auto">
            Dynamic AI Travel Planner with Real-Time Map Visualization
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <ItineraryForm />
          </div>
          <div className="lg:col-span-2">
            <div className="w-full h-[550px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <MapComponent />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
