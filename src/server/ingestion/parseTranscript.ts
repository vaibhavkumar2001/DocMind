export type Segment = { startSeconds: number | null; text: string };
export type TranscriptChunk = {
  startSeconds: number | null;
  content: string;
  chunkIndex: number;
};

// Video chunks are small (about 40 seconds of speech) so timestamps stay precise
export const VIDEO_CHUNK_WORDS = 100;

// 1:02:03, 12:34 or 00:12.500 -> seconds
function toSeconds(h: string | undefined, m: string, s: string) {
  return (h ? Number(h) * 3600 : 0) + Number(m) * 60 + Number(s);
}

// SRT / VTT timing line, e.g. 00:00:01,000 --> 00:00:04,000
const CUE = /^\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[.,]\d{1,3}\s*-->/;
// A plain line that starts with a timestamp, e.g. "0:45 text" or "[12:30] text"
const LINE = /^\s*[\[(]?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[\])]?[\s\-–:]*(.*)$/;

function stripMarkup(text: string) {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function parseTranscript(raw: string): Segment[] {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const segments: Segment[] = [];
  let current: Segment | null = null;

  if (lines.some((l) => CUE.test(l))) {
    // SRT / VTT: a timing line followed by text lines, ended by a blank line
    for (const line of lines) {
      const cue = CUE.exec(line);
      if (cue) {
        if (current) segments.push(current);
        current = { startSeconds: toSeconds(cue[1], cue[2], cue[3]), text: "" };
      } else if (current) {
        if (!line.trim()) {
          segments.push(current);
          current = null;
        } else {
          current.text += " " + line;
        }
      }
    }
  } else {
    // Plain text: a line with a leading timestamp starts a new segment
    for (const line of lines) {
      const m = LINE.exec(line);
      if (m) {
        if (current) segments.push(current);
        current = { startSeconds: toSeconds(m[1], m[2], m[3]), text: m[4] };
      } else if (line.trim()) {
        if (!current) current = { startSeconds: null, text: "" };
        current.text += " " + line;
      }
    }
  }
  if (current) segments.push(current);

  return segments
    .map((s) => ({ ...s, text: stripMarkup(s.text) }))
    .filter((s) => s.text.length > 0);
}

// Groups segments into chunks of roughly `size` words; each chunk keeps the start time of its first segment
export function chunkSegments(segments: Segment[], size = VIDEO_CHUNK_WORDS): TranscriptChunk[] {
  const out: TranscriptChunk[] = [];
  let buf: string[] = [];
  let bufStart: number | null = null;
  let words = 0;

  const flush = () => {
    if (buf.length > 0) {
      out.push({ startSeconds: bufStart, content: buf.join(" "), chunkIndex: out.length });
    }
    buf = [];
    bufStart = null;
    words = 0;
  };

  for (const seg of segments) {
    const w = seg.text.split(/\s+/).filter(Boolean);
    if (w.length === 0) continue;

    // A very long segment (for example plain text without timestamps): split with overlap
    if (w.length > size) {
      flush();
      const step = Math.max(size - 20, 1);
      for (let i = 0; i < w.length; i += step) {
        out.push({
          startSeconds: seg.startSeconds,
          content: w.slice(i, i + size).join(" "),
          chunkIndex: out.length,
        });
        if (i + size >= w.length) break;
      }
      continue;
    }

    if (words + w.length > size) flush();
    if (buf.length === 0) bufStart = seg.startSeconds;
    buf.push(w.join(" "));
    words += w.length;
  }
  flush();

  return out;
}