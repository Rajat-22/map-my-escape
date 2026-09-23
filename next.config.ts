import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating Next.js dev-tools badge (the dark circle with an "N"
  // pinned to the bottom-left). It is a development-only overlay, but it sits
  // on top of the page during QA and screenshots. A production build never
  // renders it either way.
  devIndicators: false,
  images: {
    // Hero photograph is served from the Unsplash CDN.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
