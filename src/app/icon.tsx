import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Generates the browser tab icon: a white "D" on the violet-to-cyan gradient
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
          borderRadius: 8,
          color: "white",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        D
      </div>
    ),
    { ...size },
  );
}