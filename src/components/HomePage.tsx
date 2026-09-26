"use client";

import React from "react";
import { Compass, Sparkles, MapPin, ArrowRight, Globe } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import AnimatedScene from "@/components/AnimatedScene";
import siteContent from "@/data/siteContent.json";
import { localization, t } from "@/lib/localization";

export interface HomePageProps {
  onStartPlanning?: () => void;
  onStartPlanningClick?: () => void;
  onExploreClick?: () => void;
}

export default function HomePage({
  onStartPlanning,
  onStartPlanningClick,
  onExploreClick,
}: HomePageProps) {
  const handleStartPlanning =
    onStartPlanning ?? onStartPlanningClick ?? onExploreClick;

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "Compass":
        return <Compass className="w-5 h-5 text-sky-400" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case "MapPin":
        return <MapPin className="w-5 h-5 text-cyan-400" />;
      default:
        return <Globe className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <header className="border-b border-slate-800/60">
      <div className="relative overflow-hidden">
        <AnimatedScene />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-16 sm:pb-20">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {localization.brand.taglinePrefix}{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                {localization.brand.taglineHighlight}
              </span>{" "}
              {localization.brand.taglineSuffix}
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
              {localization.brand.subheading}
            </p>

            <div className="pt-2 flex-wrap items-center justify-center gap-3">
              <Button
                variant="gradient"
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                onClick={handleStartPlanning}
              >
                {localization.header.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="text-center mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              {localization.header.howItWorks}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {siteContent.hints.map((step) => (
              <Card
                key={step.step}
                variant="glass"
                className="p-6 relative group hover:border-sky-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-slate-800/80 border-slate-700/60 shadow-inner group-hover:scale-105 transition-transform">
                    {getStepIcon(step.icon)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {t(localization.header.stepLabel, { step: step.step })}
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
