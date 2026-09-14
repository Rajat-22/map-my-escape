"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import ModalDialog from "@/components/ModalDialog";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import ItineraryForm from "@/components/ItineraryForm";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import { TripRequest, ItineraryData, ItineraryStop } from "@/types/itinerary";

// Dynamically load MapComponent to prevent window is not defined errors during SSR
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
        <span>Loading Real Map...</span>
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

  const handleStartPlanning = () => {
    setIsPlannerOpen(true);
  };

  const handleFormSubmit = async (request: TripRequest) => {
    setIsGenerating(true);
    setGeneratingFor(request);
    setLastSubmittedRequest(request);
    console.log("Submitting Escape Request:", request);
    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.itinerary) {
          setCurrentItinerary(data.itinerary);
          setIsModifyingForm(false);
          setSelectedDay(0);
          if (data.itinerary.stops?.length > 0) {
            setActiveStopId(data.itinerary.stops[0].id);
          }
        }
      }
    } catch (err) {
      console.warn("Itinerary API not yet fully connected:", err);
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

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variationRequest),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.itinerary) {
          setCurrentItinerary(data.itinerary);
          setSelectedDay(0);
          if (data.itinerary.stops?.length > 0) {
            setActiveStopId(data.itinerary.stops[0].id);
          }
        }
      }
    } catch (err) {
      console.warn("Remix failed:", err);
    } finally {
      setIsRemixing(false);
    }
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
      <Navbar
        onSelectSavedItinerary={handleSelectSavedItinerary}
        onOpenPlanner={handleStartPlanning}
      />

      {/* Brand Header */}
      <Header onStartPlanning={handleStartPlanning} />

      {/* The planner exists only inside the dialog, never below the landing page. */}
      <ModalDialog
        isOpen={isPlannerOpen}
        onClose={handleClosePlanner}
        title="AI Escape Route Planner"
        subtitle="Plan your trip and explore your itinerary without leaving this dialog."
        showOkButton={!!currentItinerary && !isModifyingForm}
      >
        {/* `relative` anchors the generating overlay so it greys out the entire
            planner — form and map — while a request is in flight. */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {isGenerating && (
            <GeneratingOverlay
              mustVisitPlaces={generatingFor?.mustVisitPlaces}
              startingCity={generatingFor?.startingCity}
              interests={generatingFor?.interests}
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
        <p>
          MapMyEscape &copy; {new Date().getFullYear()} &mdash; Dynamic AI
          Travel Routes & Real-Time Geospatial Visualization
        </p>
      </footer>
    </div>
  );
}
