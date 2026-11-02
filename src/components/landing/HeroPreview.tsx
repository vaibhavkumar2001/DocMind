"use client";

import { useRef, useState } from "react";

// Max distance (in px) the window can be dragged away from its home position
const MAX_DRAG = 160;

function clamp(value: number) {
  return Math.max(-MAX_DRAG, Math.min(MAX_DRAG, value));
}

export default function HeroPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Tilt follows the mouse position over the window (mouse only, not touch)
  function handleMouseTilt(e: React.PointerEvent<HTMLDivElement>) {
    if (dragging || e.pointerType !== "mouse") return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 8, y: px * 10 });
  }

  function handleLeave() {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  }

  // Drag starts only from the top bar, so text inside the window stays selectable
  function handleDragStart(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    setDragging(true);
    setTilt({ x: 0, y: 0 });
  }

  function handleDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setOffset({
      x: clamp(e.clientX - dragStart.current.x),
      y: clamp(e.clientY - dragStart.current.y),
    });
  }

  // On release the window springs back to its home position
  function handleDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
    setOffset({ x: 0, y: 0 });
  }

  return (
    // Outer wrapper: idle floating animation (paused while hovered or dragged)
    <div
      className="animate-float mx-auto max-w-3xl [perspective:1200px]"
      style={{ animationPlayState: dragging || hovered ? "paused" : "running" }}
    >
      {/* Inner wrapper: drag offset + 3D tilt */}
      <div
        ref={containerRef}
        onPointerEnter={() => setHovered(true)}
        onPointerMove={handleMouseTilt}
        onPointerLeave={handleLeave}
        className="glass glow overflow-hidden rounded-2xl text-left will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: dragging ? "none" : "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* Window top bar = drag handle */}
        <div
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          className={`flex select-none items-center gap-2 border-b px-4 py-3 [touch-action:none] ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          title="Drag me"
        >
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted-foreground">Product Team workspace</span>
          <span className="ml-auto hidden text-xs text-muted-foreground/70 sm:inline">
            drag me
          </span>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex justify-end">
            <div className="bg-gradient-neon max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white">
              What were the main risks mentioned in the Q3 report?
            </div>
          </div>

          <div className="flex gap-3">
            <span className="bg-gradient-neon mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white">
              D
            </span>
            <div className="max-w-[90%]">
              <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm leading-relaxed">
                The report highlights three main risks: supplier delays in the second half,
                rising cloud costs, and a dependency on a single payment provider.
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  q3-report.pdf · p. 12
                </span>
                <span className="rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  q3-report.pdf · p. 18
                </span>
                <span className="rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  review-call.mp4 · 04:32
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}