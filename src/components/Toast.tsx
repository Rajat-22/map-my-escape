"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import "@/styles/toast.css";

export interface ToastProps {
  /** The message to show. When null/empty the toast renders nothing. */
  message: string | null;
  /** Optional bold heading shown above the message. */
  title?: string;
  /** Called when the auto-dismiss timer elapses, or the user closes it. */
  onDismiss: () => void;
  /** How long the toast stays on screen, in ms. */
  duration?: number;
  /** Accessible label for the close button. */
  closeLabel?: string;
}

/**
 * Toast
 *
 * A transient, floating notification pinned to the **viewport** (not the
 * document flow). This exists because an inline error banner scrolls out of
 * view: a failed generation was reported at the top of the dialog, but the
 * traveller is scrolled down at the form/map when the overlay lifts, so they
 * never saw it.
 *
 * Behaviour:
 *  - fixed, top-centre, so it is visible wherever the page is scrolled
 *  - auto-dismisses after `duration` (default 5s), with a thin countdown bar
 *  - can be closed early by the button, and pauses nothing else
 *  - mounted via a portal to <body> so the modal's overflow/stacking cannot
 *    clip it, and z-index sits above the generating overlay
 *  - `role="alert"` + `aria-live="assertive"` so screen readers announce it
 */
export default function Toast({
  message,
  title,
  onDismiss,
  duration = 5000,
  closeLabel = "Close notification",
}: ToastProps) {
  // Keep the latest onDismiss in a ref so the timer effect does not restart
  // (and the countdown does not reset) every time the parent re-renders.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => onDismissRef.current(), duration);
    return () => window.clearTimeout(id);
    // Re-arm the timer whenever a new message arrives.
  }, [message, duration]);

  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-in pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border-rose-500/40 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div className="min-w-0 flex-1">
            {title && (
              <p className="text-sm font-semibold text-rose-200">{title}</p>
            )}
            <p className="mt-0.5 text-xs leading-relaxed text-rose-200/80">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={closeLabel}
            className="shrink-0 rounded-lg p-1 text-rose-200/70 transition-colors hover:bg-rose-500/20 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Countdown bar: a visual cue that the toast will disappear on its own.
            The animation duration matches `duration` via inline style. */}
        <div className="h-0.5 w-full bg-rose-500/20">
          <div
            className="toast-countdown h-full bg-rose-400/70"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
