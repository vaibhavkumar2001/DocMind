"use client";

import { useRef } from "react";

type Props = {
  children: React.ReactNode;
  // How far the content moves toward the cursor (0 = not at all, 1 = sticks to the cursor)
  strength?: number;
  className?: string;
};

export default function Magnetic({ children, strength = 0.35, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);

    el.style.transition = "transform 0.12s ease-out";
    el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
  }

  // On leave the content springs back with a small overshoot
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1.4)";
    el.style.transform = "translate3d(0, 0, 0)";
  }

  return (
    // The padding (cancelled by the negative margin) makes the button react a little before the cursor touches it
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`-m-3 inline-block p-3 ${className}`}
    >
      {children}
    </div>
  );
}