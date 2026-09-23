import React from "react";

export type FieldAccent = "sky" | "teal" | "emerald" | "indigo";

const ACCENT_FOCUS: Record<FieldAccent, string> = {
  sky: "focus:ring-sky-400",
  teal: "focus:ring-teal-400",
  emerald: "focus:ring-emerald-400",
  indigo: "focus:ring-indigo-400",
};

export interface FieldProps {
  /** Associates the label with the control. */
  id?: string;
  label?: React.ReactNode;
  /** Small icon rendered before the label text. */
  icon?: React.ReactNode;
  /** Text shown at the right end of the label row, e.g. a hint or a live value. */
  hint?: React.ReactNode;
  /** Shows an asterisk after the label. */
  required?: boolean;
  /** Which control to render. Both share the same shell styling. */
  as?: "input" | "textarea";
  accent?: FieldAccent;
  /** Rows, for `as="textarea"`. */
  rows?: number;
  className?: string;
  /** Extra classes for the control itself (e.g. `resize-none`). */
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
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={id}
            className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
          >
            {icon}
            {label}
            {required && <span className="text-rose-400">*</span>}
          </label>
          {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
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
