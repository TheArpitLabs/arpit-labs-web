import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth";
import { handleDatabaseError } from "@/lib/errors";

// GET /api/user/profile-completion - Get user's profile completion status
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw handleDatabaseError(profileError);
    }

    // Calculate completion percentage based on various fields
    const completionItems = {
      basicInfo: {
        completed: !!(profile?.full_name && profile?.username),
        label: 'Basic Information',
        weight: 20
      },
      profilePicture: {
        completed: !!(profile?.avatar_url),
        label: 'Profile Picture',
        weight: 20
      },
      bio: {
        completed: !!(profile?.bio && profile.bio.length > 10),
        label: 'Bio',
        weight: 15
      },
      skills: {
        completed: !!(profile?.skills && profile.skills.length > 0),
        label: 'Skills',
        weight: 15
      },
      socialLinks: {
        completed: !!(profile?.github_url || profile?.linkedin_url || profile?.twitter_url),
        label: 'Social Links',
        weight: 15
      },
      location: {
        completed: !!(profile?.location),
        label: 'Location',
        weight: 5
      },
      website: {
        completed: !!(profile?.website),
        label: 'Website',
        weight: 5
      },
      projects: {
        completed: false, // Will check separately
        label: 'Projects',
        weight: 5
      }
    };

    // Check if user has projects
    const { data: projects } = await supabaseServer
      .from('projects')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);

    completionItems.projects.completed = !!(projects && projects.length > 0);

    // Calculate total completion percentage
    let totalWeight = 0;
    let completedWeight = 0;

    Object.values(completionItems).forEach(item => {
      totalWeight += item.weight;
      if (item.completed) {
        completedWeight += item.weight;
      }
    });

    const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

    return NextResponse.json({
      data: {
        completionPercentage,
        items: completionItems,
        totalWeight,
        completedWeight
      }
    });

  } catch (error) {
    console.error('Error in GET /api/user/profile-completion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile completion' },
      { status: 500 }
    );
  }
}
