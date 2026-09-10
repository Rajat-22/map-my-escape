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
