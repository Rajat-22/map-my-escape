"use client";

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
  const handleClosePlanner = useCallback(() => setIsPlannerOpen(false), []);
  const [formInitialValues, setFormInitialValues] = useState<TripRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentItinerary, setCurrentItinerary] =
    useState<ItineraryData | null>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isModifyingForm, setIsModifyingForm] = useState(false);

  const [lastSubmittedRequest, setLastSubmittedRequest] =
    useState<TripRequest | null>(null);
  const [isRemixing, setIsRemixing] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<TripRequest | null>(null);
  const [generatingMode, setGeneratingMode] = useState<"generate" | "remix">(
    "generate"
  );
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const handleSaveChange = useCallback((isSaved: boolean) => {
    setSaveNotice(
      isSaved
        ? {
            title: localization.common.savedToastTitle,
            message: localization.common.savedToastMessage,
          }
        : {
            title: localization.common.removedToastTitle,
            message: localization.common.removedToastMessage,
          },
    );
  }, []);

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
      setSelectedDay(1);
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

    setGeneratingMode("remix");
    setGeneratingFor(variationRequest);
    setGenerationError(null);

    const result = await generateItinerary(variationRequest, "remix generated");

    if (result.ok) {
      setCurrentItinerary(result.itinerary);
      setSelectedDay(1);
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
    setSelectedDay(1);
    if (currentItinerary.stops?.length > 0) {
      setActiveStopId(currentItinerary.stops[0].id);
    }
  };

  const handleFormReset = () => {
    setCurrentItinerary(null);
    setLastSubmittedRequest(null);
    setActiveStopId(null);
    setSelectedDay(1);
    setGenerationError(null);
  };

  const handleDiscardSession = useCallback(() => {
    setIsPlannerOpen(false);
    setFormInitialValues(null);
    setIsModifyingForm(false);
    setCurrentItinerary(null);
    setLastSubmittedRequest(null);
    setActiveStopId(null);
    setSelectedDay(1);
    setGenerationError(null);
  }, []);

  const handleSelectSavedItinerary = (saved: ItineraryData) => {
    setCurrentItinerary(saved);
    setLastSubmittedRequest(null);
    setIsPlannerOpen(true);
    setIsModifyingForm(false);
    setSelectedDay(1);
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
        showOkButton
        okButtonText={localization.common.done}
        cancelButtonText={localization.common.discardAndClose}
        onOk={handleClosePlanner}
        onCancel={handleDiscardSession}
        compact
        contentTone={currentItinerary && !isModifyingForm ? "themed" : "default"}
        sidePanel={
          <MapComponent
            stops={currentItinerary?.stops || []}
            activeStopId={activeStopId}
            selectedDay={selectedDay}
            onSelectStop={(stop) => setActiveStopId(stop.id)}
          />
        }
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
              icon={<ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />}
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
                onSaveChange={handleSaveChange}
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
      <Toast
        message={generatingFor ? null : generationError}
        title={localization.homepage.errorTitle}
        onDismiss={() => setGenerationError(null)}
        closeLabel={localization.common.dismiss}
      />
      <Toast
        variant="success"
        message={saveNotice?.message ?? null}
        title={saveNotice?.title}
        onDismiss={() => setSaveNotice(null)}
        closeLabel={localization.common.dismiss}
      />
    </div>
  );
}
