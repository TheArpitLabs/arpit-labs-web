// Gamification Integration - Helper functions to integrate gamification with existing features

import { getUserFromRequest } from '@/lib/auth';
import { POINT_VALUES } from './points';
import { trackAchievementByType } from './achievement-system';
import { checkAndAwardBadges, getUserStatsForBadges } from './badge-system';

/**
 * Award points for content viewing
 */
export async function awardPointsForContentView(
  request: Request,
  contentId: string,
  contentType: string
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/award-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        points: POINT_VALUES.content_view,
        actionType: 'content_view',
        description: `Viewed ${contentType}: ${contentId}`,
        metadata: { contentId, contentType }
      })
    });

    if (response.ok) {
      // Track achievement progress
      await trackAchievementByType(user.id, 'content_views', 1);
      
      // Check for new badges
      const userStats = await getUserStatsForBadges(user.id);
      await checkAndAwardBadges(user.id, userStats);
    }
  } catch (error) {
    console.error('Error awarding points for content view:', error);
  }
}

/**
 * Award points for content saving
 */
export async function awardPointsForContentSave(
  request: Request,
  contentId: string,
  contentType: string
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/award-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        points: POINT_VALUES.content_save,
        actionType: 'content_save',
        description: `Saved ${contentType}: ${contentId}`,
        metadata: { contentId, contentType }
      })
    });

    if (response.ok) {
      // Track achievement progress
      await trackAchievementByType(user.id, 'content_saves', 1);
      
      // Check for new badges
      const userStats = await getUserStatsForBadges(user.id);
      await checkAndAwardBadges(user.id, userStats);
    }
  } catch (error) {
    console.error('Error awarding points for content save:', error);
  }
}

/**
 * Award points for newsletter subscription
 */
export async function awardPointsForNewsletterSubscription(
  request: Request,
  email: string
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/award-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        points: POINT_VALUES.newsletter_subscription,
        actionType: 'newsletter_subscription',
        description: 'Subscribed to newsletter',
        metadata: { email }
      })
    });

    if (response.ok) {
      // Track achievement progress
      await trackAchievementByType(user.id, 'newsletter_subscription', 1);
      
      // Check for new badges
      const userStats = await getUserStatsForBadges(user.id);
      await checkAndAwardBadges(user.id, userStats);
    }
  } catch (error) {
    console.error('Error awarding points for newsletter subscription:', error);
  }
}

/**
 * Award points for contact form submission
 */
export async function awardPointsForContactForm(
  request: Request,
  subject: string
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/award-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        points: POINT_VALUES.contact_form,
        actionType: 'contact_form',
        description: 'Submitted contact form',
        metadata: { subject }
      })
    });

    if (response.ok) {
      // Track achievement progress
      await trackAchievementByType(user.id, 'contact_forms', 1);
      
      // Check for new badges
      const userStats = await getUserStatsForBadges(user.id);
      await checkAndAwardBadges(user.id, userStats);
    }
  } catch (error) {
    console.error('Error awarding points for contact form:', error);
  }
}

/**
 * Award points for project completion
 */
export async function awardPointsForProjectCompletion(
  request: Request,
  projectId: string,
  projectTitle: string
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/award-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        points: POINT_VALUES.project_completion,
        actionType: 'project_completion',
        description: `Completed project: ${projectTitle}`,
        metadata: { projectId, projectTitle }
      })
    });

    if (response.ok) {
      // Track achievement progress
      await trackAchievementByType(user.id, 'projects_completed', 1);
      
      // Check for new badges
      const userStats = await getUserStatsForBadges(user.id);
      await checkAndAwardBadges(user.id, userStats);
    }
  } catch (error) {
    console.error('Error awarding points for project completion:', error);
  }
}

/**
 * Award points for experiment completion
 */
export async function awardPointsForExperimentCompletion(
  request: Request,
  experimentId: string,
  experimentTitle: string
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/award-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({
        points: POINT_VALUES.experiment_completion,
        actionType: 'experiment_completion',
        description: `Completed experiment: ${experimentTitle}`,
        metadata: { experimentId, experimentTitle }
      })
    });

    if (response.ok) {
      // Track achievement progress
      await trackAchievementByType(user.id, 'experiments_completed', 1);
      
      // Check for new badges
      const userStats = await getUserStatsForBadges(user.id);
      await checkAndAwardBadges(user.id, userStats);
    }
  } catch (error) {
    console.error('Error awarding points for experiment completion:', error);
  }
}

/**
 * Record daily login for streak tracking
 */
export async function recordDailyLogin(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return;

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/daily-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });
  } catch (error) {
    console.error('Error recording daily login:', error);
  }
}
