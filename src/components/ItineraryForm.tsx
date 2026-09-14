"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  X,
  Calendar,
  Gauge,
  Compass,
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
  Car,
  Footprints as Walk,
  RotateCcw,
  Send,
  Sliders,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import siteContent from "@/data/siteContent.json";
import { TripRequest } from "@/types/itinerary";

export interface ItineraryFormProps {
  initialValues?: TripRequest | null;
  onSubmit?: (data: TripRequest) => void;
  isLoading?: boolean;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
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
};

const TRANSPORT_OPTIONS = [
  { label: "Walking & TukTuk", icon: Walk },
  { label: "Rented Scooter", icon: Compass },
  { label: "Cab / Taxi", icon: Car },
  { label: "Self-Drive Car", icon: Car },
];

const PACE_OPTIONS: Array<{
  value: "relaxed" | "moderate" | "fast";
  label: string;
  description: string;
}> = [
  { value: "relaxed", label: "Relaxed", description: "1-2 stops/day, leisurely vibe" },
  { value: "moderate", label: "Moderate", description: "3-4 stops/day, balanced pace" },
  { value: "fast", label: "Action-Packed", description: "5+ stops/day, high energy" },
];

export default function ItineraryForm({
  initialValues,
  onSubmit,
  isLoading = false,
}: ItineraryFormProps) {
  const [startingCity, setStartingCity] = useState(
    () => initialValues?.startingCity ?? ""
  );
  const [places, setPlaces] = useState<string[]>(
    () => initialValues?.mustVisitPlaces ?? []
  );
  const [placeInput, setPlaceInput] = useState("");
  const [days, setDays] = useState(() => initialValues?.days ?? 3);
  const [interests, setInterests] = useState<string[]>(
    () => initialValues?.interests ?? []
  );
  const [pace, setPace] = useState<"relaxed" | "moderate" | "fast">(
    () => initialValues?.pace ?? "moderate"
  );
  const [transport, setTransport] = useState(
    () => initialValues?.transport ?? "Scooter & Local Cab"
  );
  const [customNotes, setCustomNotes] = useState(
    () => initialValues?.customNotes ?? ""
  );

  const addPlace = (rawPlace: string) => {
    const place = rawPlace.trim();
    if (!place) return;
    setPlaces((prev) =>
      prev.some((p) => p.toLowerCase() === place.toLowerCase()) ? prev : [...prev, place]
    );
    setPlaceInput("");
  };

  const removePlace = (place: string) => {
    setPlaces((prev) => prev.filter((p) => p !== place));
  };

  const toggleInterest = (interestId: string) => {
    setInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleReset = () => {
    setStartingCity("");
    setPlaces([]);
    setPlaceInput("");
    setDays(3);
    setInterests([]);
    setPace("moderate");
    setTransport("Walking & TukTuk");
    setCustomNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startingCity.trim()) return;

    // Pick up any half-typed place so the user never loses their input.
    const pendingPlace = placeInput.trim();
    const finalPlaces = !pendingPlace
      ? places
      : places.some((p) => p.toLowerCase() === pendingPlace.toLowerCase())
        ? places
        : [...places, pendingPlace];

    onSubmit?.({
      startingCity: startingCity.trim(),
      mustVisitPlaces: finalPlaces.length > 0 ? finalPlaces : undefined,
      days,
      interests: interests.length > 0 ? interests : ["cafe", "viewpoint"],
      pace,
      transport,
      customNotes: customNotes.trim() || undefined,
    });
  };

  return (
    <Card variant="glass" className="p-6 border-slate-800">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Title & Reset */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              Configure Your Escape
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize starting point, travel vibes, and daily rhythm.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* 1. Starting City & Must-Visit Places */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-400" />
              Starting Location / City <span className="text-rose-400">*</span>
            </label>

            <input
              type="text"
              required
              value={startingCity}
              onChange={(e) => setStartingCity(e.target.value)}
              placeholder="Enter your city or starting point"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-400" />
                Places You Want To Visit ({places.length} added)
              </label>
              <span className="text-[11px] text-slate-500">
                Cafes, temples, viewpoints &mdash; anything
              </span>
            </div>

            <div className="flex items-stretch gap-2">
              <input
                type="text"
                value={placeInput}
                onChange={(e) => setPlaceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addPlace(placeInput);
                  } else if (
                    e.key === "Backspace" &&
                    !placeInput &&
                    places.length > 0
                  ) {
                    removePlace(places[places.length - 1]);
                  }
                }}
                placeholder="e.g. Hadimba Temple, Cafe 1947, Solang Valley"
                autoComplete="off"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => addPlace(placeInput)}
                disabled={!placeInput.trim()}
                aria-label="Add place"
                className="px-3.5 rounded-xl bg-teal-500/20 text-teal-300 border-teal-500/60 hover:bg-teal-500/30 hover:border-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Added places rendered as removable chips */}
            {places.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {places.map((place) => (
                  <span
                    key={place}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-teal-500/15 text-teal-200 border-teal-500/50 text-xs font-medium max-w-full"
                  >
                    <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                    <span className="truncate">{place}</span>
                    <button
                      type="button"
                      onClick={() => removePlace(place)}
                      aria-label={`Remove ${place}`}
                      className="shrink-0 rounded-full p-0.5 text-teal-300/70 hover:text-white hover:bg-teal-500/40 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-2">
                Add the exact spots you don&apos;t want to miss &mdash; they&apos;ll
                be scheduled into your itinerary automatically.
              </p>
            )}
          </div>
        </div>

        {/* 2. Travel Vibes (Interactive Tag Badges) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Select Your Travel Vibes ({interests.length} selected)
            </label>
            <span className="text-[11px] text-slate-500">
              {interests.length === 0 ? "Tap to pick your interests" : "Tap to toggle"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {siteContent.categories.map((category) => {
              const isSelected = interests.includes(category.id);
              const IconComp = CATEGORY_ICON_MAP[category.icon] || Compass;

              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => toggleInterest(category.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? "bg-sky-500/20 text-sky-300 border border-sky-400 shadow-sm shadow-sky-500/20"
                      : "bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <IconComp
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "text-sky-400" : "text-slate-500"
                    }`}
                  />
                  <span>{category.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 ml-0.5 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Number of Days & Travel Pace */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Duration
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                {days} {days === 1 ? "Day" : "Days"}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={7}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>1d</span>
              <span>3d</span>
              <span>5d</span>
              <span>7d</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-teal-400" />
              Travel Pace
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PACE_OPTIONS.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setPace(item.value)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                    pace === item.value
                      ? "bg-teal-500/20 text-teal-300 border border-teal-400"
                      : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Transport Mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Car className="w-4 h-4 text-emerald-400" />
            Preferred Transport
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TRANSPORT_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = transport === opt.label;
              return (
                <button
                  type="button"
                  key={opt.label}
                  onClick={() => setTransport(opt.label)}
                  className={`p-2 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400"
                      : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span className="text-[11px] truncate w-full text-center">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Custom Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Special Requests / Custom Notes (Optional)
          </label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Vegetarian food only, love photography spots, prefer quiet mornings..."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* 6. Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full shadow-lg shadow-sky-500/20 cursor-pointer"
            isLoading={isLoading}
            icon={<Send className="w-4 h-4" />}
          >
            Generate AI Escape Route
          </Button>

          <p className="text-center text-[11px] text-slate-500 mt-2">
            Sequences day plans, travel times, and plots live coordinates on the map.
          </p>
        </div>
      </form>
    </Card>
  );
}

