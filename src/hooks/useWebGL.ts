"use client";
import { useEffect, useState } from "react";
let cachedSupport: boolean | undefined;

export function useWebGL(enabled: boolean) {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // Run after hydration, before mounting Three's renderer. This keeps devices
    // without WebGL out of a renderer exception/retry loop.
    Promise.resolve().then(() => {
      if (cachedSupport === undefined) {
        try {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("webgl2");
          cachedSupport = Boolean(context);
          context?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {
          cachedSupport = false;
        }
      }
      if (!cancelled) setSupported(cachedSupport);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return supported;
}
