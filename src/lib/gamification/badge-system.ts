// Badge System - Badge awarding and checking logic

import { supabaseServer } from "@/lib/supabase/server";
import { Badge, UserBadge } from "./types";
import { checkBadgeRequirements } from "./badges";

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabaseServer
    .from('badges')
    .select('*')
    .order('requirement_value', { ascending: true });

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabaseServer
    .from('user_badges')
    .select(`
      *,
      badges (*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }

  return data || [];
}

/**
 * Check and award badges based on user stats
 */
export async function checkAndAwardBadges(
  userId: string,
  userStats: Record<string, number>
): Promise<Badge[]> {
  const allBadges = await getAllBadges();
  const userBadges = await getUserBadges(userId);
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  
  const newlyEarnedBadges: Badge[] = [];

  for (const badge of allBadges) {
    // Skip if already earned
    if (earnedBadgeIds.has(badge.id)) {
      continue;
    }

    // Check if requirements are met
    if (checkBadgeRequirements(badge, userStats)) {
      // Award the badge
      const { error } = await supabaseServer
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id
        });

      if (!error) {
        newlyEarnedBadges.push(badge);

        // Award points for badge
        if (badge.points_reward > 0) {
          await supabaseServer.rpc('award_points', {
            p_user_id: userId,
            p_points: badge.points_reward,
            p_action_type: 'badge_earned',
            p_description: `Earned badge: ${badge.name}`,
            p_metadata: { badge_id: badge.id, badge_name: badge.name }
          });
        }
      }
    }
  }

  return newlyEarnedBadges;
}

/**
 * Get user stats for badge checking
 */
export async function getUserStatsForBadges(userId: string): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};

  // Get content views count
  const { count: viewsCount } = await supabaseServer
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'page_view');

  stats.content_views = viewsCount || 0;

  // Get saved content count
  const { count: savesCount } = await supabaseServer
    .from('saved_content')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  stats.content_saves = savesCount || 0;

  // Get contact forms count
  const { count: contactCount } = await supabaseServer
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  stats.contact_forms = contactCount || 0;

  // Get newsletter subscription status
  const { data: newsletterData } = await supabaseServer
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (newsletterData) {
    const { count: newsletterCount } = await supabaseServer
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('email', newsletterData.email);

    stats.newsletter_subscription = newsletterCount || 0;
  }

  // Get completed experiments count
  const { count: experimentsCount } = await supabaseServer
    .from('experiments')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('status', 'completed');

  stats.experiments_completed = experimentsCount || 0;

  // Get completed projects count
  const { count: projectsCount } = await supabaseServer
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('status', 'completed');

  stats.projects_completed = projectsCount || 0;

  // Get current streak
  const { data: streakData } = await supabaseServer
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .single();

  stats.login_streak = streakData?.current_streak || 0;

  // Get referrals count (placeholder - needs implementation)
  stats.referrals = 0;

  return stats;
}

/**
 * Award a specific badge to a user
 */
export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  // Check if already earned
  const { data: existing } = await supabaseServer
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single();

  if (existing) {
    return false; // Already earned
  }

  // Get badge details
  const { data: badge } = await supabaseServer
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .single();

  if (!badge) {
    return false;
  }

  // Award badge
  const { error } = await supabaseServer
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId
    });

  if (error) {
    console.error('Error awarding badge:', error);
    return false;
  }

  // Award points for badge
  if (badge.points_reward > 0) {
    await supabaseServer.rpc('award_points', {
      p_user_id: userId,
      p_points: badge.points_reward,
      p_action_type: 'badge_earned',
      p_description: `Earned badge: ${badge.name}`,
      p_metadata: { badge_id: badge.id, badge_name: badge.name }
    });
  }

  return true;
}
