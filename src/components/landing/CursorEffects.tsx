"use client";

import { useEffect, useRef, useState } from "react";

// How quickly the glow catches up with the mouse (0 to 1, higher = faster)
const GLOW_LERP = 0.12;
// How quickly the parallax orbs settle (0 to 1)
const PARALLAX_LERP = 0.06;
// Parallax strength: 1 = full movement, 0 = none
const PARALLAX_STRENGTH = 0.5;
// Radius (px) of the lit area around the cursor in the grid
const GRID_RADIUS = 200;

const GRID_LINE = "color-mix(in srgb, var(--primary) 28%, transparent)";

export default function CursorEffects() {
  const [enabled, setEnabled] = useState(false);

  const glowRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Only enable for real mouse devices, and only if the user does not prefer reduced motion
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const glow = glowRef.current;
    const grid = gridRef.current;
    if (!glow || !grid) return;

    // Elements that drift slightly with the mouse (orbs): <div data-parallax data-depth="30">
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 3;
    let glowX = mouseX;
    let glowY = mouseY;
    let px = 0;
    let py = 0;
    let raf = 0;

    function setVisible(visible: boolean) {
      glow!.style.opacity = visible ? "1" : "0";
      grid!.style.opacity = visible ? "1" : "0";
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      setVisible(true);
    }

    function onLeaveWindow() {
      setVisible(false);
    }

    function tick() {
      // The glow follows the mouse with a small delay
      glowX += (mouseX - glowX) * GLOW_LERP;
      glowY += (mouseY - glowY) * GLOW_LERP;
      glow!.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;

      // The grid layer scrolls with the page, so the mask position includes the scroll offset
      const mask = `radial-gradient(${GRID_RADIUS}px circle at ${mouseX}px ${mouseY + window.scrollY}px, black, transparent)`;
      grid!.style.setProperty("mask-image", mask);
      grid!.style.setProperty("-webkit-mask-image", mask);

      // Parallax: orbs drift slightly away from the mouse
      const targetX = (mouseX / window.innerWidth - 0.5) * 2;
      const targetY = (mouseY / window.innerHeight - 0.5) * 2;
      px += (targetX - px) * PARALLAX_LERP;
      py += (targetY - py) * PARALLAX_LERP;
      for (const el of parallaxEls) {
        const depth = Number(el.dataset.depth ?? 20) * PARALLAX_STRENGTH;
        el.style.transform = `translate3d(${-px * depth}px, ${-py * depth}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      for (const el of parallaxEls) el.style.transform = "";
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Grid lines that light up only near the cursor (scrolls with the page, like the base grid) */}
      <div
        ref={gridRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Soft glow that follows the cursor (sits behind the page content) */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[1] -ml-[260px] -mt-[260px] h-[520px] w-[520px] rounded-full opacity-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 14%, transparent), transparent 65%)",
        }}
      />
    </>
  );
}