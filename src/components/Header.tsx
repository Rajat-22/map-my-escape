"use client";

import { useState, useSyncExternalStore } from "react";
import { Compass, Bookmark, Trash2, ChevronRight, X } from "lucide-react";
import { localization, t } from "@/lib/localization";
import { ItineraryData } from "@/types/itinerary";
import {
  getSavedItineraries,
  getSavedItinerariesServerSnapshot,
  subscribeToSavedItineraries,
  removeSavedItinerary,
} from "@/lib/storage";

export interface HeaderProps {
  onSelectSavedItinerary?: (itinerary: ItineraryData) => void;
}

export default function Header({ onSelectSavedItinerary }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Subscribe to storage changes with stable cached snapshots
  const savedEscapes = useSyncExternalStore(
    subscribeToSavedItineraries,
    getSavedItineraries,
    getSavedItinerariesServerSnapshot,
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSavedItinerary(id);
  };

  return (
    <nav className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/20">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            {localization.brand.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Saved Escapes Toggle Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-teal-400" />
              <span>{localization.common.saved}</span>
              {savedEscapes.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[10px] border-teal-500/30 font-bold">
                  {savedEscapes.length}
                </span>
              )}
            </button>

            {/* Saved Escapes Dropdown Drawer */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border-slate-800 shadow-2xl p-4 z-50 text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                    <Bookmark className="w-4 h-4 text-teal-400" />
                    <span>
                      {t(localization.navbar.savedEscapesTitle, {
                        count: savedEscapes.length,
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 scrollbar-none">
                  {savedEscapes.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      <p>{localization.navbar.emptyTitle}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {localization.navbar.emptyHint}
                      </p>
                    </div>
                  ) : (
                    savedEscapes.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectSavedItinerary?.(item);
                          setIsOpen(false);
                        }}
                        className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-teal-500/40 cursor-pointer transition-all"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <h4 className="text-xs font-semibold text-white group-hover:text-teal-300 truncate">
                            {item.tripTitle}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {t(localization.navbar.itemMeta, {
                              startingCity: item.startingCity,
                              days: item.totalDays,
                              stops: item.stops.length,
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title={localization.navbar.removeSavedAria}
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
