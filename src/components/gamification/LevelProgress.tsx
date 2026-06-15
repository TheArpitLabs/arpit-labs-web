'use client';

import React from 'react';
import { getLevelName, getLevelProgress, getPointsToNextLevel, formatPoints } from '@/lib/gamification';

interface LevelProgressProps {
  points: number;
  level: number;
  showNextLevel?: boolean;
  compact?: boolean;
}

export function LevelProgress({
  points,
  level,
  showNextLevel = true,
  compact = false
}: LevelProgressProps) {
  const levelName = getLevelName(level);
  const progress = getLevelProgress(points);
  const pointsToNext = getPointsToNextLevel(points);
  const nextLevelName = getLevelName(level + 1);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-purple-500">⚡</span>
        <span className="font-semibold">Lvl {level}</span>
        <span className="text-sm text-muted-foreground">({levelName})</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <div className="text-lg font-bold">Level {level}</div>
            <div className="text-sm text-muted-foreground">{levelName}</div>
          </div>
        </div>
        {showNextLevel && pointsToNext > 0 && (
          <div className="text-right">
            <div className="text-sm font-medium">
              {formatPoints(pointsToNext)} pts to {nextLevelName}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Level Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
