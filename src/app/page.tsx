﻿﻿"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import ModalDialog from "@/components/ModalDialog";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import ItineraryForm from "@/components/ItineraryForm";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { localization, t } from "@/lib/localization";
import { TripRequest, ItineraryData, ItineraryStop } from "@/types/itinerary";

// Dynamically load MapComponent to prevent window is not defined errors during SSR
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
        <span>{localization.homepage.mapLoading}</span>
      </div>
    </div>
  ),
});

export default function Home() {
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const handleClosePlanner = useCallback(() => setIsPlannerOpen(false), []);
  const [formInitialValues, setFormInitialValues] = useState<TripRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentItinerary, setCurrentItinerary] =
    useState<ItineraryData | null>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isModifyingForm, setIsModifyingForm] = useState(false);

  const [lastSubmittedRequest, setLastSubmittedRequest] =
    useState<TripRequest | null>(null);
  const [isRemixing, setIsRemixing] = useState(false);

  // Drives the generating overlay. Held separately from `isGenerating` so the
  // overlay always has the request it is narrating, even on the first render
  // after submit (when `lastSubmittedRequest` and `isGenerating` both flip).
  const [generatingFor, setGeneratingFor] = useState<TripRequest | null>(null);

  // Which flow the overlay is narrating. A remix says "recalculating" instead
  // of "mapping", so the traveller knows their existing plan is being reshuffled
  // rather than built from scratch.
  const [generatingMode, setGeneratingMode] = useState<"generate" | "remix">(
    "generate"
  );

  // Shown when generation fails outright. There is deliberately NO fallback
  // itinerary: a template plan presented as a real route would be worse than
  // an honest error, so the traveller is told to try again instead.
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleStartPlanning = () => {
    setIsPlannerOpen(true);
  };

  const handleFormSubmit = async (request: TripRequest) => {
    setIsGenerating(true);
    setGeneratingMode("generate");
    setGeneratingFor(request);
    setLastSubmittedRequest(request);
    setGenerationError(null);
    const startedAt = Date.now();

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await res.json().catch(() => null);
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);

      if (res.ok && data?.itinerary) {
        console.log(`[itinerary] generated in ${elapsed}s (${data.source})`);
        setCurrentItinerary(data.itinerary);
        setIsModifyingForm(false);
        setSelectedDay(0);
        if (data.itinerary.stops?.length > 0) {
          setActiveStopId(data.itinerary.stops[0].id);
        }
      } else {
        // No fallback: surface the server's message (or a sensible default).
        console.warn(`[itinerary] failed after ${elapsed}s:`, data?.error);
        setGenerationError(
          data?.error || localization.homepage.errorGenerateFallback,
        );
      }
    } catch (err) {
      console.warn("Itinerary request failed:", err);
      setGenerationError(localization.homepage.errorUnreachable);
    } finally {
      setIsGenerating(false);
      setGeneratingFor(null);
    }
  };

  const handleRemixTrip = async () => {
    if (!lastSubmittedRequest && !currentItinerary) return;
    setIsRemixing(true);

    const baseRequest: TripRequest = lastSubmittedRequest || {
      startingCity: currentItinerary!.startingCity,
      mustVisitPlaces: currentItinerary!.mustVisitPlaces,
      days: currentItinerary!.totalDays,
      interests: ["cafe", "trek", "mountain"],
      pace: currentItinerary!.pace,
      transport: currentItinerary!.transport,
    };

    const variationRequest: TripRequest = {
      ...baseRequest,
      variationSeed: Date.now(),
    };

    // Show the same generating overlay as a first submit, so a remix reads as
    // "recalculating" rather than the UI just freezing. `generatingFor` is what
    // the overlay renders from, so it must be set here too — not only in
    // handleFormSubmit.
    setGeneratingMode("remix");
    setGeneratingFor(variationRequest);
    setGenerationError(null);
    const startedAt = Date.now();

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variationRequest),
      });

      const data = await res.json().catch(() => null);
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);

      if (res.ok && data?.itinerary) {
        console.log(`[itinerary] remix generated in ${elapsed}s (${data.source})`);
        setCurrentItinerary(data.itinerary);
        setSelectedDay(0);
        if (data.itinerary.stops?.length > 0) {
          setActiveStopId(data.itinerary.stops[0].id);
        }
      } else {
        console.warn(`[itinerary] remix failed after ${elapsed}s:`, data?.error);
        setGenerationError(
          data?.error || localization.homepage.errorRemixFallback,
        );
      }
    } catch (err) {
      console.warn("Remix request failed:", err);
      setGenerationError(localization.homepage.errorUnreachable);
    } finally {
      setIsRemixing(false);
      setGeneratingFor(null);
    }
  };

  // Stepping back from the modify form without changing anything: show the
  // itinerary that is still loaded, exactly as it was.
  const handleCancelModify = () => {
    if (!currentItinerary) return;
    setIsModifyingForm(false);
    setFormInitialValues(null);
    setSelectedDay(0);
    if (currentItinerary.stops?.length > 0) {
      setActiveStopId(currentItinerary.stops[0].id);
    }
  };

  // Resetting the form means the traveller is starting over: drop the previous
  // itinerary so the map stops plotting a route that no longer matches the form.
  const handleFormReset = () => {
    setCurrentItinerary(null);
    setLastSubmittedRequest(null);
    setActiveStopId(null);
    setSelectedDay(0);
    setGenerationError(null);
  };

  const handleSelectSavedItinerary = (saved: ItineraryData) => {
    setCurrentItinerary(saved);
    setLastSubmittedRequest(null);
    setIsPlannerOpen(true);
    setIsModifyingForm(false);
    setSelectedDay(0);
    if (saved.stops?.length > 0) {
      setActiveStopId(saved.stops[0].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar onSelectSavedItinerary={handleSelectSavedItinerary} />

      {/* Brand Header */}
      <Header onStartPlanning={handleStartPlanning} />

      {/* The planner exists only inside the dialog, never below the landing page. */}
      <ModalDialog
        isOpen={isPlannerOpen}
        onClose={handleClosePlanner}
        title={localization.homepage.plannerTitle}
        subtitle={localization.homepage.plannerSubtitle}
        showOkButton={!!currentItinerary && !isModifyingForm}
        footerLeft={
          isModifyingForm && currentItinerary ? (
            <button
              type="button"
              onClick={handleCancelModify}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              {localization.homepage.backToItinerary}
            </button>
          ) : undefined
        }
      >
        {/* `relative` anchors the generating overlay so it greys out the entire
            planner — form and map — while a request is in flight.

            Driven by `generatingFor` rather than `isGenerating`, because a
            remix sets the former but not the latter — and the overlay needs the
            request in both flows so it can name the traveller's own places. */}
        <div className="relative">
          {/* Generation failed. There is no fallback plan, so tell the traveller
              plainly and let them retry rather than showing invented data. */}
          {generationError && !generatingFor && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 flex-wrap rounded-xl border-rose-500/40 bg-rose-500/10 px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-rose-200">
                  {localization.homepage.errorTitle}
                </p>
                <p className="mt-0.5 text-xs text-rose-200/80">{generationError}</p>
              </div>
              <button
                type="button"
                onClick={() => setGenerationError(null)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/20 hover:text-white cursor-pointer"
              >
                {localization.common.dismiss}
              </button>
            </div>
          )}
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {generatingFor && (
            <GeneratingOverlay
              mustVisitPlaces={generatingFor.mustVisitPlaces}
              startingCity={generatingFor.startingCity}
              interests={generatingFor.interests}
              mode={generatingMode}
            />
          )}
          {/* Left Column: Form / Timeline */}
          <div className="min-w-0 lg:col-span-5 space-y-6">
            {currentItinerary && !isModifyingForm ? (
              <ItineraryTimeline
                itinerary={currentItinerary}
                activeStopId={activeStopId}
                selectedDay={selectedDay}
                onSelectDay={(day) => setSelectedDay(day)}
                onSelectStop={(stop: ItineraryStop) => setActiveStopId(stop.id)}
                onModifyTrip={() => {
                  setFormInitialValues(lastSubmittedRequest || {
                    startingCity: currentItinerary.startingCity,
                    mustVisitPlaces: currentItinerary.mustVisitPlaces,
                    days: currentItinerary.totalDays,
                    interests: [...new Set(currentItinerary.stops.map((stop) => stop.category))],
                    pace: currentItinerary.pace,
                    transport: currentItinerary.transport,
                  });
                  setIsModifyingForm(true);
                }}
                onRemixTrip={handleRemixTrip}
                isRemixing={isRemixing}
              />
            ) : (
              <ItineraryForm
                key={
                  formInitialValues
                    ? `${formInitialValues.startingCity}-${formInitialValues.days}-${formInitialValues.interests.join(",")}-${(formInitialValues.mustVisitPlaces ?? []).join(",")}`
                    : "default-form"
                }
                initialValues={formInitialValues}
                onSubmit={handleFormSubmit}
                onReset={handleFormReset}
                isLoading={isGenerating}
              />
            )}
          </div>

          {/* Right Column: Real-Time Map */}
          <div className="min-w-0 lg:col-span-7 lg:sticky lg:top-0">
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl h-[480px] lg:h-[580px]">
              <MapComponent
                stops={currentItinerary?.stops || []}
                activeStopId={activeStopId}
                selectedDay={selectedDay}
                onSelectStop={(stop) => setActiveStopId(stop.id)}
              />
            </div>
          </div>
        </div>
      </ModalDialog>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>{t(localization.footer.copyright, { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
