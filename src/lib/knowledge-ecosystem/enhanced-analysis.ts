import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { normalizeText, uniqueKeywords, inferDifficulty } from "./text";
import type { AcquisitionCandidate } from "./types";

export interface EnhancedAnalysisResult {
  executiveSummary: string;
  technicalSummary: string;
  engineeringOverview: string;
  techStack: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    cloudProviders: string[];
    libraries: string[];
  };
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  difficultyReasoning: string;
  domains: string[];
  learningOutcomes: string[];
  architecture: {
    components: Array<{ name: string; description: string }>;
    dataFlow: string;
    systemOverview: string;
  };
}

const LANGUAGE_PATTERNS = {
  languages: [
    "python", "javascript", "typescript", "java", "go", "rust", "c\\+\\+", "c#", "php", "ruby", "swift", "kotlin", "dart", "scala", "haskell", "elixir", "clojure", "r", "matlab", "julia", "lua", "perl", "bash", "shell", "sql", "html", "css"
  ],
  frameworks: [
    "react", "vue", "angular", "svelte", "next\\.js", "nuxt", "express", "fastapi", "django", "flask", "spring", "rails", "laravel", "nest", "electron", "ionic", "flutter", "react native", " xamarin", "unity", "unreal", "godot", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "opencv", "pygame", "tkinter"
  ],
  databases: [
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "firebase", "supabase", "prisma", "sequelize", "mongoose", "typeorm", "hibernate", "jpa", "gorm", "xorm"
  ],
  cloudProviders: [
    "aws", "amazon web services", "azure", "google cloud", "gcp", "vercel", "netlify", "heroku", "digitalocean", "railway", "render", "fly\\.io", "cloudflare", "linode", "alibaba cloud", "ibm cloud", "oracle cloud"
  ],
  libraries: [
    "lodash", "axios", "moment", "date-fns", "ramda", "immutable", "rxjs", "redux", "mobx", "zustand", "jotai", "recoil", "context", "hooks", "styled-components", "emotion", "tailwind", "bootstrap", "material-ui", "ant design", "chakra", "mantine", "daisyui", "jquery", "backbone", "knockout", "ember", "meteor"
  ]
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "AI": ["artificial intelligence", "machine learning", "deep learning", "neural network", "llm", "gpt", "transformer", "nlp", "natural language processing", "computer vision", "reinforcement learning", "generative ai", "chatbot", "agent", "rag", "embedding"],
  "ML": ["machine learning", "ml", "classification", "regression", "clustering", "prediction", "model", "training", "inference", "dataset", "feature", "scikit-learn", "tensorflow", "pytorch"],
  "IoT": ["internet of things", "iot", "sensor", "arduino", "raspberry pi", "esp32", "esp8266", "embedded", "microcontroller", "firmware", "smart home", "connected device", "mqtt", "zigbee", "ble"],
  "Cybersecurity": ["security", "cybersecurity", "encryption", "cryptography", "penetration testing", "vulnerability", "malware", "firewall", "authentication", "authorization", "oauth", "jwt", "hash", "ssl", "tls", "xss", "csrf", "injection"],
  "Robotics": ["robot", "robotics", "ros", "navigation", "actuator", "servo", "motor", "slam", "path planning", "kinematics", "dynamics", "gripper", "manipulator", "autonomous", "uav", "drone"],
  "Cloud": ["cloud", "aws", "azure", "gcp", "serverless", "kubernetes", "k8s", "docker", "container", "microservices", "scalability", "elasticity", "load balancer", "cdn", "infrastructure"],
  "DevOps": ["devops", "ci-cd", "cicd", "jenkins", "github actions", "gitlab ci", "deployment", "monitoring", "logging", "prometheus", "grafana", "elk", "terraform", "ansible", "puppet", "chef", "infrastructure as code"],
  "Web": ["web", "frontend", "backend", "fullstack", "api", "rest", "graphql", "http", "websocket", "spa", "pwa", "ssr", "ssg", "jamstack", "headless", "cms"],
  "Mobile": ["mobile", "ios", "android", "react native", "flutter", "swift", "kotlin", "native", "cross-platform", "app store", "play store", "push notification", "mobile app"],
  "Research": ["research", "paper", "academic", "publication", "journal", "conference", "arxiv", "experiment", "study", "analysis", "dataset", "benchmark", "evaluation"]
};

const DIFFICULTY_INDICATORS = {
  expert: ["distributed systems", "microkernel", "compiler design", "operating system", "cryptographic protocol", "quantum computing", "advanced algorithms", "high-frequency trading", "blockchain consensus", "reinforcement learning from scratch"],
  advanced: ["kubernetes", "microservices architecture", "machine learning pipeline", "computer vision", "natural language processing", "blockchain", "cryptography", "system design", "performance optimization", "concurrent programming"],
  intermediate: ["api development", "database design", "authentication", "deployment", "testing", "version control", "docker", "basic ml", "data processing", "rest apis"],
  beginner: ["hello world", "tutorial", "basic", "intro", "getting started", "simple", "beginner", "fundamental", "learn", "crash course"]
};

export async function analyzeProjectEnhanced(queueItemId: string): Promise<EnhancedAnalysisResult> {
  assertKnowledgeFeature("aiAnalysisEngine");

  // Update status to analyzing
  await supabaseServer
    .from("content_acquisition_queue")
    .update({ ai_analysis_status: "analyzing" })
    .eq("id", queueItemId);

  try {
    // Fetch queue item
    const { data: queueItem, error: fetchError } = await supabaseServer
      .from("content_acquisition_queue")
      .select("*")
      .eq("id", queueItemId)
      .single();

    if (fetchError || !queueItem) {
      throw new Error("Queue item not found");
    }

    // Combine text for analysis
    const text = [
      queueItem.title,
      queueItem.description,
      queueItem.raw_content,
      queueItem.metadata?.topics?.join(" ") || "",
      JSON.stringify(queueItem.metadata || {})
    ].filter(Boolean).join("\n");

    const normalizedText = normalizeText(text);

    // Perform analysis
    const analysis: EnhancedAnalysisResult = {
      executiveSummary: generateExecutiveSummary(queueItem, text),
      technicalSummary: generateTechnicalSummary(queueItem, text),
      engineeringOverview: generateEngineeringOverview(queueItem, text),
      techStack: detectTechStack(normalizedText, queueItem.metadata),
      difficulty: assessDifficulty(normalizedText, queueItem.metadata),
      difficultyReasoning: generateDifficultyReasoning(normalizedText, queueItem.metadata),
      domains: classifyDomains(normalizedText),
      learningOutcomes: generateLearningOutcomes(queueItem, normalizedText),
      architecture: generateArchitectureSummary(queueItem, normalizedText)
    };

    // Update queue item with analysis results
    const { error: updateError } = await supabaseServer
      .from("content_acquisition_queue")
      .update({
        executive_summary: analysis.executiveSummary,
        technical_summary: analysis.technicalSummary,
        engineering_overview: analysis.engineeringOverview,
        tech_stack: analysis.techStack,
        difficulty: analysis.difficulty,
        difficulty_reasoning: analysis.difficultyReasoning,
        domains: analysis.domains,
        learning_outcomes: analysis.learningOutcomes,
        architecture_components: analysis.architecture.components,
        architecture_data_flow: analysis.architecture.dataFlow,
        architecture_system_overview: analysis.architecture.systemOverview,
        ai_analysis_status: "completed",
        ai_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", queueItemId);

    if (updateError) {
      throw new Error(`Failed to update analysis: ${updateError.message}`);
    }

    return analysis;
  } catch (error) {
    // Update status to failed
    await supabaseServer
      .from("content_acquisition_queue")
      .update({ ai_analysis_status: "failed" })
      .eq("id", queueItemId);
    
    throw error;
  }
}

function generateExecutiveSummary(queueItem: any, text: string): string {
  const title = queueItem.title || "This project";
  const description = queueItem.description || "";
  const provider = queueItem.provider || "GitHub";
  
  if (description) {
    return `${title} is a ${provider} repository that ${description.toLowerCase()}. This project provides practical implementation of engineering concepts and can serve as a valuable learning resource for developers and students.`;
  }
  
  return `${title} is a ${provider} repository that has been imported into the Arpit Labs platform. The project contains code and documentation that can be studied to understand practical engineering implementations and best practices.`;
}

function generateTechnicalSummary(queueItem: any, text: string): string {
  const languages = queueItem.metadata?.languages || [];
  const topics = queueItem.metadata?.topics || [];
  const stars = queueItem.metadata?.stars || 0;
  
  let summary = `This project implements a software solution using `;
  
  if (languages.length > 0) {
    summary += `${languages.slice(0, 3).join(", ")}${languages.length > 3 ? " and other technologies" : ""}`;
  } else {
    summary += "modern software development practices";
  }
  
  if (topics.length > 0) {
    summary += `. Key topics include ${topics.slice(0, 3).join(", ")}`;
  }
  
  if (stars > 0) {
    summary += `. The repository has gained ${stars} stars on GitHub, indicating community interest and validation`;
  }
  
  summary += ".";
  
  return summary;
}

function generateEngineeringOverview(queueItem: any, text: string): string {
  const title = queueItem.title || "The project";
  const hasReadme = queueItem.raw_content && queueItem.raw_content.length > 100;
  
  let overview = `${title} follows software engineering best practices with `;
  
  if (hasReadme) {
    overview += "comprehensive documentation including setup instructions, usage examples, and contribution guidelines. ";
  } else {
    overview += "basic project structure. ";
  }
  
  overview += "The codebase demonstrates practical application of design patterns, modular architecture, and maintainable code organization suitable for both learning and production use.";
  
  return overview;
}

function detectTechStack(normalizedText: string, metadata: any): EnhancedAnalysisResult["techStack"] {
  const detected = {
    languages: [] as string[],
    frameworks: [] as string[],
    databases: [] as string[],
    cloudProviders: [] as string[],
    libraries: [] as string[]
  };

  // Detect from GitHub metadata languages
  if (metadata?.languages) {
    detected.languages.push(...Object.keys(metadata.languages));
  }

  // Detect from text using patterns
  for (const [category, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    const key = category as keyof typeof detected;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, "gi");
      if (regex.test(normalizedText) && !detected[key].some(item => item.toLowerCase() === pattern.toLowerCase())) {
        detected[key].push(pattern.replace(/\\\\/g, ""));
      }
    }
  }

  // Normalize and deduplicate
  Object.keys(detected).forEach(key => {
    detected[key as keyof typeof detected] = [...new Set(detected[key as keyof typeof detected].map(item => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()))];
  });

  return detected;
}

function assessDifficulty(normalizedText: string, metadata: any): "beginner" | "intermediate" | "advanced" | "expert" {
  // Use existing difficulty inference as baseline
  const baseline = inferDifficulty(normalizedText);
  
  // Check for expert indicators
  if (DIFFICULTY_INDICATORS.expert.some(indicator => normalizedText.includes(indicator))) {
    return "expert";
  }
  
  // Check for advanced indicators
  if (DIFFICULTY_INDICATORS.advanced.some(indicator => normalizedText.includes(indicator))) {
    return "advanced";
  }
  
  // Check for intermediate indicators
  if (DIFFICULTY_INDICATORS.intermediate.some(indicator => normalizedText.includes(indicator))) {
    return "intermediate";
  }
  
  // Check for beginner indicators
  if (DIFFICULTY_INDICATORS.beginner.some(indicator => normalizedText.includes(indicator))) {
    return "beginner";
  }
  
  // Use baseline if no specific indicators found
  return baseline;
}

function generateDifficultyReasoning(normalizedText: string, metadata: any): string {
  const difficulty = assessDifficulty(normalizedText, metadata);
  const reasons: string[] = [];
  
  if (difficulty === "expert") {
    reasons.push("Implements advanced computer science concepts");
    reasons.push("Requires deep understanding of system architecture");
    reasons.push("Involves complex algorithms or distributed systems");
  } else if (difficulty === "advanced") {
    reasons.push("Requires solid programming fundamentals");
    reasons.push("Involves complex integrations and architectures");
    reasons.push("Best suited for experienced developers");
  } else if (difficulty === "intermediate") {
    reasons.push("Requires basic programming knowledge");
    reasons.push("Involves standard development practices");
    reasons.push("Good for developers with some experience");
  } else {
    reasons.push("Suitable for beginners");
    reasons.push("Focuses on fundamental concepts");
    reasons.push("Great starting point for learning");
  }
  
  // Add metadata-based reasoning
  if (metadata?.stars > 1000) {
    reasons.push("High community engagement indicates production-grade complexity");
  }
  
  if (metadata?.languages && Object.keys(metadata.languages).length > 3) {
    reasons.push("Multiple languages indicate polyglot architecture");
  }
  
  return reasons.join(". ") + ".";
}

function classifyDomains(normalizedText: string): string[] {
  const detectedDomains: string[] = [];
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => normalizedText.includes(keyword)).length;
    if (matchCount >= 2) {
      detectedDomains.push(domain);
    }
  }
  
  // Always include at least one domain
  if (detectedDomains.length === 0) {
    detectedDomains.push("Web"); // Default fallback
  }
  
  return detectedDomains;
}

function generateLearningOutcomes(queueItem: any, normalizedText: string): string[] {
  const domains = classifyDomains(normalizedText);
  const techStack = detectTechStack(normalizedText, queueItem.metadata);
  const outcomes: string[] = [];
  
  // Domain-specific outcomes
  if (domains.includes("AI") || domains.includes("ML")) {
    outcomes.push("Understand machine learning concepts and model training pipelines");
    outcomes.push("Learn to work with AI/ML frameworks and libraries");
  }
  
  if (domains.includes("IoT")) {
    outcomes.push("Gain experience with embedded systems and sensor integration");
    outcomes.push("Learn IoT communication protocols and edge computing");
  }
  
  if (domains.includes("Cybersecurity")) {
    outcomes.push("Understand security best practices and vulnerability assessment");
    outcomes.push("Learn encryption, authentication, and secure coding practices");
  }
  
  if (domains.includes("Cloud") || domains.includes("DevOps")) {
    outcomes.push("Gain experience with cloud services and infrastructure");
    outcomes.push("Learn CI/CD pipelines and deployment automation");
  }
  
  // Tech stack outcomes
  if (techStack.languages.length > 0) {
    outcomes.push(`Develop proficiency in ${techStack.languages.slice(0, 2).join(" and ")}`);
  }
  
  if (techStack.frameworks.length > 0) {
    outcomes.push(`Learn to use ${techStack.frameworks.slice(0, 2).join(" and ")} frameworks`);
  }
  
  // General engineering outcomes
  outcomes.push("Understand software architecture and design patterns");
  outcomes.push("Practice version control and collaborative development");
  outcomes.push("Learn to write maintainable and documented code");
  
  // Limit to 6 outcomes
  return outcomes.slice(0, 6);
}

function generateArchitectureSummary(queueItem: any, normalizedText: string): EnhancedAnalysisResult["architecture"] {
  const techStack = detectTechStack(normalizedText, queueItem.metadata);
  const domains = classifyDomains(normalizedText);
  
  // Generate components based on tech stack
  const components: Array<{ name: string; description: string }> = [];
  
  if (techStack.frameworks.some(f => f.toLowerCase().includes("react") || f.toLowerCase().includes("vue") || f.toLowerCase().includes("angular"))) {
    components.push({ name: "Frontend UI", description: "User interface built with modern JavaScript framework" });
  }
  
  if (techStack.frameworks.some(f => f.toLowerCase().includes("express") || f.toLowerCase().includes("fastapi") || f.toLowerCase().includes("django"))) {
    components.push({ name: "Backend API", description: "RESTful API server for business logic" });
  }
  
  if (techStack.databases.length > 0) {
    components.push({ name: "Data Layer", description: `Data persistence using ${techStack.databases[0]}` });
  }
  
  if (domains.includes("AI") || domains.includes("ML")) {
    components.push({ name: "ML Model", description: "Machine learning model for predictions or classifications" });
  }
  
  if (domains.includes("IoT")) {
    components.push({ name: "Device Interface", description: "Hardware abstraction layer for sensor/actuator communication" });
  }
  
  // Add generic components if none detected
  if (components.length === 0) {
    components.push(
      { name: "Application Core", description: "Main application logic and processing" },
      { name: "Data Management", description: "Data storage and retrieval system" },
      { name: "User Interface", description: "Interaction layer for end users" }
    );
  }
  
  // Generate data flow description
  let dataFlow = "Data flows through the system in the following pattern: ";
  if (components.length >= 2) {
    dataFlow += components.map(c => c.name).join(" → ");
  } else {
    dataFlow += "User input → Processing → Response";
  }
  
  // Generate system overview
  const systemOverview = `This project implements a ${domains[0] || "software"} solution with a ${components.length}-component architecture. The system is designed to be modular and maintainable, with clear separation of concerns between different layers. Technology choices prioritize modern best practices and community support.`;
  
  return {
    components,
    dataFlow,
    systemOverview
  };
}
