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
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { OptionButton } from "@/components/ui/OptionButton";
import siteContent from "@/data/siteContent.json";
import { localization, t } from "@/lib/localization";
import { normalizeTransport } from "@/lib/storage";
import { TripRequest } from "@/types/itinerary";

export interface ItineraryFormProps {
  initialValues?: TripRequest | null;
  onSubmit?: (data: TripRequest) => void;
  onReset?: () => void;
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
  { label: localization.form.transportOptions.walkingTuktuk, icon: Walk },
  { label: localization.form.transportOptions.scooter, icon: Compass },
  { label: localization.form.transportOptions.car, icon: Car },
];

const PACE_OPTIONS: Array<{
  value: "relaxed" | "moderate" | "fast";
  label: string;
  description: string;
}> = [
  {
    value: "relaxed",
    label: localization.form.paceOptions.relaxed.label,
    description: localization.form.paceOptions.relaxed.description,
  },
  {
    value: "moderate",
    label: localization.form.paceOptions.moderate.label,
    description: localization.form.paceOptions.moderate.description,
  },
  {
    value: "fast",
    label: localization.form.paceOptions.fast.label,
    description: localization.form.paceOptions.fast.description,
  },
];

export default function ItineraryForm({
  initialValues,
  onSubmit,
  onReset,
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
  const [transport, setTransport] = useState<string[]>(() => {
    const saved = initialValues?.transport;
    if (!saved) return [localization.form.transportOptions.walkingTuktuk];

    const normalized = normalizeTransport(
      Array.isArray(saved) ? saved.join(", ") : saved,
    );
    return normalized.split(",").map((s) => s.trim()).filter(Boolean);
  });
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

  // Transport is multi-select: a traveller may walk, then take a cab.
  const toggleTransport = (option: string) => {
    setTransport((prev) =>
      prev.includes(option)
        ? prev.filter((t) => t !== option)
        : [...prev, option]
    );
  };

  const handleReset = () => {
    setStartingCity("");
    setPlaces([]);
    setPlaceInput("");
    setDays(3);
    setInterests([]);
    setPace("moderate");
    setTransport([localization.form.transportOptions.walkingTuktuk]);
    setCustomNotes("");
    onReset?.();
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
      // Never submit an empty list: keep the traveller's picks, or fall back to
      // the default single mode so the AI always has transport to plan around.
      transport:
        transport.length > 0
          ? transport.join(", ")
          : localization.form.transportOptions.walkingTuktuk,
      customNotes: customNotes.trim() || undefined,
    });
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              {localization.form.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {localization.form.subtitle}
            </p>
          </div>

          <Button
            type="button"
            variant="reset"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {localization.common.reset}
          </Button>
        </div>

        <div className="space-y-4">
          <Field
            id="starting-city"
            label={localization.form.startingCityLabel}
            icon={<MapPin className="w-4 h-4 text-sky-400" />}
            required
            accent="sky"
            type="text"
            value={startingCity}
            onChange={(e) => setStartingCity(e.target.value)}
            placeholder={localization.form.startingCityPlaceholder}
          />

          <div className="w-full">
            <div className="flex w-full items-end gap-2">
              <Field
                id="place-input"
                label={t(localization.form.placesLabel, { count: places.length })}
                icon={<MapPin className="w-4 h-4 text-cyan-400" />}
                hint={localization.form.placesHint}
                accent="cyan"
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
                placeholder={localization.form.placesPlaceholder}
                autoComplete="off"
                className="flex-1 min-w-0"
              />
              <Button
                type="button"
                variant="teal"
                onClick={() => addPlace(placeInput)}
                disabled={!placeInput.trim()}
                aria-label={localization.common.addPlaceAria}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="shrink-0"
              >
                {localization.common.add}
              </Button>
            </div>

            {places.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {places.map((place) => (
                  <span
                    key={place}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-cyan-500/15 text-cyan-100 border-cyan-500/50 text-xs font-medium max-w-full"
                  >
                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{place}</span>
                    <button
                      type="button"
                      onClick={() => removePlace(place)}
                      aria-label={t(localization.common.removePlaceAria, { place })}
                      className="shrink-0 rounded-full p-0.5 text-cyan-200/70 hover:text-white hover:bg-cyan-500/40 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-2">
                {localization.form.placesEmptyHint}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t(localization.form.vibesLabel, { count: interests.length })}
            </label>
            <span className="text-[11px] text-slate-500">
              {interests.length === 0
                ? localization.form.vibesHintEmpty
                : localization.form.vibesHintToggle}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {siteContent.categories.map((category) => {
              const isSelected = interests.includes(category.id);
              const IconComp = CATEGORY_ICON_MAP[category.icon] || Compass;

              return (
                <OptionButton
                  key={category.id}
                  selected={isSelected}
                  accent="sky"
                  layout="row"
                  showActiveDot
                  onClick={() => toggleInterest(category.id)}
                  icon={
                    <IconComp
                      className={`w-3.5 h-3.5 ${
                        isSelected ? "text-sky-400" : "text-slate-500"
                      }`}
                    />
                  }
                >
                  {category.label}
                </OptionButton>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                {localization.form.durationLabel}
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                {days}{" "}
                {days === 1
                  ? localization.form.durationUnitSingular
                  : localization.form.durationUnitPlural}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={7}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
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
              <Gauge className="w-4 h-4 text-cyan-400" />
              {localization.form.paceLabel}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PACE_OPTIONS.map((item) => (
                <OptionButton
                  key={item.value}
                  selected={pace === item.value}
                  accent="cyan"
                  layout="plain"
                  onClick={() => setPace(item.value)}
                >
                  {item.label}
                </OptionButton>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-indigo-400" />
              {t(localization.form.transportLabel, { count: transport.length })}
            </label>
            <span className="text-[11px] text-slate-500">
              {transport.length === 0
                ? localization.form.transportHintEmpty
                : localization.form.transportHintToggle}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TRANSPORT_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              return (
                <OptionButton
                  key={opt.label}
                  selected={transport.includes(opt.label)}
                  accent="indigo"
                  layout="stack"
                  onClick={() => toggleTransport(opt.label)}
                  icon={<IconComp className="w-3.5 h-3.5" />}
                >
                  {opt.label}
                </OptionButton>
              );
            })}
          </div>
        </div>

        <Field
          id="custom-notes"
          label={localization.form.notesLabel}
          as="textarea"
          accent="violet"
          rows={2}
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder={localization.form.notesPlaceholder}
          controlClassName="resize-none"
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full shadow-lg shadow-indigo-500/25 cursor-pointer"
            isLoading={isLoading}
            icon={<Send className="w-4 h-4" />}
          >
            {localization.form.submit}
          </Button>

          <p className="text-center text-[11px] text-slate-500 mt-2">
            {localization.form.submitHint}
          </p>
        </div>
      </form>
    </div>
  );
}

