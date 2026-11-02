"use client";

import { useEffect, useState } from "react";

const LINE_ONE = ["Chat", "with", "your", "documents."];
const LINE_TWO = ["Trust", "every", "answer."];

// Delay between each word appearing (seconds)
const WORD_STAGGER = 0.18;
// How long the full headline stays visible before it fades out (ms)
const HOLD_MS = 5500;
// Duration of the fade-out (ms)
const FADE_OUT_MS = 700;

export default function AnimatedHeadline() {
  // "in" = words are appearing/visible, "out" = whole headline is fading away
  const [phase, setPhase] = useState<"in" | "out">("in");
  // Changing the key re-mounts the words, which replays the entrance animation
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (phase === "in") {
          setPhase("out");
        } else {
          setCycle((c) => c + 1);
          setPhase("in");
        }
      },
      phase === "in" ? HOLD_MS : FADE_OUT_MS,
    );
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <h1
      aria-label="Chat with your documents. Trust every answer."
      className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl"
    >
      <span
        key={cycle}
        aria-hidden="true"
        className="block transition-all duration-700 ease-out"
        style={
          phase === "out"
            ? { opacity: 0, filter: "blur(8px)", transform: "translateY(-8px)" }
            : undefined
        }
      >
        {LINE_ONE.map((word, i) => (
          <span key={word} className="inline-block">
            <span
              className="animate-word-in inline-block"
              style={{ animationDelay: `${i * WORD_STAGGER}s` }}
            >
              {word}
            </span>
            {/* Plain space between words */}
            {" "}
          </span>
        ))}
        <br />
        {LINE_TWO.map((word, i) => (
          <span key={word} className="inline-block">
            <span
              className="animate-word-in text-gradient inline-block"
              style={{ animationDelay: `${(LINE_ONE.length + i) * WORD_STAGGER}s` }}
            >
              {word}
            </span>
            {" "}
          </span>
        ))}
      </span>
    </h1>
  );
}