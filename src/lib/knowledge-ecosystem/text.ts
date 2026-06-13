import { createHash } from "crypto";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "using",
  "your",
  "about",
  "are",
  "was",
  "were",
  "has",
  "have",
  "will",
]);

export function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
}

export function tokenize(value: string | null | undefined) {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function uniqueKeywords(value: string | null | undefined, limit = 12) {
  return Array.from(new Set(tokenize(value))).slice(0, limit);
}

export function contentHash(value: string | null | undefined) {
  return createHash("sha256").update(normalizeText(value)).digest("hex");
}

export function jaccardSimilarity(left: string | null | undefined, right: string | null | undefined) {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = Array.from(a).filter((token) => b.has(token)).length;
  const union = new Set([...Array.from(a), ...Array.from(b)]).size;
  return intersection / union;
}

export function inferDifficulty(text: string): "beginner" | "intermediate" | "advanced" {
  const normalized = normalizeText(text);
  const advanced = ["distributed", "kubernetes", "transformer", "compiler", "optimization", "reinforcement", "cryptography"];
  const intermediate = ["api", "database", "computer vision", "iot", "robotics", "dashboard", "deployment"];
  if (advanced.some((term) => normalized.includes(term))) return "advanced";
  if (intermediate.some((term) => normalized.includes(term))) return "intermediate";
  return "beginner";
}
