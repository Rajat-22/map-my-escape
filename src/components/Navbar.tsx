import React from "react";
import { Compass, Sparkles, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import siteContent from "@/data/siteContent.json";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/20">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              {siteContent.brand.name}
              <span className="text-sky-400 text-xs px-1.5 py-0.5 rounded border border-sky-400/30 bg-sky-400/10 font-mono">
                v1.0
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="teal" size="sm" className="hidden sm:inline-flex">
            <Sparkles className="w-3 h-3" />
            AI-Powered Live Routing
          </Badge>
          <a
            href="#plan-section"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Start Route</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
