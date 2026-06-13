import type { AcquisitionCandidate, QualityScore, TrustScore } from "./types";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateQualityScore(candidate: AcquisitionCandidate): QualityScore {
  const text = [candidate.description, candidate.rawContent].filter(Boolean).join("\n");
  const documentation = text.length > 1200 ? 90 : text.length > 500 ? 72 : text.length > 160 ? 48 : 20;
  const architecture = /architecture|diagram|component|service|database|pipeline/i.test(text) ? 82 : 45;
  const codeQuality = /test|lint|ci|coverage|typed|modular/i.test(text) ? 80 : 52;
  const activity = candidate.metadata?.updatedAt || candidate.metadata?.stars ? 76 : 44;
  const maintainability = /setup|install|usage|contributing|license/i.test(text) ? 78 : 46;
  const score = clamp(documentation * 0.25 + architecture * 0.2 + codeQuality * 0.2 + activity * 0.15 + maintainability * 0.2);

  return { score, documentation, architecture, codeQuality, activity, maintainability };
}

export function calculateTrustScore(candidate: AcquisitionCandidate): TrustScore {
  const hasAuthor = Boolean(candidate.author);
  const metadata = candidate.metadata ?? {};
  const verifiedAuthor = hasAuthor || metadata.verified ? 78 : 35;
  const openSourceActivity = Number(metadata.stars ?? 0) > 10 || Number(metadata.forks ?? 0) > 2 ? 82 : 48;
  const documentationQuality = calculateQualityScore(candidate).documentation;
  const communityEngagement = Number(metadata.comments ?? 0) > 0 || Number(metadata.likes ?? 0) > 5 ? 76 : 42;
  const score = clamp(verifiedAuthor * 0.25 + openSourceActivity * 0.25 + documentationQuality * 0.25 + communityEngagement * 0.25);

  return { score, verifiedAuthor, openSourceActivity, documentationQuality, communityEngagement };
}
