import { NextRequest } from "next/server";

export const runtime = "edge";

const palette = [
  ["#0f172a", "#2563eb", "#22c55e"],
  ["#111827", "#7c3aed", "#06b6d4"],
  ["#18181b", "#dc2626", "#f59e0b"],
  ["#0b1120", "#0f766e", "#84cc16"],
  ["#171717", "#9333ea", "#e11d48"],
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename: requestedFilename } = await params;
  const filename = requestedFilename || "project-cover";
  const title = titleFromFilename(filename);
  const colors = palette[hash(filename) % palette.length];
  const origin = new URL(request.url).origin;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="675" fill="${colors[0]}"/>
  <circle cx="1000" cy="120" r="260" fill="${colors[1]}" opacity="0.34"/>
  <circle cx="170" cy="620" r="300" fill="${colors[2]}" opacity="0.28"/>
  <path d="M0 540C170 470 310 520 455 455C620 381 730 235 1200 282V675H0V540Z" fill="white" opacity="0.08"/>
  <rect x="84" y="82" width="1032" height="511" rx="32" fill="white" opacity="0.08" stroke="white" stroke-opacity="0.18"/>
  <text x="110" y="154" fill="white" opacity="0.68" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6">ARPIT LABS</text>
  <text x="110" y="356" fill="white" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="800">${escapeXml(title)}</text>
  <text x="110" y="430" fill="white" opacity="0.72" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="500">Engineering project showcase</text>
  <text x="110" y="525" fill="white" opacity="0.5" font-family="Inter, Arial, sans-serif" font-size="22">${escapeXml(origin.replace(/^https?:\/\//, ""))}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

function titleFromFilename(filename: string) {
  return filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-cover$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .slice(0, 42);
}

function hash(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[char];
  });
}
