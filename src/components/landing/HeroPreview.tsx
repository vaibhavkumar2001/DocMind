"use client";

import { useEffect, useRef, useState } from "react";

// ---------- Demo conversations that loop in the preview ----------
type Scenario = {
  question: string;
  answer: string;
  sources: string[];
};

const SCENARIOS: Scenario[] = [
  {
    question: "What were the main risks mentioned in the Q3 report?",
    answer:
      "The report highlights three main risks: supplier delays in the second half, rising cloud costs, and a dependency on a single payment provider.",
    sources: ["q3-report.pdf · p. 12", "q3-report.pdf · p. 18"],
  },
  {
    question: "When does the refund window close?",
    answer:
      "Customers can request a refund within 30 days of purchase. After that period, only store credit is offered, as stated in the returns policy.",
    sources: ["returns-policy.docx · p. 3"],
  },
  {
    question: "What was decided in the product review meeting?",
    answer:
      "The team agreed to ship the new onboarding flow next sprint and to postpone the mobile redesign until the following quarter.",
    sources: ["review-call.mp4 · 04:32", "meeting-notes.txt · p. 1"],
  },
];

// ---------- Timing (milliseconds) ----------
const TYPE_MS = 32; // delay between typed characters
const SEND_PAUSE_MS = 450; // pause after typing, before "sending"
const THINK_MS = 1100; // how long the thinking dots show
const WORD_MS = 55; // delay between streamed words
const CHIP_MS = 300; // delay between citation chips
const HOLD_MS = 3800; // how long the finished answer stays on screen
const FADE_MS = 600; // fade-out before the next demo

type Phase = "static" | "typing" | "thinking" | "answering" | "sources" | "fading";

// Max distance (in px) the window can be dragged away from its home position
const MAX_DRAG = 160;

function clamp(value: number) {
  return Math.max(-MAX_DRAG, Math.min(MAX_DRAG, value));
}

export default function HeroPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // ----- Drag and tilt state -----
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // ----- Typing demo state -----
  // "static" = the first demo fully shown (server render, and users who prefer reduced motion)
  const [phase, setPhase] = useState<Phase>("static");
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [qLen, setQLen] = useState(0);
  const [aWords, setAWords] = useState(0);
  const [chips, setChips] = useState(0);
  const [inView, setInView] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];
  const answerWords = scenario.answer.split(" ");

  // On mount: start the animation unless the user prefers reduced motion
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setQLen(0);
    setAWords(0);
    setChips(0);
    setPhase("typing");
  }, []);

  // Run the animation only while the window is visible on screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The animation is a small state machine: every step schedules the next one
  useEffect(() => {
    if (!inView || phase === "static") return;

    let delay = 0;
    let next: () => void = () => {};

    switch (phase) {
      case "typing":
        if (qLen < scenario.question.length) {
          delay = TYPE_MS;
          next = () => setQLen(qLen + 1);
        } else {
          delay = SEND_PAUSE_MS;
          next = () => setPhase("thinking");
        }
        break;

      case "thinking":
        delay = THINK_MS;
        next = () => setPhase("answering");
        break;

      case "answering":
        if (aWords < answerWords.length) {
          delay = WORD_MS;
          next = () => setAWords(aWords + 1);
        } else {
          delay = 300;
          next = () => setPhase("sources");
        }
        break;

      case "sources":
        if (chips < scenario.sources.length) {
          delay = CHIP_MS;
          next = () => setChips(chips + 1);
        } else {
          delay = HOLD_MS;
          next = () => setPhase("fading");
        }
        break;

      case "fading":
        delay = FADE_MS;
        next = () => {
          // Move to the next demo and start typing again
          setScenarioIdx((i) => (i + 1) % SCENARIOS.length);
          setQLen(0);
          setAWords(0);
          setChips(0);
          setPhase("typing");
        };
        break;
    }

    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  }, [inView, phase, qLen, aWords, chips, scenario, answerWords.length]);

  // ----- What to show right now -----
  const isStatic = phase === "static";
  const typedText = phase === "typing" ? scenario.question.slice(0, qLen) : "";
  const showUser = isStatic || phase !== "typing";
  const showThinking = phase === "thinking" || (phase === "answering" && aWords === 0);
  const showAnswer =
    isStatic || ((phase === "answering" || phase === "sources" || phase === "fading") && aWords > 0);
  const answerText = isStatic ? scenario.answer : answerWords.slice(0, aWords).join(" ");
  const visibleChips = isStatic ? scenario.sources.length : chips;

  // ----- Drag and tilt handlers -----
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
          <span className="ml-auto hidden text-xs text-muted-foreground/70 sm:inline">drag me</span>
        </div>

        {/* Messages (fixed minimum height, so the window does not jump while text appears) */}
        <div
          className={`min-h-[19rem] space-y-4 p-5 transition-opacity duration-500 sm:p-6 ${
            phase === "fading" ? "opacity-0" : "opacity-100"
          }`}
        >
          {showUser && (
            <div className="flex justify-end">
              <div className="bg-gradient-neon max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white">
                {scenario.question}
              </div>
            </div>
          )}

          {showThinking && (
            <div className="flex gap-3">
              <span className="bg-gradient-neon mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white">
                D
              </span>
              <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3.5" aria-label="Thinking">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                </span>
              </div>
            </div>
          )}

          {showAnswer && (
            <div className="flex gap-3">
              <span className="bg-gradient-neon mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white">
                D
              </span>
              <div className="max-w-[90%]">
                <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm leading-relaxed">
                  {answerText}
                  {phase === "answering" && <span className="animate-pulse text-primary">▍</span>}
                </div>

                {visibleChips > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scenario.sources.slice(0, visibleChips).map((source) => (
                      <span
                        key={source}
                        className="animate-word-in rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fake input bar: the question is "typed" here before it is sent */}
        <div className="flex items-center gap-2 border-t bg-background/40 p-3">
          <div className="min-w-0 flex-1 truncate rounded-full border border-input bg-muted px-4 py-2.5 text-sm">
            {typedText ? (
              <>
                <span>{typedText}</span>
                <span className="animate-pulse text-primary">▍</span>
              </>
            ) : (
              <span className="text-muted-foreground">Ask anything about your documents...</span>
            )}
          </div>
          <span
            aria-hidden="true"
            className="bg-gradient-neon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}