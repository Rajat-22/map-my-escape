﻿"use client";

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
import { localization, t } from "@/lib/localization";
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
  onSaveChange?: (isSaved: boolean) => void;
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
  onSaveChange,
}: ItineraryTimelineProps) {
  const [internalSelectedDay, setInternalSelectedDay] = useState<number>(1);
  const selectedDay =
    controlledSelectedDay !== undefined
      ? controlledSelectedDay
      : internalSelectedDay;

  const mustVisitChips: string[] = itinerary.mustVisitPlaces ?? [];

  const isSaved = useSyncExternalStore(
    subscribeToSavedItineraries,
    () => isItinerarySaved(itinerary.id, itinerary.tripTitle),
    () => false
  );

  const handleToggleSave = () => {
    const nextSaved = !isSaved;
    if (isSaved) {
      removeSavedItinerary(itinerary.id);
    } else {
      saveItinerary(itinerary);
    }
    onSaveChange?.(nextSaved);
  };

  const handleDayChange = (dayNum: number) => {
    if (onSelectDay) {
      onSelectDay(dayNum);
    } else {
      setInternalSelectedDay(dayNum);
    }
  };

  const displayedDays = (() => {
    const match = itinerary.days.filter((d) => d.day === selectedDay);
    if (match.length > 0) return match;
    return itinerary.days.length > 0 ? [itinerary.days[0]] : [];
  })();

  return (
    <div className="relative space-y-6">
      <Card
        variant="glass"
        className="p-5 border-teal-500/30 bg-teal-950/25 ring-1 ring-teal-400/10 shadow-xl shadow-teal-950/40"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-teal-500/20">
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
              {isSaved ? localization.common.saved : localization.timeline.saveEscape}
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
                {localization.timeline.remix}
              </Button>
            )}


            <Button
              variant="secondary"
              size="sm"
              onClick={onModifyTrip}
              icon={<Edit3 className="w-3.5 h-3.5 text-sky-400" />}
            >
              {localization.timeline.modify}
            </Button>
          </div>
        </div>

        {/* Destination Summary */}
        <p className="mt-3 text-xs sm:text-sm text-teal-50/80 leading-relaxed">
          {itinerary.destinationSummary}
        </p>

        {/* Quick Meta Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-teal-500/20 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/50 border border-teal-500/25">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {localization.timeline.pacePrefix}{" "}
              <strong className="text-slate-100 capitalize">
                {itinerary.pace}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/50 border border-teal-500/25">
            <Navigation className="w-3.5 h-3.5 text-teal-300" />
            <span>
              {localization.timeline.transportPrefix}{" "}
              <strong className="text-slate-100">{itinerary.transport}</strong>
            </span>
          </div>
        </div>

        {/* Must-visit places the traveler asked for, echoed back as chips */}
        {mustVisitChips.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              {localization.timeline.mustVisitsLabel}
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

      {/* 2. Day Selector Tabs — one tab per day; there is no "all days" view. */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">

        {itinerary.days.map((day) => {
          const dayColor = getDayColor(day.day);
          const isActive = selectedDay === day.day;
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => handleDayChange(day.day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                isActive
                  ? dayColor.solid
                  : "bg-teal-950/40 text-teal-200/80 border-teal-500/20 hover:text-white hover:border-teal-400/50"
              }`}
            >

              {!isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dayColor.hex }}
                />
              )}
              <span>{t(localization.timeline.dayTab, { day: day.day })}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? "bg-slate-950/30 text-slate-950"
                    : "bg-slate-900/60 text-teal-200/70"
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
                  <p className="text-[11px] text-teal-100/60">{dayPlan.theme}</p>
                </div>
              </div>
              <span className="text-xs text-teal-100/50 font-mono">
                {dayPlan.stops.length} {localization.common.stops}
              </span>
            </div>

            <div
              className="space-y-2.5 relative pl-4 border-l-2 ml-3"
              style={{ borderLeftColor: getDayColor(dayPlan.day).hex }}
            >
              {dayPlan.stops.map((stop, idx) => {
                const isActive = activeStopId === stop.id;
                const categoryColor =
                  CATEGORY_COLOR_MAP[stop.category] || CATEGORY_COLOR_MAP.other;
                const dayColor = getDayColor(dayPlan.day);

                return (
                  <div key={stop.id} className="relative group">
                    {/* Node Dot on Timeline — carries the day's colour so the
                        selected day's circles match its tab and rail. */}
                    <div
                      className={`absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isActive ? "scale-125 shadow-lg" : "group-hover:scale-110"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: dayColor.hex,
                              borderColor: "#ffffff",
                              boxShadow: `0 0 10px ${dayColor.hex}`,
                            }
                          : {
                              backgroundColor: "#020617",
                              borderColor: dayColor.hex,
                            }
                      }
                    />

                    {/* Transit Connector Note */}
                    {idx > 0 && stop.travelTimeFromPrevious && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 py-1 font-mono">
                        <Navigation className="w-3 h-3 text-teal-400" />
                        <span>{stop.travelTimeFromPrevious}</span>
                      </div>
                    )}

                    {/* Stop Detail Card — when this stop is the active one its
                        border and glow take the DAY's colour, so a Day 3 stop
                        rings amber, a Day 2 stop violet, and so on. */}
                    <div
                      onClick={() => onSelectStop?.(stop)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 select-none backdrop-blur-sm ${
                        isActive
                          ? "bg-teal-800/45 shadow-xl"
                          : "bg-teal-950/45 border-teal-500/20 hover:bg-teal-900/45"
                      }`}
                      style={
                        isActive
                          ? {
                              borderColor: dayColor.hex,
                              boxShadow: `0 0 0 1px ${dayColor.hex}, 0 8px 24px -8px ${dayColor.hex}`,
                            }
                          : undefined
                      }
                    >
                      {/* Top Row: Time Badge, Category Badge & Duration */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-950/60 text-teal-100/90 font-semibold border border-teal-500/30">
                            {t(localization.timeline.stopBadge, {
                              order: stop.order,
                              timeOfDay: stop.timeOfDay,
                            })}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
                          >
                            {getCategoryIcon(stop.category, "w-3 h-3")}
                            <span className="capitalize">{stop.category}</span>
                          </span>
                        </div>

                        <span className="text-[11px] text-teal-100/60 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-400/70" />
                          {stop.estimatedDuration}
                        </span>
                      </div>

                      {/* Stop Title */}
                      <h4
                        className="text-sm font-bold text-white transition-colors flex items-center justify-between"
                        style={isActive ? { color: dayColor.hex } : undefined}
                      >
                        <span>{stop.name}</span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isActive
                              ? "translate-x-1"
                              : "text-teal-500/50 group-hover:translate-x-0.5"
                          }`}
                          style={isActive ? { color: dayColor.hex } : undefined}
                        />
                      </h4>

                      {/* Stop Description */}
                      <p className="mt-1 text-xs text-teal-100/70 leading-relaxed">
                        {stop.description}
                      </p>

                      {/* Local Insider Tip Callout */}
                      {stop.insiderTip && (
                        <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-start gap-1.5 text-[11px] text-amber-200/90 bg-amber-400/10 px-2.5 py-1.5 rounded-lg border">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-amber-300 font-semibold">
                              {localization.timeline.insiderTip}{" "}
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
          <Card
            variant="glass"
            className="p-4 border-teal-500/25 bg-teal-950/25 shadow-lg shadow-teal-950/30"
          >
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {localization.timeline.highlightsTitle}
            </h4>
            <ul className="space-y-1.5 text-xs text-teal-50/80">
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
          <Card
            variant="glass"
            className="p-4 border-teal-500/25 bg-teal-950/25 shadow-lg shadow-teal-950/30"
          >
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Luggage className="w-3.5 h-3.5 text-teal-400" />
              {localization.timeline.packingTitle}
            </h4>
            <ul className="space-y-1.5 text-xs text-teal-50/80">
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
