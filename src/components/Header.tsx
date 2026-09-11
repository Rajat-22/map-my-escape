"use client";

import React from "react";
import {
  Compass,
  Sparkles,
  MapPin,
  ArrowRight,
  Plane,
  Globe,
  Mountain,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import siteContent from "@/data/siteContent.json";
import { TripRequest } from "@/types/itinerary";

export interface HeaderProps {
  /** Callback triggered when a user selects a curated trip preset */
  onSelectPreset?: (preset: TripRequest) => void;
  /** Primary CTA callback (e.g. scroll to itinerary planner) */
  onStartPlanning?: () => void;
  /** Backwards-compatible aliases */
  onStartPlanningClick?: () => void;
  onExploreClick?: () => void;
}

export default function Header({
  onSelectPreset,
  onStartPlanning,
  onStartPlanningClick,
  onExploreClick,
}: HeaderProps) {
  const handleStartPlanning =
    onStartPlanning ?? onStartPlanningClick ?? onExploreClick;

  const handleScrollToPresets = () => {
    document.getElementById("presets")?.scrollIntoView({ behavior: "smooth" });
  };

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "Compass":
        return <Compass className="w-5 h-5 text-sky-400" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case "MapPin":
        return <MapPin className="w-5 h-5 text-teal-400" />;
      default:
        return <Globe className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <header className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-slate-800/60 bg-radial-gradient">
      {/* Ambient background glow & grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-sky-500/20 via-teal-500/10 to-indigo-500/20 blur-3xl pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Header & Value Proposition */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/40 px-3.5 py-1 text-xs font-semibold text-sky-300 backdrop-blur-md shadow-inner">
            <Plane className="w-3.5 h-3.5 text-sky-400" />
            <span>AI-Driven Spontaneous Adventures</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {siteContent.brand.tagline.split("Escape")[0]}
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Escape
            </span>{" "}
            Your Way.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            {siteContent.brand.subheading}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="gradient"
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={handleStartPlanning}
            >
              Build Your Escape
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={<Mountain className="w-4 h-4 text-teal-400" />}
              onClick={handleScrollToPresets}
            >
              Explore Top Escapes
            </Button>
          </div>
        </div>

        {/* 3 Step Guidance */}
        <div className="mt-14">
          <div className="text-center mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              How MapMyEscape Works
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {siteContent.hints.map((step) => (
              <Card
                key={step.step}
                variant="glass"
                className="p-6 relative group hover:border-sky-500/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner group-hover:scale-105 transition-transform">
                    {getStepIcon(step.icon)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-sky-400">
                      STEP {step.step}
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

        {/* Curated Trip Presets */}
        <div id="presets" className="mt-12 pt-8 border-t border-slate-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Curated Escapes (Tap to Pre-Fill Itinerary)
              </h3>
              <p className="text-xs text-slate-400">
                Quick-start an itinerary with proven scenic routes, stays, and
                travel vibes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {siteContent.presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() =>
                  onSelectPreset?.({
                    startingCity: preset.startingCity,
                    hotel: preset.hotel,
                    days: preset.days,
                    interests: preset.interests,
                    pace: preset.pace as "relaxed" | "moderate" | "fast",
                    transport: preset.transport,
                  })
                }
                className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-teal-400/50 hover:bg-slate-800/60 transition-all shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="teal" size="sm">
                    {preset.badge}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    {preset.days} Days
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-white group-hover:text-teal-300 transition-colors">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {preset.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-teal-400 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">
                    Start: {preset.startingCity}
                  </span>
                  <span className="font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Load Route <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
