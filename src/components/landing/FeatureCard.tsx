"use client";

import { useRef } from "react";

type Props = {
  title: string;
  text: string;
  // SVG path data for the icon
  icon: string;
};

export default function FeatureCard({ title, text, icon }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Store the mouse position in CSS variables; the glow layer reads them
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className="glass group relative h-full overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-primary"
    >
      {/* Spotlight that follows the cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--primary) 24%, transparent), transparent 70%)",
        }}
      />

      <div className="relative">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition duration-300 group-hover:scale-110 group-hover:glow">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={icon} />
          </svg>
        </span>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}