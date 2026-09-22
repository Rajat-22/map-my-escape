import React from "react";

/** Accent used for the selected state. */
export type OptionAccent = "sky" | "teal" | "emerald";

const ACCENT_SELECTED: Record<OptionAccent, string> = {
  sky: "bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm shadow-sky-500/20",
  teal: "bg-teal-500/20 text-teal-300 border-teal-400",
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-400",
};

/** Shared across every accent — previously copy-pasted at each call site. */
const IDLE =
  "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700";

export interface OptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  accent?: OptionAccent;
  /**
   * `row`    — icon beside the label, for wrapping tag groups (vibes).
   * `stack`  — icon above the label, for evenly-divided grids (transport).
   * `plain`  — label only, for compact segments (pace).
   */
  layout?: "row" | "stack" | "plain";
  icon?: React.ReactNode;
  /** Shows a small pulsing dot when selected (vibes use this). */
  showActiveDot?: boolean;
  children: React.ReactNode;
}

/**
 * A selectable option button.
 *
 * The planner renders this pattern three times (travel vibes, pace, transport).
 * Before this, each copy re-declared its own idle styling, so the neutral state
 * could — and did — drift between them.
 */
export function OptionButton({
  selected = false,
  accent = "sky",
  layout = "plain",
  icon,
  showActiveDot = false,
  className = "",
  children,
  ...props
}: OptionButtonProps) {
  const layoutClasses = {
    row: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl",
    stack: "p-2 rounded-xl flex flex-col items-center justify-center gap-1",
    plain: "py-2 px-1 rounded-xl text-center",
  }[layout];

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        "text-xs font-medium border transition-all cursor-pointer select-none",
        layoutClasses,
        selected ? ACCENT_SELECTED[accent] : IDLE,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon}
      <span
        className={
          layout === "stack" ? "text-[11px] truncate w-full text-center" : ""
        }
      >
        {children}
      </span>
      {showActiveDot && selected && (
        <span className="w-1.5 h-1.5 rounded-full bg-current ml-0.5 animate-pulse" />
      )}
    </button>
  );
}
