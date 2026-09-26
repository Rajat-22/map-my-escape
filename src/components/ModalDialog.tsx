"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";
import BrandMark from "@/components/BrandMark";
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
  cancelButtonText?: string;
  onCancel?: () => void;
  footerLeft?: React.ReactNode;
  compact?: boolean;
  sidePanel?: React.ReactNode;
  mobilePanel?: React.ReactNode;
  contentTone?: "default" | "themed";
}

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
        <span className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-sky-500/25">
          <BrandMark className="w-5 h-5 text-slate-950" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
            {title || localization.homepage.plannerTitle}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
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

      <div className="relative w-full max-w-7xl max-h-[86vh] h-[86vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 z-10 animate-in zoom-in-95 duration-200 sm:max-h-[88vh] sm:h-[88vh] lg:max-h-[92vh] lg:h-[92vh] lg:flex-row overflow-hidden">
        <div className={`${
            sidePanel ? "lg:w-2/5 lg:max-w-xl" : "w-full"
          } flex-col min-h-0 flex-1 flex`}>
        <div
          className={`relative flex-1 min-h-0 overflow-y-auto scrollbar-none p-4 sm:p-6 ${
            contentTone === "themed" ? "bg-[#020617]" : ""
          }`}
          style={
            contentTone === "themed"
              ? {
                  backgroundColor: "#020617",
                  backgroundImage:
                    "radial-gradient(55% 45% at 12% 0%, rgba(56,189,248,0.20), transparent 68%), radial-gradient(50% 40% at 100% 8%, rgba(99,102,241,0.22), transparent 68%), radial-gradient(70% 50% at 50% 100%, rgba(34,211,238,0.12), transparent 70%), linear-gradient(150deg, #0b1220 0%, #020617 45%, #082f49 100%)",
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

        <div
          className={`flex items-center justify-between gap-3 ${
            compact ? "px-4 sm:px-6 py-3" : "px-5 py-3.5"
          } border-t bg-slate-950/80 shrink-0 ${
            contentTone === "themed" ? "border-sky-500/20" : "border-slate-800/80"
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

        {sidePanel && (
          <div className="hidden lg:block flex-1 min-w-0 self-stretch overflow-hidden">
            {sidePanel}
          </div>
        )}
      </div>
    </div>
  );
}
