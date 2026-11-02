import { ImageResponse } from "next/og";

export const alt = "DocMind: chat with your documents and trust every answer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generates the preview card shown when the link is shared on WhatsApp, LinkedIn, X, etc.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(circle at 15% 0%, rgba(139,92,246,0.45), transparent 55%), radial-gradient(circle at 95% 10%, rgba(34,211,238,0.30), transparent 50%), #07080f",
          color: "#e8e9f5",
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              background: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
              color: "white",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>DocMind</div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.1 }}>
            Chat with your documents.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#a78bfa",
            }}
          >
            Trust every answer.
          </div>
        </div>

        {/* Citation chips */}
        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              border: "2px solid #23264a",
              background: "#1c1540",
              color: "#c4b5fd",
              fontSize: 28,
            }}
          >
            q3-report.pdf · p. 12
          </div>
          <div
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              border: "2px solid #23264a",
              background: "#1c1540",
              color: "#c4b5fd",
              fontSize: 28,
            }}
          >
            review-call.mp4 · 04:32
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}