'use client';

import React from 'react';
import { Badge, UserBadge } from '@/lib/gamification';
import { BadgeCard } from './BadgeCard';

interface BadgeGridProps {
  badges: Badge[];
  userBadges?: UserBadge[];
  onBadgeClick?: (badge: Badge) => void;
}

export function BadgeGrid({ badges, userBadges = [], onBadgeClick }: BadgeGridProps) {
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map(badge => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earned={earnedBadgeIds.has(badge.id)}
          earnedAt={
            userBadges.find(ub => ub.badge_id === badge.id)?.earned_at
          }
          onClick={() => onBadgeClick?.(badge)}
        />
      ))}
    </div>
  );
}
