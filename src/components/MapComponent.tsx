"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Maximize2 } from "lucide-react";
import { ItineraryStop, ItineraryCategory } from "@/types/itinerary";
import { getCategoryIcon, CATEGORY_COLOR_MAP, getDayColor } from "@/lib/icons";
import { fetchRoadPathsByDay } from "@/lib/routeService";
import "@/styles/leaflet-map.css";

// Fix for default Leaflet icon missing in Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface MapComponentProps {
  stops?: ItineraryStop[];
  activeStopId?: string | null;
  selectedDay?: number;
  onSelectStop?: (stop: ItineraryStop) => void;
}

// SVG icons by category for Leaflet DivIcon
const CATEGORY_SVG_PATHS: Record<string, string> = {
  temple:
    '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  cafe:
    '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>',
  trek:
    '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.5v2"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.5v2"/>',
  mountain:
    '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  waterfall:
    '<path d="M12 2v6"/><path d="m4.93 10.93 4.24 4.24"/><path d="M2 18h6"/><path d="M20 18h2"/><path d="m19.07 10.93-4.24 4.24"/><path d="M22 22H2"/>',
  beach:
    '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  hotel:
    '<path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect width="16" height="20" x="4" y="2" rx="2"/>',
  viewpoint:
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  heritage:
    '<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-6 0v4"/>',
  market:
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  other:
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
};

function createCategoryMarkerIcon(
  category: string,
  order: number,
  colorHex: string,
  isActive: boolean
) {
  const svgPath = CATEGORY_SVG_PATHS[category] || CATEGORY_SVG_PATHS.other;
  const size = isActive ? 38 : 32;

  const html = `
    <div class="custom-category-marker ${isActive ? "is-active" : ""}" style="width: ${size}px; height: ${size}px; border-color: ${colorHex};">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isActive ? 16 : 13}" height="${isActive ? 16 : 13}" viewBox="0 0 24 24" fill="none" stroke="${colorHex}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${svgPath}
        </svg>
        <span style="font-size: ${isActive ? "10px" : "9px"}; font-family: monospace; font-weight: 800; color: #ffffff; line-height: 1;">
          ${order}
        </span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

// Map controls stacked in the top-right: zoom in, zoom out, then a fit-to-view
// button directly beneath them. Rendered inside the MapContainer so they can
// reach the map instance through useMap(); Leaflet's built-in zoom control is
// turned off (`zoomControl={false}`) so these are the only zoom buttons.
function MapControls({ stops }: { stops: ItineraryStop[] }) {
  const map = useMap();

  const handleFit = () => {
    if (stops.length > 0) {
      const bounds = L.latLngBounds(
        stops.map((s) => [s.lat, s.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([28.6139, 77.209], 13);
    }
  };

  const buttonClass =
    "flex h-8 w-8 items-center justify-center border-slate-700 bg-slate-900/95 text-slate-200 text-lg font-bold leading-none transition-colors hover:bg-slate-800 hover:text-sky-300 cursor-pointer";

  // Pressing a button normally focuses it, and the browser then scrolls the
  // nearest scrollable ancestor to bring it into view — which drags the whole
  // planner (form included) around. Preventing the default focus on mouse down
  // keeps the viewport exactly where the traveller left it.
  const onMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div
        className="flex flex-col overflow-hidden rounded-md border-slate-700 shadow-lg"
        style={{ pointerEvents: "auto" }}
      >
        <button
          type="button"
          onMouseDown={onMouseDown}
          onClick={() => map.zoomIn()}
          title="Zoom in"
          aria-label="Zoom in"
          className={`${buttonClass} border-b`}
        >
          +
        </button>
        <button
          type="button"
          onMouseDown={onMouseDown}
          onClick={() => map.zoomOut()}
          title="Zoom out"
          aria-label="Zoom out"
          className={`${buttonClass} border-b`}
        >
          &minus;
        </button>
        <button
          type="button"
          onMouseDown={onMouseDown}
          onClick={handleFit}
          title="Fit route in view"
          aria-label="Fit route in view"
          className={buttonClass}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Controller component to smoothly fly and fit map bounds to stops or active stop
function MapViewController({
  stops,
  center,
  activeStop,
}: {
  stops: ItineraryStop[];
  center: [number, number];
  activeStop?: ItineraryStop;
}) {
  const map = useMap();

  // Invalidate size once mounted/rendered so maps in modals or dynamic containers size properly
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (activeStop) {
      map.flyTo([activeStop.lat, activeStop.lng], 15, {
        animate: true,
        duration: 1.2,
      });
    } else if (stops && stops.length > 0) {
      const bounds = L.latLngBounds(
        stops.map((s) => [s.lat, s.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView(center, 13);
    }
  }, [stops, center, activeStop, map]);

  return null;
}

/**
 * Resolve route geometry for each day of the visible stops.
 *
 * Returns two maps so the map can render immediately and then improve:
 *   straightRoutes — always present, the plain stop-to-stop line
 *   roadRoutes     — road-following geometry, filled in once OSRM answers
 *
 * The straight line is what gets drawn first, so the map is never empty while
 * waiting on the network, and it stays the fallback if routing fails.
 */
function useDayRoutes(visibleStops: ItineraryStop[]) {
  const straightRoutes = useMemo(() => {
    const groups: Record<number, Array<[number, number]>> = {};
    for (const stop of [...visibleStops].sort((a, b) => a.order - b.order)) {
      if (!groups[stop.day]) groups[stop.day] = [];
      groups[stop.day].push([stop.lat, stop.lng]);
    }
    return groups;
  }, [visibleStops]);

  const [roadState, setRoadState] = useState<{
    key: string;
    routes: Record<number, [number, number][]>;
  }>({ key: "", routes: {} });

  // Identify the request by its coordinates, not by array identity, so a
  // re-render that produces an equal stop list does not refetch.
  const stopsKey = useMemo(
    () =>
      visibleStops
        .map((s) => `${s.id}:${s.day}:${s.order}:${s.lat}:${s.lng}`)
        .join("|"),
    [visibleStops]
  );

  useEffect(() => {
    if (visibleStops.length < 2) return;

    // Guard against a stale response landing after the stops changed.
    let cancelled = false;

    fetchRoadPathsByDay(visibleStops).then((paths) => {
      if (cancelled) return;
      setRoadState({ key: stopsKey, routes: paths });
    });

    return () => {
      cancelled = true;
    };
    // `stopsKey` stands in for visibleStops — same key means same request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey]);

  // Storing the key alongside the routes means geometry from a previous stop
  // set is never rendered once the key moves on — no setState during render,
  // and no clearing effect needed.
  const roadRoutes = roadState.key === stopsKey ? roadState.routes : {};

  return { straightRoutes, roadRoutes };
}

export default function MapComponent({
  stops = [],
  activeStopId,
  selectedDay = 0,
  onSelectStop,
}: MapComponentProps) {
  // Filter stops by selectedDay if day > 0
  const visibleStops = useMemo(() => {
    if (!selectedDay || selectedDay === 0) return stops;
    return stops.filter((s) => s.day === selectedDay);
  }, [stops, selectedDay]);

  // Center coordinates (default: Delhi or first stop)
  const centerPosition: [number, number] = useMemo(() => {
    if (visibleStops && visibleStops.length > 0) {
      return [visibleStops[0].lat, visibleStops[0].lng];
    }
    if (stops && stops.length > 0) {
      return [stops[0].lat, stops[0].lng];
    }
    return [28.6139, 77.209];
  }, [visibleStops, stops]);

  const activeStop = useMemo(
    () => stops.find((s) => s.id === activeStopId),
    [stops, activeStopId]
  );

  // Rendered route geometry per day: {
  //   straight: the naive stop-to-stop line, drawn immediately and kept as the
  //             fallback whenever road routing is unavailable
  //   road:     OSRM's road-following geometry, swapped in once it arrives
  // }
  const { straightRoutes, roadRoutes } = useDayRoutes(visibleStops);

  return (
    <MapContainer
      center={centerPosition}
      zoom={13}
      scrollWheelZoom={true}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapViewController
        stops={visibleStops}
        center={centerPosition}
        activeStop={activeStop}
      />

      {/* Custom zoom + / - and fit-to-view, stacked together in the top-right.
          Fit snaps the view back to the whole route after panning or zooming
          away from it, and fits the visible (day-filtered) stops. */}
      <MapControls stops={visibleStops} />

      {/* Render Day Route Polylines.
          Solid, Google-Maps style: a wider dark "casing" line underneath the
          bright one. The casing is what makes a route read cleanly over busy
          map tiles — without it the colour can disappear into dark patches.

          `coords` is the road-following geometry when OSRM answered, and the
          plain stop-to-stop line when it did not — so a routing outage
          degrades to what the map showed before, never to a blank map. */}
      {Object.entries(straightRoutes).map(([dayNum, straightCoords]) => {
        const coords = roadRoutes[Number(dayNum)] || straightCoords;
        if (coords.length < 2) return null;
        const isRoadRouted = Boolean(roadRoutes[Number(dayNum)]);
        // Same shared palette the itinerary list uses, so a day's colour on the
        // map matches that day's colour in the list.
        const color = getDayColor(Number(dayNum)).hex;
        return (
          <React.Fragment key={`route-day-${dayNum}`}>
            {/* Casing: dark outline drawn slightly wider, beneath the route */}
            <Polyline
              positions={coords}
              pathOptions={{
                color: "#0b1220",
                weight: 9,
                opacity: 0.55,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* The route itself — fully solid, no dashes. Slightly translucent
                until the road geometry arrives, as a cue that this is still
                the straight-line estimate. */}
            <Polyline
              positions={coords}
              pathOptions={{
                color,
                weight: 5,
                opacity: isRoadRouted ? 1 : 0.75,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </React.Fragment>
        );
      })}

      {/* When no itinerary stops exist yet, show default starting pin */}
      {stops.length === 0 && (
        <Marker position={centerPosition}>
          <Popup>
            <div className="p-2 text-xs text-slate-200">
              <strong className="block text-sky-400 font-semibold mb-0.5">
                Starting Escape Point
              </strong>
              Configure vibes and submit the form to generate route coordinates.
            </div>
          </Popup>
        </Marker>
      )}

      {/* Render customized category markers */}
      {visibleStops.map((stop) => {
        const isActive = activeStopId === stop.id;
        const colorHex =
          CATEGORY_COLOR_MAP[stop.category as ItineraryCategory]?.hex ||
          "#64748b";
        const customIcon = createCategoryMarkerIcon(
          stop.category,
          stop.order,
          colorHex,
          isActive
        );

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => onSelectStop?.(stop),
            }}
          >
            <Popup>
              <div
                className={`p-3 text-xs text-slate-100 max-w-[220px] ${
                  isActive ? "ring-1 ring-sky-400 rounded-lg" : ""
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30 font-bold">
                    Day {stop.day} &bull; #{stop.order}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {stop.timeOfDay}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white flex items-center gap-1">
                  {getCategoryIcon(stop.category, "w-3.5 h-3.5 text-teal-400")}
                  <span>{stop.name}</span>
                </h4>

                <p className="text-slate-400 mt-1 leading-snug line-clamp-3">
                  {stop.description}
                </p>

                {stop.insiderTip && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-amber-300">
                    <span className="font-semibold">Tip: </span>
                    {stop.insiderTip}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
