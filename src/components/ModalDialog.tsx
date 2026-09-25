﻿"use client";

import React, { useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { localization } from "@/lib/localization";

export interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showOkButton?: boolean;
  okButtonText?: string;
  /**
   * Primary (right-hand) action. "Done" keeps whatever the dialog holds — it
   * closes without discarding. Falls back to `onClose` when not supplied.
   */
  onOk?: () => void;
  cancelButtonText?: string;
  /**
   * Secondary (left-hand) action. "Discard & Close" abandons the current
   * session — it should close AND reset. Falls back to `onClose` when not
   * supplied, but callers that own state should pass it so the two footer
   * actions are genuinely distinct.
   */
  onCancel?: () => void;
  /** Optional content shown on the left of the footer bar, e.g. a back action. */
  footerLeft?: React.ReactNode;
  /**
   * Compact chrome: drops the footer ESC hint and shrinks the footer, for
   * dialogs whose own content already carries the primary action (e.g. a form
   * with its own full-width submit button).
   */
  compact?: boolean;
  /**
   * Optional right-hand panel that fills the dialog edge-to-edge (top, right and
   * bottom), outside the padded content area. Used for the map, so it can touch
   * the dialog's corners rather than sitting inside a padded, bordered box.
   * Shown only at `lg` and up.
   */
  sidePanel?: React.ReactNode;
  /**
   * The same panel's content for narrow viewports (below `lg`). It is rendered at
   * the END of the scrollable content, so the traveller reaches it by scrolling
   * to the bottom — the form is never crowded out by an always-on panel.
   */
  mobilePanel?: React.ReactNode;
  /**
   * Colour tone for the scrollable body (title block + children).
   *
   * - `default`: the plain slate panel used by the form.
   * - `themed`: a deep teal/cyan travel palette that wraps the WHOLE body,
   *   including the title block, so the itinerary view reads as a distinct
   *   screen instead of the same grey panel with a coloured edge.
   */
  contentTone?: "default" | "themed";
}

/**
 * Inline title block rendered at the top of the scrollable body. Extracted so it
 * can be reused inside the themed (itinerary) body, where it sits on the travel
 * palette alongside the content rather than on the plain slate panel.
 */
function DialogTitle({
  title,
  subtitle,
  compact,
}: {
  title?: string;
  subtitle?: string;
  compact: boolean;
}) {
  if (!title && !subtitle) return null;

  return (
    <div className={compact ? "mb-4" : "mb-6"}>
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 shrink-0 rounded-xl bg-teal-500/15 border-teal-500/40 flex items-center justify-center text-teal-300">
          <Sparkles className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
            {title || localization.homepage.plannerTitle}
          </h3>
          {subtitle && (
            <p className="text-xs text-teal-200/70 mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showOkButton = true,
  okButtonText = localization.common.done,
  onOk,
  cancelButtonText = localization.common.cancel,
  onCancel,
  footerLeft,
  compact = false,
  sidePanel,
  mobilePanel,
  contentTone = "default",
}: ModalDialogProps) {
  // Lock background scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOk = () => {
    if (onOk) {
      onOk();
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center py-6 px-3 sm:py-8 sm:px-4 md:py-10 md:px-6"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      {/* Height is capped explicitly per breakpoint so there is always visible
          breathing room above and below the dialog. On real phones the browser
          chrome (address bar / toolbar) overlaps the viewport, so the mobile cap
          is deliberately smaller (86vh). The wrapper's py-* adds to that gap. */}
      <div className="relative w-full max-w-7xl max-h-[86vh] h-[86vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 z-10 animate-in zoom-in-95 duration-200 sm:max-h-[88vh] sm:h-[88vh] lg:max-h-[92vh] lg:h-[92vh] lg:flex-row overflow-hidden">
        {/* Left column: padded scrollable content. When a sidePanel is present
            this shares the row with the edge-to-edge panel on the right. */}
        <div className={`${
            sidePanel ? "lg:w-2/5 lg:max-w-xl" : "w-full"
          } flex-col min-h-0 flex-1 flex`}>
        {/* Modal Scrollable Body (min-h-0 lets the inner map size correctly).
            The scrollbar is hidden; scrolling still works. When `contentTone` is
            "themed" the body itself carries the travel palette as a real
            background (not an absolutely-positioned child), so it fills the
            whole scrollable height without scrolling away or leaving a seam. */}
        <div
          className={`relative flex-1 min-h-0 overflow-y-auto scrollbar-none p-4 sm:p-6 ${
            contentTone === "themed" ? "bg-[#042f2e]" : ""
          }`}
          style={
            contentTone === "themed"
              ? {
                  backgroundColor: "#042f2e",
                  backgroundImage:
                    "radial-gradient(55% 45% at 12% 0%, rgba(45,212,191,0.22), transparent 68%), radial-gradient(50% 40% at 100% 8%, rgba(56,189,248,0.18), transparent 68%), radial-gradient(70% 50% at 50% 100%, rgba(16,185,129,0.10), transparent 70%), linear-gradient(150deg, #042f2e 0%, #0b1220 45%, #083344 100%)",
                  backgroundAttachment: "local",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                }
              : undefined
          }
        >
          {contentTone === "themed" && (
            <div className="relative">
              <DialogTitle title={title} subtitle={subtitle} compact={compact} />

              {children}

              {mobilePanel && (
                <div className="mt-6 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 h-96 overflow-hidden lg:hidden">
                  {mobilePanel}
                </div>
              )}
            </div>
          )}

          {contentTone === "default" && (
            <>
              <DialogTitle title={title} subtitle={subtitle} compact={compact} />

              {children}

              {mobilePanel && (
                <div className="mt-6 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 h-96 overflow-hidden lg:hidden">
                  {mobilePanel}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — the dialog's actions live here, at the bottom, so the close
            affordance is always reachable without a floating icon. It follows the
            body's tone so the themed view has no hard slate strip at the bottom. */}
        <div
          className={`flex items-center justify-between gap-3 ${
            compact ? "px-4 sm:px-6 py-3" : "px-5 py-3.5"
          } border-t bg-slate-950/80 shrink-0 ${
            contentTone === "themed" ? "border-teal-500/20" : "border-slate-800/80"
          }`}
        >
          {footerLeft ? (
            <div className="flex items-center gap-2">{footerLeft}</div>
          ) : (
          !compact && (
          <div className="text-[11px] text-slate-500 hidden sm:block">
            {localization.common.pressEscHint}{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
              ESC
            </kbd>{" "}
            {localization.common.pressEscSuffix}
          </div>
          )
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel ?? onClose}
              className="cursor-pointer"
            >
              {cancelButtonText}
            </Button>

            {showOkButton && (
              <Button
                type="button"
                variant="gradient"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                onClick={handleOk}
                className="cursor-pointer"
              >
                {okButtonText}
              </Button>
            )}
          </div>
        </div>
        </div>

        {/* Edge-to-edge panel: fills the dialog to its top, right and bottom
            edges (no padding, no inset), so a map reaches every corner. Desktop
            only; below `lg` the same content is rendered at the end of the
            scrollable body via `mobilePanel`. */}
        {sidePanel && (
          <div className="hidden lg:block flex-1 min-w-0 self-stretch overflow-hidden">
            {sidePanel}
          </div>
        )}
      </div>
    </div>
  );
}
