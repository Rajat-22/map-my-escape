import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "interactive" | "active";
  children: React.ReactNode;
}

export function Card({
  children,
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "rounded-2xl transition-all duration-200 overflow-hidden";

  const variantStyles = {
    default: "bg-slate-900 border border-slate-800 text-slate-100 shadow-lg",
    glass:
      "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 text-slate-100 shadow-xl shadow-black/20",
    interactive:
      "bg-slate-900/70 hover:bg-slate-800/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-100 shadow-md hover:shadow-xl cursor-pointer active:scale-[0.99]",
    active:
      "bg-slate-800/90 border-2 border-sky-400 text-slate-100 shadow-xl shadow-sky-500/15",
  }[variant];

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}
