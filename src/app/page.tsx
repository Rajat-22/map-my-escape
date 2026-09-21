﻿﻿"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import ModalDialog from "@/components/ModalDialog";
import Header from "@/components/Header";
import HomePage from "@/components/HomePage";
import ItineraryForm from "@/components/ItineraryForm";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import Toast from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { localization, t } from "@/lib/localization";
import { generateItinerary } from "@/lib/itineraryService";
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

  // Non-destructive close: hides the dialog but keeps the session, so reopening
  // restores the itinerary. Used by "Done", the X button, ESC and the backdrop.
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

    const result = await generateItinerary(request, "generated");

    if (result.ok) {
      setCurrentItinerary(result.itinerary);
      setIsModifyingForm(false);
      setSelectedDay(0);
      if (result.itinerary.stops?.length > 0) {
        setActiveStopId(result.itinerary.stops[0].id);
      }
    } else {
      // No fallback: surface the server's message (or a sensible default).
      setGenerationError(
        result.error || localization.homepage.errorGenerateFallback,
      );
    }

    setIsGenerating(false);
    setGeneratingFor(null);
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

    const result = await generateItinerary(variationRequest, "remix generated");

    if (result.ok) {
      setCurrentItinerary(result.itinerary);
      setSelectedDay(0);
      if (result.itinerary.stops?.length > 0) {
        setActiveStopId(result.itinerary.stops[0].id);
      }
    } else {
      setGenerationError(
        result.error || localization.homepage.errorRemixFallback,
      );
    }

    setIsRemixing(false);
    setGeneratingFor(null);
  };

  const handleCancelModify = () => {
    if (!currentItinerary) return;
    setIsModifyingForm(false);
    setFormInitialValues(null);
    setSelectedDay(0);
    if (currentItinerary.stops?.length > 0) {
      setActiveStopId(currentItinerary.stops[0].id);
    }
  };

  const handleFormReset = () => {
    setCurrentItinerary(null);
    setLastSubmittedRequest(null);
    setActiveStopId(null);
    setSelectedDay(0);
    setGenerationError(null);
  };

  // "Discard & Close": abandon the whole session. Closes the dialog and clears
  // every piece of planner state, so reopening shows a fresh, empty form rather
  // than the itinerary or half-filled inputs the traveller just rejected.
  const handleDiscardSession = useCallback(() => {
    setIsPlannerOpen(false);
    setFormInitialValues(null);
    setIsModifyingForm(false);
    setCurrentItinerary(null);
    setLastSubmittedRequest(null);
    setActiveStopId(null);
    setSelectedDay(0);
    setGenerationError(null);
  }, []);

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
      <Header onSelectSavedItinerary={handleSelectSavedItinerary} />
      <HomePage onStartPlanning={handleStartPlanning} />
      <ModalDialog
        isOpen={isPlannerOpen}
        onClose={handleClosePlanner}
        /* The form view already renders its own "Configure Your Escape" heading, so
           the modal title is only shown alongside the itinerary, avoiding two
           stacked headings. */
        title={
          currentItinerary && !isModifyingForm
            ? localization.homepage.plannerTitle
            : undefined
        }
        subtitle={
          currentItinerary && !isModifyingForm
            ? localization.homepage.plannerSubtitle
            : undefined
        }
        showOkButton={!!currentItinerary && !isModifyingForm}
        /* "Done" keeps the itinerary and just closes; "Discard & Close"
           abandons the session and clears everything. */
        okButtonText={localization.common.done}
        cancelButtonText={localization.common.discardAndClose}
        onOk={handleClosePlanner}
        onCancel={handleDiscardSession}
        /* Compact chrome: the form carries its own submit, so the footer stays lean
           and the always-on ESC hint line is dropped. */
        compact
        /* The map is an edge-to-edge side panel so it touches the dialog's top,
           right and bottom corners instead of sitting in a padded, bordered box. */
        sidePanel={
          <MapComponent
            stops={currentItinerary?.stops || []}
            activeStopId={activeStopId}
            selectedDay={selectedDay}
            onSelectStop={(stop) => setActiveStopId(stop.id)}
          />
        }
        /* Below lg the map is not pinned above the fold — it is rendered at the
           end of the form so the traveller scrolls down to it. */
        mobilePanel={
          <MapComponent
            stops={currentItinerary?.stops || []}
            activeStopId={activeStopId}
            selectedDay={selectedDay}
            onSelectStop={(stop) => setActiveStopId(stop.id)}
          />
        }
        footerLeft={
          isModifyingForm && currentItinerary ? (
            <Button
              type="button"
              variant="subtle"
              onClick={handleCancelModify}
              icon={<ArrowLeft className="w-3.5 h-3.5 text-sky-400" />}
            >
              {localization.homepage.backToItinerary}
            </Button>
          ) : undefined
        }
      >

        <div className="relative">
          {generatingFor && (
            <GeneratingOverlay
              mustVisitPlaces={generatingFor.mustVisitPlaces}
              startingCity={generatingFor.startingCity}
              interests={generatingFor.interests}
              mode={generatingMode}
            />
          )}

          <div className="min-w-0 space-y-6">
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

        </div>
      </ModalDialog>
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>{t(localization.footer.copyright, { year: new Date().getFullYear() })}</p>
      </footer>

      {/* Transient failure notice. Fixed to the viewport so it is seen even
          though the traveller is scrolled down at the form/map when the
          generating overlay lifts. Shown only once the overlay is gone. */}
      <Toast
        message={generatingFor ? null : generationError}
        title={localization.homepage.errorTitle}
        onDismiss={() => setGenerationError(null)}
        closeLabel={localization.common.dismiss}
      />
    </div>
  );
}
