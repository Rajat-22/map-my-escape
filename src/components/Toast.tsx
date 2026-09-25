"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import "@/styles/toast.css";

export type ToastVariant = "error" | "success";

const VARIANTS: Record<
  ToastVariant,
  { icon: typeof AlertTriangle; wrapper: string; iconClass: string; titleClass: string; bodyClass: string; barTrack: string; barFill: string; closeClass: string }
> = {
  error: {
    icon: AlertTriangle,
    wrapper: "border-rose-500/40",
    iconClass: "text-rose-400",
    titleClass: "text-rose-200",
    bodyClass: "text-rose-200/80",
    barTrack: "bg-rose-500/20",
    barFill: "bg-rose-400/70",
    closeClass: "text-rose-200/70 hover:bg-rose-500/20",
  },
  success: {
    icon: CheckCircle2,
    wrapper: "border-sky-500/40",
    iconClass: "text-sky-400",
    titleClass: "text-sky-200",
    bodyClass: "text-sky-100/80",
    barTrack: "bg-sky-500/20",
    barFill: "bg-sky-400/70",
    closeClass: "text-sky-200/70 hover:bg-sky-500/20",
  },
};

export interface ToastProps {
  message: string | null;
  title?: string;
  onDismiss: () => void;
  duration?: number;
  closeLabel?: string;
  variant?: ToastVariant;
}

export default function Toast({
  message,
  title,
  onDismiss,
  duration = 5000,
  closeLabel = "Close notification",
  variant = "error",
}: ToastProps) {
  const tone = VARIANTS[variant];
  const Icon = tone.icon;
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => onDismissRef.current(), duration);
    return () => window.clearTimeout(id);
  }, [message, duration]);

  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4"
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`toast-in pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl ${tone.wrapper} bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md`}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.iconClass}`} />
          <div className="min-w-0 flex-1">
            {title && (
              <p className={`text-sm font-semibold ${tone.titleClass}`}>
                {title}
              </p>
            )}
            <p className={`mt-0.5 text-xs leading-relaxed ${tone.bodyClass}`}>
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={closeLabel}
            className={`shrink-0 rounded-lg p-1 transition-colors hover:text-white cursor-pointer ${tone.closeClass}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`h-0.5 w-full ${tone.barTrack}`}>
          <div
            className={`toast-countdown h-full ${tone.barFill}`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
