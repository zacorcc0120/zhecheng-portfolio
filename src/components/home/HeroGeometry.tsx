"use client";
import { useRef, type ReactNode } from "react";
export function HeroGeometry({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="hero-geometry"
      onPointerMove={(event) => {
        if (
          event.pointerType !== "mouse" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--rx",
          `${(event.clientY - rect.top - rect.height / 2) / 100}deg`,
        );
        event.currentTarget.style.setProperty(
          "--ry",
          `${(event.clientX - rect.left - rect.width / 2) / 100}deg`,
        );
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty("--rx", "0deg");
        ref.current?.style.setProperty("--ry", "0deg");
      }}
    >
      {children}
    </div>
  );
}
