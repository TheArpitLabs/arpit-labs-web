'use client';

import React, { useState } from 'react';
import { LeaderboardEntry } from '@/lib/gamification';
import { LeaderboardRow } from './LeaderboardRow';
import { Button } from '@/components/ui/button';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  showLoadMore = false,
  onLoadMore,
  isLoading = false
}: LeaderboardTableProps) {
  const [category, setCategory] = useState<'points' | 'badges' | 'streaks' | 'achievements'>('points');

  // Sort entries based on category
  const sortedEntries = [...entries].sort((a, b) => {
    switch (category) {
      case 'badges':
        return b.badges_earned - a.badges_earned;
      case 'streaks':
        return b.current_streak - a.current_streak;
      case 'achievements':
        return b.achievements_completed - a.achievements_completed;
      default:
        return b.points - a.points;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['points', 'badges', 'streaks', 'achievements'] as const).map(cat => (
          <Button
            key={cat}
            variant={category === cat ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat)}
            className="capitalize"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {sortedEntries.map((entry, index) => (
          <LeaderboardRow
            key={entry.user_id}
            entry={{ ...entry, rank: index + 1 }}
            isCurrentUser={entry.user_id === currentUserId}
          />
        ))}
      </div>

      {showLoadMore && (
        <div className="text-center">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
