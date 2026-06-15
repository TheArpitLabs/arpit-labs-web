'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { formatPoints, getLevelName, getLevelProgress } from '@/lib/gamification';

interface PointsDisplayProps {
  points: number;
  level: number;
  showLevel?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

export function PointsDisplay({
  points,
  level,
  showLevel = true,
  showProgress = true,
  compact = false
}: PointsDisplayProps) {
  const levelName = getLevelName(level);
  const progress = getLevelProgress(points);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">⭐</span>
          <span className="font-semibold">{formatPoints(points)}</span>
        </div>
        {showLevel && (
          <span className="text-sm text-muted-foreground">
            Lvl {level}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-2xl font-bold">{formatPoints(points)}</div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
          </div>
          {showLevel && (
            <div className="text-right">
              <div className="text-lg font-semibold">Level {level}</div>
              <div className="text-sm text-muted-foreground">{levelName}</div>
            </div>
          )}
        </div>
        {showProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to Level {level + 1}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
