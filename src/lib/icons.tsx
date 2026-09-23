import React from "react";
import {
  Sparkles,
  Coffee,
  Footprints,
  Mountain,
  Droplets,
  Waves,
  Hotel,
  Eye,
  Castle,
  ShoppingBag,
  Compass,
  MapPin,
  Clock,
  Calendar,
  Navigation,
  RefreshCw,
  LucideIcon,
} from "lucide-react";
import { ItineraryCategory } from "@/types/itinerary";

export const DAY_COLORS: Array<{
  hex: string;
  solid: string;
  muted: string;
}> = [
  {
    hex: "#38bdf8", // Day 1: Sky 400
    solid: "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20",
    muted: "bg-sky-500/20 border-sky-400/40 text-sky-300",
  },
  {
    hex: "#a78bfa", // Day 2: Violet 400 — kept off teal so it never blends into the travel panel
    solid: "bg-violet-400 text-slate-950 shadow-md shadow-violet-500/20",
    muted: "bg-violet-500/20 border-violet-400/40 text-violet-300",
  },
  {
    hex: "#fbbf24", // Day 3: Amber 400
    solid: "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20",
    muted: "bg-amber-500/20 border-amber-400/40 text-amber-300",
  },
  {
    hex: "#fb7185", // Day 4: Rose 400
    solid: "bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20",
    muted: "bg-rose-500/20 border-rose-400/40 text-rose-300",
  },
  {
    hex: "#e879f9", // Day 5: Fuchsia 400
    solid: "bg-fuchsia-400 text-slate-950 shadow-md shadow-fuchsia-500/20",
    muted: "bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-300",
  },
  {
    hex: "#fb923c", // Day 6: Orange 400
    solid: "bg-orange-400 text-slate-950 shadow-md shadow-orange-500/20",
    muted: "bg-orange-500/20 border-orange-400/40 text-orange-300",
  },
  {
    hex: "#818cf8", // Day 7: Indigo 400
    solid: "bg-indigo-400 text-slate-950 shadow-md shadow-indigo-500/20",
    muted: "bg-indigo-500/20 border-indigo-400/40 text-indigo-300",
  },
];

/** Colours for a 1-based day number, wrapping for trips longer than the list. */
export function getDayColor(dayNumber: number) {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

export const CATEGORY_ICON_MAP: Record<ItineraryCategory, LucideIcon> = {
  temple: Sparkles,
  cafe: Coffee,
  trek: Footprints,
  mountain: Mountain,
  waterfall: Droplets,
  beach: Waves,
  hotel: Hotel,
  viewpoint: Eye,
  heritage: Castle,
  market: ShoppingBag,
  other: MapPin,
};

export const CATEGORY_COLOR_MAP: Record<
  ItineraryCategory,
  { bg: string; text: string; border: string; hex: string }
> = {
  temple: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    hex: "#f59e0b",
  },
  cafe: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    hex: "#f43f5e",
  },
  trek: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    hex: "#10b981",
  },
  mountain: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
    hex: "#0ea5e9",
  },
  waterfall: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    hex: "#06b6d4",
  },
  beach: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    hex: "#3b82f6",
  },
  hotel: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/30",
    hex: "#8b5cf6",
  },
  viewpoint: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    hex: "#f97316",
  },
  heritage: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    hex: "#eab308",
  },
  market: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/30",
    hex: "#ec4899",
  },
  other: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    hex: "#64748b",
  },
};

export function getCategoryIcon(
  category: ItineraryCategory,
  className = "w-4 h-4",
) {
  const IconComponent = CATEGORY_ICON_MAP[category] || MapPin;
  return <IconComponent className={className} />;
}

export {
  Sparkles,
  Coffee,
  Footprints,
  Mountain,
  Droplets,
  Waves,
  Hotel,
  Eye,
  Castle,
  ShoppingBag,
  Compass,
  MapPin,
  Clock,
  Calendar,
  Navigation,
  RefreshCw,
};
