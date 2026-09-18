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
  /** Places the traveller explicitly asked for, if any. */
  mustVisitPlaces?: string[];
  /** Resolved start point, used to name the destination in the copy. */
  startingCity?: string;
  /** Vibes the traveller picked — drives the fallback wording. */
  interests?: string[];
  /**
   * "generate" for a first submit, "remix" when reshuffling an existing plan.
   * A remix gets its own opening line so the traveller reads it as the app
   * recalculating what they already have, not starting over.
   */
  mode?: "generate" | "remix";
}

/** Cadence of the status text rotation, in ms. */
const MESSAGE_INTERVAL_MS = 2400;

/** Cadence of the icon rotation, in ms — a touch brisker than the text. */
const ICON_INTERVAL_MS = 1500;

/**
 * The icon reel. Each entry is one "scene" the eye moves through, tapping
 * through the parts of a trip in order: the sun you set off under, the clouds
 * over the pass, the mountains, the forest, the coast, the birds on the way
 * home. `tone` tints each one so the change is unmistakable at a glance.
 */
const ICONS: Array<{ Icon: LucideIcon; tone: string }> = [
  { Icon: Sun, tone: "text-amber-300" },
  { Icon: Cloud, tone: "text-sky-200" },
  { Icon: Mountain, tone: "text-slate-200" },
  { Icon: Trees, tone: "text-emerald-400" },
  { Icon: Waves, tone: "text-cyan-300" },
  { Icon: Bird, tone: "text-rose-300" },
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

  // Build the rotation. Real, specific work first, generic padding after, so the
  // loop never runs dry even for a fast request.
  const messages = useMemo(() => {
    const overlay = localization.generatingOverlay;
    const list: string[] =
      mode === "remix" ? [...overlay.remixMessages] : [...overlay.generateMessages];

    if (places.length > 0) {
      // Name the traveller's own picks so the wait feels like their trip.
      list.push(
        ...places.map((place) => t(overlay.addingPlace, { place }))
      );
      list.push(overlay.fillingGapsWithPlaces);
    } else {
      // No places given — describe the kind of stops being chosen instead.
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

  // Advance the message on a fixed cadence, looping forever until unmounted.
  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [messages.length]);

  // Cycle the icon slightly faster than the text so the eye always has motion,
  // even while one long message is still on screen.
  useEffect(() => {
    const id = window.setInterval(() => {
      setIconIndex((prev) => (prev + 1) % ICONS.length);
    }, ICON_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const { Icon, tone } = ICONS[iconIndex];

  // Portal to <body>. Inside the dialog this overlay would be a child of the
  // modal's scrolling body, so `fixed` still measured against that scroll box
  // and pushed the icon up behind the modal's header. At the document root it
  // is measured against the real viewport and centres where the eye expects.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-[3px] animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          {/* ---------- a. Cycling travel icon ----------
              A plain outline glyph, no badge, no ring, no glow — just the
              line icon itself. */}
          <div className="flex justify-center">
            <span
              key={iconIndex}
              className={`gen-icon inline-flex ${tone}`}
            >
              <Icon className="h-9 w-9" strokeWidth={1.5} />
            </span>
          </div>

          {/* ---------- b. Cycling status line ----------
              A fixed slot keeps the bar steady no matter how long the
              current message is. */}
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
            <div className="gen-bar h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
