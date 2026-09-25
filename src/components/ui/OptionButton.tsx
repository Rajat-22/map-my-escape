import React from "react";

export type OptionAccent = "sky" | "cyan" | "indigo";

const ACCENT_SELECTED: Record<OptionAccent, string> = {
  sky: "bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm shadow-sky-500/20",
  cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-400",
  indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-400",
};

const IDLE = "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700";

export interface OptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  accent?: OptionAccent;
  layout?: "row" | "stack" | "plain";
  icon?: React.ReactNode;
  showActiveDot?: boolean;
  children: React.ReactNode;
}

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
