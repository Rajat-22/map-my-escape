"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ItineraryStop } from "@/types/itinerary";
import { getCategoryIcon } from "@/lib/icons";

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
  onSelectStop?: (stop: ItineraryStop) => void;
}

// Controller component to smoothly fly and fit map bounds to stops
function MapViewController({
  stops,
  center,
}: {
  stops: ItineraryStop[];
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (stops && stops.length > 0) {
      const bounds = L.latLngBounds(
        stops.map((s) => [s.lat, s.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView(center, 13);
    }
  }, [stops, center, map]);

  return null;
}

export default function MapComponent({
  stops = [],
  activeStopId,
  onSelectStop,
}: MapComponentProps) {
  // Center coordinates (default: Delhi or first stop)
  const centerPosition: [number, number] = useMemo(() => {
    if (stops && stops.length > 0) {
      return [stops[0].lat, stops[0].lng];
    }
    return [28.6139, 77.209];
  }, [stops]);

  return (
    <MapContainer
      center={centerPosition}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapViewController stops={stops} center={centerPosition} />

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

      {/* Render real itinerary stops */}
      {stops.map((stop) => {
        const isActive = activeStopId === stop.id;

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
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
