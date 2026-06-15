'use client';

import React from 'react';
import { LeaderboardEntry } from '@/lib/gamification';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser = false }: LeaderboardRowProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
        isCurrentUser
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/50'
      }`}
    >
      <div className={`w-12 text-center font-bold ${getRankColor(entry.rank)}`}>
        {getRankIcon(entry.rank)}
      </div>

      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
        {entry.full_name?.charAt(0).toUpperCase() || '?'}
      </div>

      <div className="flex-1">
        <div className="font-semibold">{entry.full_name || 'Anonymous'}</div>
        <div className="text-sm text-muted-foreground">
          Level {entry.level} • {entry.badges_earned} badges
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-lg">{entry.points.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">points</div>
      </div>

      {entry.current_streak > 0 && (
        <div className="text-center">
          <div className="text-orange-500">🔥</div>
          <div className="text-xs font-medium">{entry.current_streak}</div>
        </div>
      )}
    </div>
  );
}
