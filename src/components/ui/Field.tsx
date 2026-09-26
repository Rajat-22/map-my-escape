import React from "react";

export type FieldAccent = "sky" | "cyan" | "indigo" | "violet";

const ACCENT_FOCUS: Record<FieldAccent, string> = {
  sky: "focus:ring-sky-400",
  cyan: "focus:ring-cyan-400",
  indigo: "focus:ring-indigo-400",
  violet: "focus:ring-violet-400",
};

export interface FieldProps {
  id?: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  as?: "input" | "textarea";
  accent?: FieldAccent;
  rows?: number;
  className?: string;
  controlClassName?: string;
}

export function Field({
  id,
  label,
  icon,
  hint,
  required = false,
  as = "input",
  accent = "sky",
  rows = 2,
  className = "",
  controlClassName = "",
  ...props
}: FieldProps &
  Omit<
    React.InputHTMLAttributes<HTMLInputElement> &
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "className"
  >) {
  const controlClasses = [
    "w-full rounded-xl bg-slate-950/80 border-slate-700/80 text-white",
    "placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all",
    ACCENT_FOCUS[accent],
    as === "input" ? "px-3.5 py-2.5 text-sm" : "px-3.5 py-2 text-xs",
    controlClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 mb-1.5">
          <label
            htmlFor={id}
            className="min-w-0 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
          >
            {icon}
            <span className="min-w-0">{label}</span>
            {required && <span className="text-rose-400">*</span>}
          </label>
          {hint && (
            <span className="text-[11px] text-slate-500 shrink-0">{hint}</span>
          )}
        </div>
      )}

      {as === "textarea" ? (
        <textarea
          id={id}
          rows={rows}
          className={controlClasses}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          className={controlClasses}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </div>
  );
}
