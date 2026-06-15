'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/lib/gamification';
import { getBadgeIcon, getBadgeRarity, getBadgeColor } from '@/lib/gamification/badges';

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
  earnedAt?: string;
  onClick?: () => void;
}

export function BadgeCard({ badge, earned = false, earnedAt, onClick }: BadgeCardProps) {
  const icon = getBadgeIcon(badge);
  const rarity = getBadgeRarity(badge);
  const color = getBadgeColor(rarity);

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
        !earned ? 'opacity-50 grayscale' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div
          className="text-4xl mb-2"
          style={{ textShadow: `0 0 20px ${color}40` }}
        >
          {icon}
        </div>
        <div className="font-semibold text-sm">{badge.name}</div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {badge.description}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              backgroundColor: `${color}20`,
              color: color,
              border: `1px solid ${color}40`
            }}
          >
            {rarity}
          </span>
          {badge.points_reward > 0 && (
            <span className="text-xs text-muted-foreground">
              +{badge.points_reward} pts
            </span>
          )}
        </div>
        {earned && earnedAt && (
          <div className="text-xs text-muted-foreground">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </Card>
  );
}
