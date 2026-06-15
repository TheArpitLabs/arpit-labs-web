'use client';

import React from 'react';
import { Achievement, UserAchievement } from '@/lib/gamification';
import { AchievementCard } from './AchievementCard';

interface AchievementListProps {
  achievements: Achievement[];
  userAchievements?: UserAchievement[];
  onAchievementClick?: (achievement: Achievement) => void;
  category?: string;
}

export function AchievementList({
  achievements,
  userAchievements = [],
  onAchievementClick,
  category
}: AchievementListProps) {
  const filteredAchievements = category
    ? achievements.filter(a => a.category === category)
    : achievements;

  const userAchievementMap = new Map(
    userAchievements.map(ua => [ua.achievement_id, ua])
  );

  return (
    <div className="space-y-4">
      {filteredAchievements.map(achievement => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          userAchievement={userAchievementMap.get(achievement.id)}
          onClick={() => onAchievementClick?.(achievement)}
        />
      ))}
    </div>
  );
}
