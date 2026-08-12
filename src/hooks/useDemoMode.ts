"use client";

import { useState } from "react";

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kaamwalaDemoMode") === "true";
    }
    return false;
  });

  const toggleDemoMode = () => {
    const newValue = !isDemoMode;
    setIsDemoMode(newValue);
    localStorage.setItem("kaamwalaDemoMode", String(newValue));
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem("kaamwalaDemoMode", "true");
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.setItem("kaamwalaDemoMode", "false");
  };

  return { isDemoMode, toggleDemoMode, enableDemoMode, disableDemoMode };
}
