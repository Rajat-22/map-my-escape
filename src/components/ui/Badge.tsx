import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "sky" | "teal" | "amber" | "rose" | "emerald" | "violet" | "slate";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Badge({
  children,
  variant = "sky",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  }[size];

  const variantStyles = {
    sky: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    teal: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
    slate: "bg-slate-800 text-slate-300 border border-slate-700",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
