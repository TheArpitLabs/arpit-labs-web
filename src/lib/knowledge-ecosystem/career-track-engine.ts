import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";

export interface CareerTrack {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  recommendedSkills: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  estimatedDuration: number;
  domains: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CareerPath {
  trackId: string;
  trackName: string;
  stages: Array<{
    name: string;
    skills: string[];
    projects: string[];
    estimatedTime: number;
  }>;
}

/**
 * Career Track Engine
 * Manages career tracks and skill progression
 */
export class CareerTrackEngine {
  private careerTracks: Map<string, CareerTrack> = new Map();

  /**
   * Initialize default career tracks
   */
  async initializeDefaultTracks(): Promise<void> {
    assertKnowledgeFeature("learningPaths");

    const tracks: Omit<CareerTrack, "id" | "createdAt" | "updatedAt">[] = [
      {
        name: "AI Engineer",
        description: "Build intelligent systems using machine learning, deep learning, and AI technologies",
        requiredSkills: ["Python", "Machine Learning", "TensorFlow", "Deep Learning"],
        recommendedSkills: ["PyTorch", "Computer Vision", "NLP", "MLOps"],
        difficulty: "advanced",
        estimatedDuration: 120,
        domains: ["AI", "Machine Learning", "Deep Learning"],
      },
      {
        name: "Cybersecurity Engineer",
        description: "Protect systems and networks from cyber threats and vulnerabilities",
        requiredSkills: ["Linux", "Networking", "Security", "Penetration Testing"],
        recommendedSkills: ["Cryptography", "Malware Analysis", "Incident Response", "Cloud Security"],
        difficulty: "advanced",
        estimatedDuration: 100,
        domains: ["Cybersecurity", "Network Security", "Information Security"],
      },
      {
        name: "IoT Engineer",
        description: "Design and implement Internet of Things systems and embedded solutions",
        requiredSkills: ["Arduino", "Embedded Systems", "C++", "Sensors"],
        recommendedSkills: ["Raspberry Pi", "ESP32", "Wireless Communication", "Edge Computing"],
        difficulty: "intermediate",
        estimatedDuration: 80,
        domains: ["IoT", "Embedded Systems", "Hardware"],
      },
      {
        name: "Robotics Engineer",
        description: "Design, build, and program robots for various applications",
        requiredSkills: ["C++", "Python", "Embedded Systems", "Control Systems"],
        recommendedSkills: ["ROS", "Computer Vision", "SLAM", "Mechatronics"],
        difficulty: "advanced",
        estimatedDuration: 120,
        domains: ["Robotics", "Embedded Systems", "AI"],
      },
      {
        name: "Cloud Engineer",
        description: "Design and manage cloud infrastructure and services",
        requiredSkills: ["Linux", "Networking", "Docker", "Kubernetes"],
        recommendedSkills: ["AWS", "Azure", "GCP", "Terraform", "CI/CD"],
        difficulty: "intermediate",
        estimatedDuration: 90,
        domains: ["Cloud Computing", "DevOps", "Infrastructure"],
      },
      {
        name: "Data Engineer",
        description: "Build and maintain data pipelines and infrastructure",
        requiredSkills: ["Python", "SQL", "Data Warehousing", "ETL"],
        recommendedSkills: ["Apache Spark", "Airflow", "Kafka", "Cloud Data Platforms"],
        difficulty: "intermediate",
        estimatedDuration: 100,
        domains: ["Data Engineering", "Big Data", "Data Science"],
      },
      {
        name: "Software Engineer",
        description: "Design, develop, and maintain software applications",
        requiredSkills: ["Programming Fundamentals", "JavaScript", "Python", "Git"],
        recommendedSkills: ["React", "Node.js", "Database Design", "Testing"],
        difficulty: "beginner",
        estimatedDuration: 60,
        domains: ["Web Development", "Software Development", "Programming"],
      },
      {
        name: "Research Scientist",
        description: "Conduct research and develop new technologies and methodologies",
        requiredSkills: ["Python", "Machine Learning", "Research Methods", "Statistics"],
        recommendedSkills: ["Deep Learning", "NLP", "Computer Vision", "Academic Writing"],
        difficulty: "expert",
        estimatedDuration: 150,
        domains: ["Research", "AI", "Data Science"],
      },
    ];

    for (const track of tracks) {
      await this.upsertCareerTrack(track);
    }
  }

  /**
   * Create or update career track
   */
  async upsertCareerTrack(track: Omit<CareerTrack, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const { data, error } = await supabaseServer
      .from("career_tracks")
      .upsert({
        name: track.name,
        description: track.description,
        required_skills: track.requiredSkills,
        recommended_skills: track.recommendedSkills,
        difficulty: track.difficulty,
        estimated_duration: track.estimatedDuration,
        domains: track.domains,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to upsert career track:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * Get all career tracks
   */
  async getAllCareerTracks(): Promise<CareerTrack[]> {
    const { data } = await supabaseServer
      .from("career_tracks")
      .select("*")
      .order("name");

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      requiredSkills: d.required_skills || [],
      recommendedSkills: d.recommended_skills || [],
      difficulty: d.difficulty,
      estimatedDuration: d.estimated_duration,
      domains: d.domains || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get career track by ID
   */
  async getCareerTrack(trackId: string): Promise<CareerTrack | null> {
    const { data } = await supabaseServer
      .from("career_tracks")
      .select("*")
      .eq("id", trackId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      requiredSkills: data.required_skills || [],
      recommendedSkills: data.recommended_skills || [],
      difficulty: data.difficulty,
      estimatedDuration: data.estimated_duration,
      domains: data.domains || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get career path for a track
   */
  async getCareerPath(trackId: string): Promise<CareerPath> {
    const track = await this.getCareerTrack(trackId);
    if (!track) {
      throw new Error("Career track not found");
    }

    // Build career path stages
    const stages = [
      {
        name: "Foundation",
        skills: track.requiredSkills.slice(0, 3),
        projects: [],
        estimatedTime: track.estimatedDuration * 0.2,
      },
      {
        name: "Intermediate",
        skills: [...track.requiredSkills.slice(3), ...track.recommendedSkills.slice(0, 2)],
        projects: [],
        estimatedTime: track.estimatedDuration * 0.4,
      },
      {
        name: "Advanced",
        skills: track.recommendedSkills.slice(2),
        projects: [],
        estimatedTime: track.estimatedDuration * 0.4,
      },
    ];

    return {
      trackId,
      trackName: track.name,
      stages,
    };
  }

  /**
   * Recommend career tracks based on skills
   */
  async recommendCareerTracks(userSkills: string[]): Promise<CareerTrack[]> {
    const allTracks = await this.getAllCareerTracks();

    // Score tracks based on skill overlap
    const scoredTracks = allTracks.map(track => {
      const requiredOverlap = track.requiredSkills.filter(skill =>
        userSkills.some(userSkill =>
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      ).length;

      const recommendedOverlap = track.recommendedSkills.filter(skill =>
        userSkills.some(userSkill =>
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      ).length;

      const score = (requiredOverlap * 2) + recommendedOverlap;

      return {
        ...track,
        score,
      };
    });

    // Sort by score and return top recommendations
    scoredTracks.sort((a, b) => (b as any).score - (a as any).score);

    return scoredTracks.slice(0, 5);
  }

  /**
   * Get user progress for a career track
   */
  async getCareerTrackProgress(trackId: string, userSkills: string[]): Promise<{
    track: CareerTrack;
    progress: number;
    completedSkills: string[];
    missingSkills: string[];
    recommendedSkills: string[];
  }> {
    const track = await this.getCareerTrack(trackId);
    if (!track) {
      throw new Error("Career track not found");
    }

    const completedSkills = track.requiredSkills.filter(skill =>
      userSkills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const missingSkills = track.requiredSkills.filter(skill =>
      !userSkills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const recommendedSkills = track.recommendedSkills.filter(skill =>
      !userSkills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const progress = (completedSkills.length / track.requiredSkills.length) * 100;

    return {
      track,
      progress,
      completedSkills,
      missingSkills,
      recommendedSkills,
    };
  }

  /**
   * Get projects for a career track
   */
  async getProjectsForCareerTrack(trackId: string, limit: number = 10): Promise<any[]> {
    const track = await this.getCareerTrack(trackId);
    if (!track) {
      throw new Error("Career track not found");
    }

    // Find projects that match the track's skills
    const { data } = await supabaseServer
      .from("projects")
      .select("*")
      .limit(limit * 10);

    if (!data) return [];

    // Score projects based on skill overlap
    const scoredProjects = (data as any[]).map(project => {
      const projectSkills = project.tech_stack || [];
      const overlap = projectSkills.filter((skill: string) =>
        [...track.requiredSkills, ...track.recommendedSkills].some(trackSkill =>
          trackSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(trackSkill.toLowerCase())
        )
      ).length;

      return {
        ...project,
        score: overlap,
      };
    });

    // Sort by score and return top projects
    scoredProjects.sort((a, b) => b.score - a.score);

    return scoredProjects.slice(0, limit);
  }
}

// Singleton instance
export const careerTrackEngine = new CareerTrackEngine();
