import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/auth";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

// Constants for profile completion weights
const COMPLETION_WEIGHTS = {
  full_name: 20,
  bio: 15,
  avatar_url: 15,
  github_username: 10,
  linkedin_url: 10,
  twitter_username: 10,
  website_url: 10,
  location: 5,
  skills: 5,
} as const;

const REQUIRED_FIELDS = ['full_name', 'bio', 'avatar_url'] as const;

interface ProfileCompletionItem {
  field: string;
  completed: boolean;
  weight: number;
}

interface ProfileCompletionResponse {
  percentage: number;
  items: ProfileCompletionItem[];
}

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
      .select('full_name, bio, avatar_url, github_username, linkedin_url, twitter_username, website_url, location, skills')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Profile fetch error for completion calculation', { error: profileError.message, userId: user.id });
      throw handleDatabaseError(profileError);
    }

    // Calculate completion percentage based on various fields
    const completionItems = {
      basicInfo: {
        completed: !!(profile?.full_name),
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
        completed: !!(profile?.github_username || profile?.linkedin_url || profile?.twitter_username),
        label: 'Social Links',
        weight: 15
      },
      location: {
        completed: !!(profile?.location),
        label: 'Location',
        weight: 5
      },
      website: {
        completed: !!(profile?.website_url),
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
    logger.error('Error in GET /api/user/profile-completion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile completion' },
      { status: 500 }
    );
  }
}
