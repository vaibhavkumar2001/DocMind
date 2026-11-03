"use client";

import { useEffect, useRef, useState } from "react";

// How quickly the ring and glow catch up with the mouse (0 to 1, higher = faster)
const RING_LERP = 0.18;
// How quickly the parallax orbs settle (0 to 1)
const PARALLAX_LERP = 0.08;
// Radius (px) of the bright area around the cursor in the grid
const GRID_RADIUS = 240;

const GRID_LINE = "color-mix(in srgb, var(--primary) 45%, transparent)";

export default function CursorEffects() {
  const [enabled, setEnabled] = useState(false);

  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
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
    const ring = ringRef.current;
    const dot = dotRef.current;
    const grid = gridRef.current;
    if (!glow || !ring || !dot || !grid) return;

    // Elements that should move with the mouse (orbs): <div data-parallax data-depth="30">
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const layers = [glow, ring, dot, grid];

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 3;
    let ringX = mouseX;
    let ringY = mouseY;
    let ringScale = 1;
    let targetScale = 1;
    let px = 0;
    let py = 0;
    let raf = 0;

    function setVisible(visible: boolean) {
      for (const el of layers) el.style.opacity = visible ? "1" : "0";
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      setVisible(true);
    }

    // The ring grows over anything clickable
    function onOver(e: PointerEvent) {
      const target = e.target as Element | null;
      const clickable = target?.closest("a, button, summary, [role='button']");
      targetScale = clickable ? 1.9 : 1;
    }

    function onLeaveWindow() {
      setVisible(false);
    }

    // A ring that expands and fades out where the user clicks
    function onClick(e: MouseEvent) {
      const burst = document.createElement("div");
      burst.style.cssText =
        `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:18px;height:18px;` +
        "margin:-9px 0 0 -9px;border-radius:9999px;border:2px solid var(--primary);" +
        "pointer-events:none;z-index:70;";
      document.body.appendChild(burst);
      const animation = burst.animate(
        [
          { transform: "scale(1)", opacity: 0.8 },
          { transform: "scale(4.5)", opacity: 0 },
        ],
        { duration: 600, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
      animation.onfinish = () => burst.remove();
    }

    function tick() {
      // Ring and glow follow the mouse with a small delay
      ringX += (mouseX - ringX) * RING_LERP;
      ringY += (mouseY - ringY) * RING_LERP;
      ringScale += (targetScale - ringScale) * 0.2;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${ringScale})`;
      glow.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      // The grid layer scrolls with the page, so the mask position includes the scroll offset
      const mask = `radial-gradient(${GRID_RADIUS}px circle at ${mouseX}px ${mouseY + window.scrollY}px, black, transparent)`;
      grid.style.setProperty("mask-image", mask);
      grid.style.setProperty("-webkit-mask-image", mask);

      // Parallax: orbs drift slightly away from the mouse
      const targetX = (mouseX / window.innerWidth - 0.5) * 2;
      const targetY = (mouseY / window.innerHeight - 0.5) * 2;
      px += (targetX - px) * PARALLAX_LERP;
      py += (targetY - py) * PARALLAX_LERP;
      for (const el of parallaxEls) {
        const depth = Number(el.dataset.depth ?? 20);
        el.style.transform = `translate3d(${-px * depth}px, ${-py * depth}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerover", onOver);
    window.addEventListener("click", onClick);
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("click", onClick);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      for (const el of parallaxEls) el.style.transform = "";
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Bright grid lines that appear only near the cursor (scrolls with the page, like the base grid) */}
      <div
        ref={gridRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          backgroundImage: `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px), linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Soft glow that follows the cursor (sits behind the page content) */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[1] -ml-[260px] -mt-[260px] h-[520px] w-[520px] rounded-full opacity-0 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 22%, transparent), transparent 65%)",
        }}
      />

      {/* Ring (follows with a delay) */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] -ml-[18px] -mt-[18px] h-9 w-9 rounded-full border-2 border-primary/70 opacity-0 transition-opacity duration-300"
      />

      {/* Dot (follows instantly) */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="bg-gradient-neon pointer-events-none fixed left-0 top-0 z-[70] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full opacity-0 transition-opacity duration-300"
      />
    </>
  );
}