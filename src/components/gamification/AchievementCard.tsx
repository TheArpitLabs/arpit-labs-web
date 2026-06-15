'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Achievement, UserAchievement } from '@/lib/gamification';
import { calculateAchievementProgress, getAchievementDifficultyColor } from '@/lib/gamification/achievements';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  onClick?: () => void;
}

export function AchievementCard({
  achievement,
  userAchievement,
  onClick
}: AchievementCardProps) {
  const progress = userAchievement
    ? calculateAchievementProgress(achievement, userAchievement.progress)
    : 0;
  const completed = !!userAchievement?.completed_at;
  const difficultyColor = getAchievementDifficultyColor(achievement.difficulty);

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
        completed ? 'border-green-500/50' : ''
      }`}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs px-2 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: difficultyColor }}
              >
                {achievement.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">
                {achievement.category}
              </span>
            </div>
            <div className="font-semibold">{achievement.name}</div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {achievement.description}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-yellow-500">
              +{achievement.points_reward}
            </div>
            <div className="text-xs text-muted-foreground">pts</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {Math.round(progress)}% {completed && '✓'}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completed ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {completed && userAchievement?.completed_at && (
          <div className="text-xs text-green-600 dark:text-green-400">
            Completed {new Date(userAchievement.completed_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </Card>
  );
}
