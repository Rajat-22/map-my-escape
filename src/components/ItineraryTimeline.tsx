"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Clock,
  Compass,
  Lightbulb,
  MapPin,
  Navigation,
  Sparkles,
  Luggage,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Bookmark,
  BookmarkCheck,
  Shuffle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ItineraryData, ItineraryStop } from "@/types/itinerary";
import { getCategoryIcon, CATEGORY_COLOR_MAP, getDayColor } from "@/lib/icons";
import {
  saveItinerary,
  isItinerarySaved,
  removeSavedItinerary,
  subscribeToSavedItineraries,
} from "@/lib/storage";

export interface ItineraryTimelineProps {
  itinerary: ItineraryData;
  activeStopId?: string | null;
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
  onSelectStop?: (stop: ItineraryStop) => void;
  onModifyTrip?: () => void;
  onRemixTrip?: () => void;
  isRemixing?: boolean;
}

export default function ItineraryTimeline({
  itinerary,
  activeStopId,
  selectedDay: controlledSelectedDay,
  onSelectDay,
  onSelectStop,
  onModifyTrip,
  onRemixTrip,
  isRemixing = false,
}: ItineraryTimelineProps) {
  // Controlled or uncontrolled selected day (0 = All Days)
  const [internalSelectedDay, setInternalSelectedDay] = useState<number>(0);
  const selectedDay =
    controlledSelectedDay !== undefined
      ? controlledSelectedDay
      : internalSelectedDay;

  // Places the traveler explicitly asked to include, in a non-optional shape
  // so they can be rendered as chips without extra narrowing at each use.
  const mustVisitChips: string[] = itinerary.mustVisitPlaces ?? [];

  // Subscribe to storage changes with stable snapshot
  const isSaved = useSyncExternalStore(
    subscribeToSavedItineraries,
    () => isItinerarySaved(itinerary.id, itinerary.tripTitle),
    () => false
  );

  const handleToggleSave = () => {
    if (isSaved) {
      removeSavedItinerary(itinerary.id);
    } else {
      saveItinerary(itinerary);
    }
  };

  const handleDayChange = (dayNum: number) => {
    if (onSelectDay) {
      onSelectDay(dayNum);
    } else {
      setInternalSelectedDay(dayNum);
    }
  };

  // Filter stops by selected day
  const displayedDays =
    selectedDay === 0
      ? itinerary.days
      : itinerary.days.filter((d) => d.day === selectedDay);

  return (
    <div className="space-y-6">
      {/* 1. Header Card with Summary & Modify CTA */}
      <Card variant="glass" className="p-5 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {itinerary.tripTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              onClick={handleToggleSave}
              icon={
                isSaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-teal-400" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                )
              }
              className={isSaved ? "border-teal-500/40 bg-teal-950/20 text-teal-300" : ""}
            >
              {isSaved ? "Saved" : "Save Escape"}
            </Button>

            {onRemixTrip && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemixTrip}
                isLoading={isRemixing}
                icon={<Shuffle className="w-3.5 h-3.5 text-amber-400" />}
                className="hover:border-amber-500/40"
              >
                Remix
              </Button>
            )}


            <Button
              variant="secondary"
              size="sm"
              onClick={onModifyTrip}
              icon={<Edit3 className="w-3.5 h-3.5 text-sky-400" />}
            >
              Modify
            </Button>
          </div>
        </div>

        {/* Destination Summary */}
        <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {itinerary.destinationSummary}
        </p>

        {/* Quick Meta Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Pace:{" "}
              <strong className="text-slate-200 capitalize">
                {itinerary.pace}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Navigation className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Transport:{" "}
              <strong className="text-slate-200">{itinerary.transport}</strong>
            </span>
          </div>
        </div>

        {/* Must-visit places the traveler asked for, echoed back as chips */}
        {mustVisitChips.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              Your must-visits
            </span>
            {mustVisitChips.map((place) => (
              <span
                key={place}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-200 border-teal-500/40 text-[11px] font-medium"
              >
                <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                {place}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Day Selector Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => handleDayChange(0)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedDay === 0
              ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          All Days ({itinerary.totalDays})
        </button>

        {itinerary.days.map((day) => {
          const dayColor = getDayColor(day.day);
          const isActive = selectedDay === day.day;
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => handleDayChange(day.day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? dayColor.solid
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {/* A dot in this day's route colour, so an unselected tab is still
                  identifiable as the colour of its line on the map. */}
              {!isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dayColor.hex }}
                />
              )}
              <span>Day {day.day}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? "bg-slate-950/30 text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {day.stops.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Chronological Day-by-Day Timeline List */}
      <div className="space-y-6">
        {displayedDays.map((dayPlan) => (
          <div key={dayPlan.day} className="space-y-3">
            {/* Day Title & Theme Banner */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-lg border font-mono text-xs font-bold flex items-center justify-center ${getDayColor(dayPlan.day).muted}`}
                >
                  {dayPlan.day}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {dayPlan.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">{dayPlan.theme}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {dayPlan.stops.length} stops
              </span>
            </div>

            {/* Sequence of Stops for this Day. The left rail is tinted to the
                day's route colour, so the list and the map line agree. */}
            <div
              className="space-y-2.5 relative pl-4 border-l-2 ml-3"
              style={{ borderLeftColor: getDayColor(dayPlan.day).hex }}
            >
              {dayPlan.stops.map((stop, idx) => {
                const isActive = activeStopId === stop.id;
                const categoryColor =
                  CATEGORY_COLOR_MAP[stop.category] || CATEGORY_COLOR_MAP.other;

                return (
                  <div key={stop.id} className="relative group">
                    {/* Node Dot on Timeline */}
                    <div
                      className={`absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isActive
                          ? "bg-sky-400 border-white scale-125 shadow-lg shadow-sky-400/50"
                          : "bg-slate-900 border-slate-700 group-hover:border-sky-400"
                      }`}
                    />

                    {/* Transit Connector Note */}
                    {idx > 0 && stop.travelTimeFromPrevious && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 py-1 font-mono">
                        <Navigation className="w-3 h-3 text-teal-400" />
                        <span>{stop.travelTimeFromPrevious}</span>
                      </div>
                    )}

                    {/* Stop Detail Card */}
                    <div
                      onClick={() => onSelectStop?.(stop)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 select-none ${
                        isActive
                          ? "bg-slate-900/90 border-sky-400 shadow-xl shadow-sky-500/10 ring-1 ring-sky-400/30"
                          : "bg-slate-900/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80"
                      }`}
                    >
                      {/* Top Row: Time Badge, Category Badge & Duration */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700/80">
                            Stop {stop.order} &bull; {stop.timeOfDay}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
                          >
                            {getCategoryIcon(stop.category, "w-3 h-3")}
                            <span className="capitalize">{stop.category}</span>
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {stop.estimatedDuration}
                        </span>
                      </div>

                      {/* Stop Title */}
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors flex items-center justify-between">
                        <span>{stop.name}</span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isActive
                              ? "text-sky-400 translate-x-1"
                              : "text-slate-600 group-hover:translate-x-0.5"
                          }`}
                        />
                      </h4>

                      {/* Stop Description */}
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        {stop.description}
                      </p>

                      {/* Local Insider Tip Callout */}
                      {stop.insiderTip && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-amber-300 font-semibold">
                              Insider Tip:{" "}
                            </strong>
                            {stop.insiderTip}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Trip Highlights & Packing Intelligence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Journey Highlights */}
        {itinerary.highlights && itinerary.highlights.length > 0 && (
          <Card variant="glass" className="p-4 border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Route Highlights
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {itinerary.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sky-400 font-bold">&bull;</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Packing Checklist */}
        {itinerary.packingTips && itinerary.packingTips.length > 0 && (
          <Card variant="glass" className="p-4 border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Luggage className="w-3.5 h-3.5 text-teal-400" />
              Essential Packing
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {itinerary.packingTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
