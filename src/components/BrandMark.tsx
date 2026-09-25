import React from "react";
export interface BrandMarkProps extends React.SVGProps<SVGSVGElement> {
  strokeWidth?: number;
}

export default function BrandMark({
  className = "h-6 w-6",
  strokeWidth = 1.9,
  ...props
}: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {/* The route: leaves the starting corner, swings out and back in */}
      <path d="M4.2 20.4c5.6-.7 9-3 9-6.5s-2.8-5.1-2.8-7.2c0-1.5 1-2.7 2.4-3.6" />
      {/* Departure point */}
      <circle cx="3.5" cy="20.5" r="1.6" />
      {/* Destination pin */}
      <path d="M17 3.2a4.3 4.3 0 0 1 4.3 4.3c0 2.8-4.3 6.6-4.3 6.6s-4.3-3.8-4.3-6.6A4.3 4.3 0 0 1 17 3.2Z" />
      <circle cx="17" cy="7.5" r="1.5" />
    </svg>
  );
}
