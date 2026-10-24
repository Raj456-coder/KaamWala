"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import clsx from "clsx";
import { ShieldCheck, Zap, MapPin } from "lucide-react";

export interface SplashScreenProps {
  /**
   * Duration in milliseconds to hold the splash screen before fading out.
   * Default: 1500ms (~1.5s).
   */
  duration?: number;
  /**
   * Fade-out animation duration in milliseconds.
   * Default: 500ms.
   */
  fadeDuration?: number;
  /**
   * If true, forces the splash screen to display regardless of session storage.
   * Useful for testing or demoing.
   */
  forceShow?: boolean;
}

const STORAGE_KEY = "kaamwala_splash_shown";

export default function SplashScreen({
  duration = 1500,
  fadeDuration = 500,
  forceShow = false,
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const dismiss = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, fadeDuration);
  }, [fadeDuration]);

  useEffect(() => {
    setIsMounted(true);

    try {
      // Check for preview query parameter: ?splash=true
      const isDebug =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("splash") === "true";

      const hasShown = sessionStorage.getItem(STORAGE_KEY);

      if (hasShown && !isDebug && !forceShow) {
        setIsVisible(false);
        return;
      }

      // Mark this session as having shown the splash screen
      sessionStorage.setItem(STORAGE_KEY, "true");

      // Start the fade-out timer after the duration (~1.5s)
      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    } catch {
      // Fallback if sessionStorage is inaccessible (e.g. restrictive cookies)
      setIsVisible(false);
    }
  }, [duration, forceShow, dismiss]);

  // Don't render if completed or already viewed
  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="kaamwala-splash-screen"
      role="status"
      aria-live="polite"
      aria-label="KaamWala is loading"
      onClick={dismiss}
      style={{
        transitionDuration: `${fadeDuration}ms`,
      }}
      className={clsx(
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer",
        "bg-white dark:bg-slate-950",
        "transition-all ease-in-out",
        isFadingOut
          ? "opacity-0 pointer-events-none scale-[1.02]"
          : "opacity-100 pointer-events-auto scale-100"
      )}
    >
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl pointer-events-none animate-pulse"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-3xl pointer-events-none animate-pulse [animation-delay:700ms]"
      />

      {/* Main Brand Content */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-sm w-full">
        {/* Animated Logo Container */}
        <div
          className={clsx(
            "relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center bg-transparent transition-all duration-700 ease-out",
            isMounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
          )}
        >
          {/* Ambient soft circular glow behind transparent logo */}
          <div
            aria-hidden="true"
            className="absolute inset-2 rounded-full bg-blue-500/15 dark:bg-blue-400/20 blur-xl pointer-events-none animate-pulse"
          />

          {/* Transparent Logo */}
          <div className="relative w-full h-full flex items-center justify-center bg-transparent animate-splash-pulse">
            <Image
              src="/logo.png?v=2"
              alt="KaamWala Logo"
              width={112}
              height={112}
              priority
              unoptimized
              className="w-full h-full object-contain bg-transparent filter drop-shadow-md select-none"
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div
          className={clsx(
            "mt-6 text-center transition-all duration-700 delay-100 ease-out",
            isMounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          )}
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
            <span className="text-[#2563EB] dark:text-blue-500">Kaam</span>
            <span className="text-[#F59E0B]">Wala</span>
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            Find Trusted Local Workers Near You
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div
          className={clsx(
            "mt-6 w-44 sm:w-52 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner transition-all duration-700 delay-200",
            isMounted ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] via-blue-500 to-[#F59E0B] rounded-full animate-splash-progress"
          />
        </div>

        {/* Trust Badges */}
        <div
          className={clsx(
            "mt-5 flex items-center justify-center gap-3 text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 transition-all duration-700 delay-300",
            isMounted ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Verified
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Instant
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            Local
          </span>
        </div>
      </div>
    </div>
  );
}
