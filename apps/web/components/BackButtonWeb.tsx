"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BackButtonWebProps {
  /** Custom fallback route if no history exists (default: "/") */
  fallbackRoute?: string;
  /** Custom icon color (default: "#047857" - emerald-600) */
  iconColor?: string;
  /** Custom size (default: 24) */
  iconSize?: number;
  /** Additional className for button */
  className?: string;
  /** Show text label next to icon */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
}

/**
 * Reusable BackButton component for web app
 * Handles browser navigation backward with safe fallback
 */
export function BackButtonWeb({
  fallbackRoute = "/",
  iconColor = "#047857",
  iconSize = 24,
  className = "",
  showLabel = false,
  label = "Back"
}: BackButtonWebProps) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  // Check if we can go back (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if there's history to go back to
      setCanGoBack(window.history.length > 1);
    }
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push(fallbackRoute);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors ${className}`}
      type="button"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {showLabel && <span>{label}</span>}
    </button>
  );
}

