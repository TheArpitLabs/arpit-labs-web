import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { skillExtractionEngine } from "@/lib/knowledge-ecosystem/skill-extraction";
import { prerequisiteEngine } from "@/lib/knowledge-ecosystem/prerequisite-engine";
import { learningPathGenerator } from "@/lib/knowledge-ecosystem/learning-path-generator";
import { careerTrackEngine } from "@/lib/knowledge-ecosystem/career-track-engine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const projectId = searchParams.get("projectId");
    const pathType = searchParams.get("pathType") || "intermediate";
    const trackId = searchParams.get("trackId");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (action) {
      case "skills":
        if (!projectId) {
          return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
        }
        const skills = await skillExtractionEngine.getProjectSkills(projectId);
        return NextResponse.json({ success: true, result: skills });

      case "prerequisites":
        if (!projectId) {
          return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
        }
        const projectSkills = await skillExtractionEngine.getProjectSkills(projectId);
        const prerequisites = await Promise.all(
          projectSkills.map(skill => prerequisiteEngine.getPrerequisites(skill.id))
        );
        return NextResponse.json({ success: true, result: prerequisites.flat() });

      case "learning-path":
        if (!projectId) {
          return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
        }
        const learningPath = await learningPathGenerator.getProjectLearningPath(projectId, pathType as any);
        return NextResponse.json({ success: true, result: learningPath });

      case "career-tracks":
        const careerTracks = await careerTrackEngine.getAllCareerTracks();
        return NextResponse.json({ success: true, result: careerTracks });

      case "career-track":
        if (!trackId) {
          return NextResponse.json({ success: false, error: "trackId is required" }, { status: 400 });
        }
        const careerTrack = await careerTrackEngine.getCareerTrack(trackId);
        return NextResponse.json({ success: true, result: careerTrack });

      case "career-path":
        if (!trackId) {
          return NextResponse.json({ success: false, error: "trackId is required" }, { status: 400 });
        }
        const careerPath = await careerTrackEngine.getCareerPath(trackId);
        return NextResponse.json({ success: true, result: careerPath });

      case "user-progress":
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
        }
        const userProgress = await getUserLearningProgress(userId);
        return NextResponse.json({ success: true, result: userProgress });

      case "recommendations":
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
        }
        const recommendations = await getLearningRecommendations(userId, limit);
        return NextResponse.json({ success: true, result: recommendations });

      case "project-outcomes":
        if (!projectId) {
          return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
        }
        const outcomes = await learningPathGenerator.getProjectLearningOutcomes(projectId);
        return NextResponse.json({ success: true, result: outcomes });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Learning API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Learning API failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "extract-skills":
        const { projectId } = body;
        if (!projectId) {
          return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
        }
        const extractedSkills = await skillExtractionEngine.extractAndStoreProjectSkills(projectId);
        return NextResponse.json({ success: true, result: extractedSkills });

      case "generate-learning-path":
        const { projectId: pathProjectId, pathType } = body;
        if (!pathProjectId) {
          return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
        }
        const generatedPath = await learningPathGenerator.generateProjectLearningPath(pathProjectId, pathType);
        return NextResponse.json({ success: true, result: generatedPath });

      case "initialize-prerequisites":
        await prerequisiteEngine.initializeDefaultDependencies();
        return NextResponse.json({ success: true, message: "Prerequisites initialized" });

      case "initialize-career-tracks":
        await careerTrackEngine.initializeDefaultTracks();
        return NextResponse.json({ success: true, message: "Career tracks initialized" });

      case "recommend-career-tracks":
        const { userSkills } = body;
        if (!userSkills) {
          return NextResponse.json({ success: false, error: "userSkills is required" }, { status: 400 });
        }
        const recommendedTracks = await careerTrackEngine.recommendCareerTracks(userSkills);
        return NextResponse.json({ success: true, result: recommendedTracks });

      case "track-progress":
        const { userId: trackUserId, trackId } = body;
        if (!trackUserId || !trackId) {
          return NextResponse.json({ success: false, error: "userId and trackId are required" }, { status: 400 });
        }
        const trackProgress = await careerTrackEngine.getCareerTrackProgress(trackUserId, trackId);
        return NextResponse.json({ success: true, result: trackProgress });

      case "recommend-next-project":
        const { userId: nextProjectUserId, completedSkills, currentProjectId } = body;
        if (!currentProjectId) {
          return NextResponse.json({ success: false, error: "currentProjectId is required" }, { status: 400 });
        }
        const nextProject = await learningPathGenerator.getRecommendedNextProject(completedSkills || [], currentProjectId);
        return NextResponse.json({ success: true, result: nextProject });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Learning API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Learning API POST failed" },
      { status: 500 }
    );
  }
}

async function getUserLearningProgress(userId: string) {
  const { data } = await supabaseServer
    .from("user_learning_progress")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

async function getLearningRecommendations(userId: string, limit: number) {
  const { data } = await supabaseServer
    .from("learning_recommendations")
    .select("*")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("score", { ascending: false })
    .limit(limit);

  return data || [];
}
