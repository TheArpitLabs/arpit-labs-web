'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { formatStreak, getStreakBonus } from '@/lib/gamification/streaks';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  isLoggedInToday?: boolean;
  compact?: boolean;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  isLoggedInToday = false,
  compact = false
}: StreakDisplayProps) {
  const bonus = getStreakBonus(currentStreak);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-orange-500">🔥</span>
        <span className="font-semibold">{formatStreak(currentStreak)}</span>
        {bonus > 1 && (
          <span className="text-xs text-muted-foreground">
            {bonus}x bonus
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
            <span className="text-3xl">🔥</span>
            <div>
              <div className="text-2xl font-bold">{formatStreak(currentStreak)}</div>
              <div className="text-sm text-muted-foreground">
                Current Streak
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{formatStreak(longestStreak)}</div>
            <div className="text-sm text-muted-foreground">Best</div>
          </div>
        </div>

        {bonus > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-orange-500 font-medium">
              {bonus}x Point Bonus Active!
            </span>
          </div>
        )}

        {isLoggedInToday && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ Logged in today
          </div>
        )}
      </div>
    </Card>
  );
}
