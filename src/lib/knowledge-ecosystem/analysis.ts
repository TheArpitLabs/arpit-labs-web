import type { AcquisitionCandidate, AnalysisResult } from "./types";
import { inferDifficulty, uniqueKeywords } from "./text";

const TECHNOLOGY_HINTS = [
  "python",
  "typescript",
  "javascript",
  "react",
  "next.js",
  "supabase",
  "arduino",
  "raspberry pi",
  "opencv",
  "yolo",
  "tensorflow",
  "pytorch",
  "postgres",
  "redis",
  "docker",
  "kubernetes",
  "mcp",
];

const DOMAIN_HINTS: Array<[string, string[]]> = [
  ["AI Agents", ["agent", "tool", "mcp", "llm", "rag"]],
  ["Computer Vision", ["opencv", "vision", "image", "yolo", "camera"]],
  ["IoT", ["arduino", "sensor", "iot", "esp32", "raspberry"]],
  ["Cybersecurity", ["security", "threat", "vulnerability", "malware", "encryption"]],
  ["Robotics", ["robot", "ros", "navigation", "actuator", "slam"]],
  ["Edge AI", ["edge", "tinyml", "embedded", "on-device"]],
];

export function analyzeCandidate(candidate: AcquisitionCandidate): AnalysisResult {
  const text = [candidate.title, candidate.description, candidate.rawContent].filter(Boolean).join("\n");
  const normalized = text.toLowerCase();
  const technologies = TECHNOLOGY_HINTS.filter((tech) => normalized.includes(tech));
  const skills = uniqueKeywords(text, 8).map((keyword) => keyword.replace(/\b\w/g, (match) => match.toUpperCase()));
  const domain = DOMAIN_HINTS.find(([, terms]) => terms.some((term) => normalized.includes(term)))?.[0] ?? "Engineering";
  const difficulty = inferDifficulty(text);

  return {
    summary: candidate.description || `${candidate.title} is an engineering resource imported from ${candidate.provider}.`,
    technologies,
    skills,
    domain,
    difficulty,
    architectureOverview: buildArchitectureOverview(candidate, technologies),
    learningOutcomes: buildLearningOutcomes(domain, technologies, skills),
  };
}

function buildArchitectureOverview(candidate: AcquisitionCandidate, technologies: string[]) {
  const stack = technologies.length > 0 ? technologies.join(", ") : "the published implementation details";
  return `${candidate.title} is modeled as a ${candidate.provider} knowledge asset with source metadata, structured analysis, duplicate checks, and optional graph links. The implementation stack is inferred from ${stack}.`;
}

function buildLearningOutcomes(domain: string, technologies: string[], skills: string[]) {
  const outcomes = [
    `Understand the core ${domain} problem space.`,
    "Evaluate documentation, implementation quality, and maintainability signals.",
    "Map the resource to adjacent projects, papers, datasets, APIs, and contributors.",
  ];

  if (technologies[0]) outcomes.push(`Practice with ${technologies.slice(0, 3).join(", ")}.`);
  if (skills[0]) outcomes.push(`Build fluency in ${skills.slice(0, 3).join(", ")}.`);
  return outcomes.slice(0, 5);
}
