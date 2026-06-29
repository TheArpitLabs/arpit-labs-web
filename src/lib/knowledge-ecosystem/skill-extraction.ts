import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { tokenize, uniqueKeywords } from "./text";
import { logger } from '@/lib/logger';

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  description?: string;
  relatedSkills: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillExtractionResult {
  skills: string[];
  skillLevels: Record<string, "beginner" | "intermediate" | "advanced" | "expert">;
  categories: Record<string, string[]>;
}

/**
 * Skill Extraction Engine
 * Extracts skills from projects, research, resources, technologies, and contributors
 */
export class SkillExtractionEngine {
  private skillDatabase = {
    technologies: [
      "Arduino", "Raspberry Pi", "ESP32", "STM32", "AVR",
      "Python", "JavaScript", "TypeScript", "Go", "Rust", "C++", "Java",
      "React", "Vue", "Angular", "Next.js", "Node.js", "Express",
      "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy",
      "OpenCV", "YOLO", "Darknet", "Caffe", "MXNet",
      "Docker", "Kubernetes", "AWS", "Azure", "GCP",
      "PostgreSQL", "MongoDB", "Redis", "MySQL", "SQLite",
      "GraphQL", "REST", "gRPC", "WebSocket",
      "Linux", "Git", "CI/CD", "DevOps",
    ],
    frameworks: [
      "Express", "Django", "Flask", "Spring", "Rails",
      "Next.js", "Nuxt.js", "Gatsby", "Remix",
      "Electron", "Capacitor", "Ionic",
      "React Native", "Flutter",
    ],
    domains: [
      "Embedded Systems", "Computer Vision", "Machine Learning",
      "Deep Learning", "Cybersecurity", "IoT", "Robotics",
      "Cloud Computing", "DevOps", "Data Science",
      "Web Development", "Mobile Development", "Blockchain",
      "Quantum Computing", "AR/VR", "Edge AI",
    ],
    tools: [
      "Git", "Docker", "Kubernetes", "Jenkins", "GitHub Actions",
      "VS Code", "PyCharm", "IntelliJ", "Android Studio",
      "Figma", "Postman", "Wireshark", "Burp Suite",
    ],
  };

  /**
   * Extract skills from content
   */
  async extractSkills(content: string, sourceType: string): Promise<SkillExtractionResult> {
    const tokens = tokenize(content);
    const keywords = Array.from(new Set(tokens));

    const skills: string[] = [];
    const skillLevels: Record<string, "beginner" | "intermediate" | "advanced" | "expert"> = {};
    const categories: Record<string, string[]> = {
      technologies: [],
      frameworks: [],
      domains: [],
      tools: [],
    };

    // Extract technologies
    this.skillDatabase.technologies.forEach(tech => {
      const normalizedTech = tech.toLowerCase();
      if (keywords.some(k => k.toLowerCase().includes(normalizedTech) || normalizedTech.includes(k.toLowerCase()))) {
        skills.push(tech);
        categories.technologies.push(tech);
        skillLevels[tech] = this.inferSkillLevel(content, tech);
      }
    });

    // Extract frameworks
    this.skillDatabase.frameworks.forEach(framework => {
      const normalizedFramework = framework.toLowerCase();
      if (keywords.some(k => k.toLowerCase().includes(normalizedFramework) || normalizedFramework.includes(k.toLowerCase()))) {
        skills.push(framework);
        categories.frameworks.push(framework);
        skillLevels[framework] = this.inferSkillLevel(content, framework);
      }
    });

    // Extract domains
    this.skillDatabase.domains.forEach(domain => {
      const normalizedDomain = domain.toLowerCase();
      if (keywords.some(k => k.toLowerCase().includes(normalizedDomain) || normalizedDomain.includes(k.toLowerCase()))) {
        skills.push(domain);
        categories.domains.push(domain);
        skillLevels[domain] = this.inferSkillLevel(content, domain);
      }
    });

    // Extract tools
    this.skillDatabase.tools.forEach(tool => {
      const normalizedTool = tool.toLowerCase();
      if (keywords.some(k => k.toLowerCase().includes(normalizedTool) || normalizedTool.includes(k.toLowerCase()))) {
        skills.push(tool);
        categories.tools.push(tool);
        skillLevels[tool] = this.inferSkillLevel(content, tool);
      }
    });

    return {
      skills: [...new Set(skills)],
      skillLevels,
      categories,
    };
  }

  /**
   * Infer skill level from content
   */
  private inferSkillLevel(content: string, skill: string): "beginner" | "intermediate" | "advanced" | "expert" {
    const normalizedContent = content.toLowerCase();
    const normalizedSkill = skill.toLowerCase();

    // Advanced indicators
    const advancedIndicators = ["advanced", "expert", "complex", "architecture", "optimization", "scalability"];
    if (advancedIndicators.some(indicator => normalizedContent.includes(indicator))) {
      return "advanced";
    }

    // Expert indicators
    const expertIndicators = ["production", "enterprise", "distributed", "microservices", "high-performance"];
    if (expertIndicators.some(indicator => normalizedContent.includes(indicator))) {
      return "expert";
    }

    // Beginner indicators
    const beginnerIndicators = ["beginner", "intro", "basic", "tutorial", "getting started", "hello world"];
    if (beginnerIndicators.some(indicator => normalizedContent.includes(indicator))) {
      return "beginner";
    }

    // Default to intermediate
    return "intermediate";
  }

  /**
   * Store skill in database
   */
  async upsertSkill(skill: Omit<Skill, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const { data, error } = await supabaseServer
      .from("skills")
      .upsert({
        name: skill.name,
        category: skill.category,
        level: skill.level,
        description: skill.description,
        related_skills: skill.relatedSkills,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to upsert skill:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Get skill by name
   */
  async getSkill(name: string): Promise<Skill | null> {
    const { data, error } = await supabaseServer
      .from("skills")
      .select("*")
      .ilike("name", name)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      level: data.level,
      description: data.description,
      relatedSkills: data.related_skills || "",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Extract and store skills from a project
   */
  async extractAndStoreProjectSkills(projectId: string): Promise<SkillExtractionResult> {
    assertKnowledgeFeature("learningPaths");

    const { data: project } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    const content = [project.title, project.description, project.overview, project.architecture].filter(Boolean).join("\n");
    const extraction = await this.extractSkills(content, "project");

    // Store skills
    for (const skillName of extraction.skills) {
      const category = Object.entries(extraction.categories).find(([_, skills]) => skills.includes(skillName))?.[0] || "general";
      
      await this.upsertSkill({
        name: skillName,
        category,
        level: extraction.skillLevels[skillName] || "intermediate",
        description: `Skill extracted from project: ${project.title}`,
        relatedSkills: extraction.skills.filter(s => s !== skillName).slice(0, 5).join(","),
      });

      // Create skill-project relationship
      await this.createSkillProjectRelationship(skillName, projectId);
    }

    return extraction;
  }

  /**
   * Create skill-project relationship
   */
  private async createSkillProjectRelationship(skillName: string, projectId: string): Promise<void> {
    const skill = await this.getSkill(skillName);
    if (!skill) return;

    const { error } = await supabaseServer.from("skill_relationships").upsert({
      skill_id: skill.id,
      related_entity_id: projectId,
      related_entity_type: "project",
      relationship_type: "requires",
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error("Failed to create skill-project relationship:", error);
    }
  }

  /**
   * Get skills for a project
   */
  async getProjectSkills(projectId: string): Promise<Skill[]> {
    const { data } = await supabaseServer
      .from("skill_relationships")
      .select("skill_id, skills(*)")
      .eq("related_entity_id", projectId)
      .eq("related_entity_type", "project");

    if (!data) return [];

    return data.map((r: any) => ({
      id: r.skills.id,
      name: r.skills.name,
      category: r.skills.category,
      level: r.skills.level,
      description: r.skills.description,
      relatedSkills: r.skills.related_skills || "",
      createdAt: r.skills.created_at,
      updatedAt: r.skills.updated_at,
    }));
  }

  /**
   * Get all skills by category
   */
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    const { data } = await supabaseServer
      .from("skills")
      .select("*")
      .eq("category", category)
      .order("name");

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      level: d.level,
      description: d.description,
      relatedSkills: d.related_skills || "",
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }
}

// Singleton instance
export const skillExtractionEngine = new SkillExtractionEngine();
