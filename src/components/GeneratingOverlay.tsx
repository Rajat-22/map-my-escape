"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { localization, t } from "@/lib/localization";
import "@/styles/generating-overlay.css";
import {
  Sun,
  Cloud,
  Mountain,
  Trees,
  Waves,
  Bird,
  type LucideIcon,
} from "lucide-react";

export interface GeneratingOverlayProps {
  mustVisitPlaces?: string[];
  startingCity?: string;
  interests?: string[];
  mode?: "generate" | "remix";
}

const MESSAGE_INTERVAL_MS = 2400;

const ICON_INTERVAL_MS = 1500;

const ICONS: Array<{ Icon: LucideIcon; tone: string }> = [
  { Icon: Sun, tone: "text-amber-300" },
  { Icon: Cloud, tone: "text-slate-200" },
  { Icon: Mountain, tone: "text-indigo-300" },
  { Icon: Trees, tone: "text-emerald-400" },
  { Icon: Waves, tone: "text-cyan-300" },
  { Icon: Bird, tone: "text-sky-300" },
];

export default function GeneratingOverlay({
  mustVisitPlaces = [],
  startingCity,
  interests = [],
  mode = "generate",
}: GeneratingOverlayProps) {
  const city = startingCity?.trim() || localization.generatingOverlay.defaultCity;
  const places = useMemo(
    () => mustVisitPlaces.map((p) => p.trim()).filter(Boolean),
    [mustVisitPlaces]
  );

  const messages = useMemo(() => {
    const overlay = localization.generatingOverlay;
    const list: string[] =
      mode === "remix" ? [...overlay.remixMessages] : [...overlay.generateMessages];

    if (places.length > 0) {
      list.push(
        ...places.map((place) => t(overlay.addingPlace, { place }))
      );
      list.push(overlay.fillingGapsWithPlaces);
    } else {
      list.push(
        overlay.scouting,
        overlay.handPicking,
        overlay.fillingDays
      );
    }

    if (interests.length > 0) {
      list.push(
        t(overlay.matchingVibes, { vibes: interests.slice(0, 3).join(", ") })
      );
    }

    list.push(
      t(overlay.drawingMap, { city }),
      overlay.sequencing,
      overlay.estimating,
      overlay.addingTips
    );

    return list;
  }, [places, interests, city, mode]);

  const [index, setIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [messages.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIconIndex((prev) => (prev + 1) % ICONS.length);
    }, ICON_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const { Icon, tone } = ICONS[iconIndex];

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-[3px] animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          {/* ---------- a. Cycling travel icon ----------*/}
          <div className="flex justify-center">
            <span
              key={iconIndex}
              className={`gen-icon inline-flex ${tone}`}
            >
              <Icon className="h-9 w-9" strokeWidth={1.5} />
            </span>
          </div>

          {/* ---------- b. Cycling status line ----------*/}
          <div className="mt-4 flex h-6 items-center justify-center">
            <p
              key={index}
              className="gen-msg px-2 text-center text-sm text-slate-100"
            >
              {messages[index]}
            </p>
          </div>

          {/* ---------- c. Progress bar ---------- */}
          <div className="mx-auto mt-5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-slate-800">
            <div className="gen-bar h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
