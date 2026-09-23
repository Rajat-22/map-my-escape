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

/**
 * One colour per day, used by BOTH the map route line and the itinerary list so
 * Day 3 on the map is visibly the same Day 3 in the list.
 *
 * Each entry carries two forms of the same colour:
 *   hex        — for Leaflet, which draws SVG paths and needs a raw colour
 *   solid/muted— Tailwind class strings for the UI (active tab, day badge)
 *
 * Keeping them in one place is the point: the list previously hard-coded sky
 * blue for every day, so only Day 1 (whose route colour happens to be sky) ever
 * looked like it matched the map.
 */
export const DAY_COLORS: Array<{
  hex: string;
  /** Filled style: used when this day is the active selection. */
  solid: string;
  /** Tinted style: used for badges and unselected affordances. */
  muted: string;
}> = [
  {
    hex: "#38bdf8", // Day 1: Sky 400
    solid: "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20",
    muted: "bg-sky-500/20 border-sky-400/40 text-sky-300",
  },
  {
    hex: "#2dd4bf", // Day 2: Teal 400
    solid: "bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20",
    muted: "bg-teal-500/20 border-teal-400/40 text-teal-300",
  },
  {
    hex: "#fbbf24", // Day 3: Amber 400
    solid: "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20",
    muted: "bg-amber-500/20 border-amber-400/40 text-amber-300",
  },
  {
    hex: "#f43f5e", // Day 4: Rose 500
    solid: "bg-rose-500 text-white shadow-md shadow-rose-500/20",
    muted: "bg-rose-500/20 border-rose-400/40 text-rose-300",
  },
  {
    hex: "#a855f7", // Day 5: Purple 500
    solid: "bg-purple-500 text-white shadow-md shadow-purple-500/20",
    muted: "bg-purple-500/20 border-purple-400/40 text-purple-300",
  },
  {
    hex: "#34d399", // Day 6: Emerald 400
    solid: "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20",
    muted: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
  },
  {
    hex: "#60a5fa", // Day 7: Blue 400
    solid: "bg-blue-400 text-slate-950 shadow-md shadow-blue-500/20",
    muted: "bg-blue-500/20 border-blue-400/40 text-blue-300",
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
