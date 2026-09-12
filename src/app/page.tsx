"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import ItineraryForm from "@/components/ItineraryForm";
import ItineraryTimeline from "@/components/ItineraryTimeline";
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
  const planSectionRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<TripRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentItinerary, setCurrentItinerary] =
    useState<ItineraryData | null>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isModifyingForm, setIsModifyingForm] = useState(false);

  const [lastSubmittedRequest, setLastSubmittedRequest] =
    useState<TripRequest | null>(null);
  const [isRemixing, setIsRemixing] = useState(false);

  const handleSelectPreset = (preset: TripRequest) => {
    setActivePreset(preset);
    // Smooth scroll down to the form area
    planSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartPlanning = () => {
    planSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFormSubmit = async (request: TripRequest) => {
    setIsGenerating(true);
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
    }
  };

  const handleRemixTrip = async () => {
    if (!lastSubmittedRequest && !currentItinerary) return;
    setIsRemixing(true);

    const baseRequest: TripRequest = lastSubmittedRequest || {
      startingCity: currentItinerary!.startingCity,
      hotel: currentItinerary!.hotel,
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
      <Header
        onSelectPreset={handleSelectPreset}
        onStartPlanning={handleStartPlanning}
      />

      {/* Main Workspace Section */}
      <main
        id="plan-section"
        ref={planSectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form / Timeline */}
          <div className="lg:col-span-5 space-y-6">
            {currentItinerary && !isModifyingForm ? (
              <ItineraryTimeline
                itinerary={currentItinerary}
                activeStopId={activeStopId}
                selectedDay={selectedDay}
                onSelectDay={(day) => setSelectedDay(day)}
                onSelectStop={(stop: ItineraryStop) => setActiveStopId(stop.id)}
                onModifyTrip={() => setIsModifyingForm(true)}
                onRemixTrip={handleRemixTrip}
                isRemixing={isRemixing}
              />
            ) : (
              <ItineraryForm
                key={
                  activePreset
                    ? `${activePreset.startingCity}-${activePreset.days}-${activePreset.interests.join(",")}`
                    : "default-form"
                }
                initialValues={activePreset}
                onSubmit={handleFormSubmit}
                isLoading={isGenerating}
              />
            )}
          </div>

          {/* Right Column: Real-Time Map */}
          <div className="lg:col-span-7">
            <div className="sticky top-24 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl h-[580px]">
              <MapComponent
                stops={currentItinerary?.stops || []}
                activeStopId={activeStopId}
                selectedDay={selectedDay}
                onSelectStop={(stop) => setActiveStopId(stop.id)}
              />
            </div>
          </div>
        </div>
      </main>

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
