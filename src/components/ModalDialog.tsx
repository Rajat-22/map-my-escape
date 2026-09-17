﻿"use client";

import React, { useEffect } from "react";
import { X, Check } from "lucide-react";
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
  onOk?: () => void;
  /** Optional content shown on the left of the footer bar, e.g. a back action. */
  footerLeft?: React.ReactNode;
}

export default function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showOkButton = true,
  okButtonText = localization.common.okButtonText,
  onOk,
  footerLeft,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-7xl max-h-[94vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title || localization.homepage.plannerTitle}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick close button in header */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={localization.common.closeDialog}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body (min-h-0 lets the inner map size correctly) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>

        {/* Footer with Okay / Cancel Actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/80 shrink-0">
          {footerLeft ? (
            <div className="flex items-center gap-2">{footerLeft}</div>
          ) : (
          <div className="text-[11px] text-slate-500 hidden sm:block">
            {localization.common.pressEscHint}{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
              ESC
            </kbd>{" "}
            {localization.common.pressEscSuffix}
          </div>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              {localization.common.cancel}
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
    </div>
  );
}
