'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import Image from 'next/image';

interface LeaderboardCardProps {
  entry: {
    id: string;
    user_id: string;
    username: string;
    avatar_url?: string;
    full_name?: string;
    contribution_score: number;
    projects_count: number;
    events_attended: number;
    discussions_created: number;
    badges_count: number;
    followers_count: number;
  };
  rank: number;
}

const rankIcons = {
  1: <Trophy className="h-6 w-6 text-yellow-500" />,
  2: <Medal className="h-6 w-6 text-gray-400" />,
  3: <Award className="h-6 w-6 text-amber-700" />,
};

const rankColors = {
  1: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
  2: 'from-gray-400/20 to-gray-400/5 border-gray-400/30',
  3: 'from-amber-700/20 to-amber-700/5 border-amber-700/30',
};

export function LeaderboardCard({ entry, rank }: LeaderboardCardProps) {
  const isTop3 = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: rank * 0.05 }}
    >
      <div
        className={`relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-lg ${
          isTop3
            ? `bg-gradient-to-br ${rankColors[rank as keyof typeof rankColors]}`
            : 'glass'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface font-heading font-bold text-foreground">
            {isTop3 ? rankIcons[rank as keyof typeof rankIcons] : rank}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.username}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                  <span className="text-sm font-bold text-primary">
                    {entry.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="font-heading font-semibold text-foreground">
                  {entry.full_name || entry.username}
                </div>
                <div className="text-xs text-muted">@{entry.username}</div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-heading font-bold text-primary">
              {entry.contribution_score.toLocaleString()}
            </div>
            <div className="text-xs text-muted">points</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border/50 pt-3 text-center">
          <div>
            <div className="text-sm font-semibold text-foreground">{entry.projects_count}</div>
            <div className="text-xs text-muted">Projects</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{entry.events_attended}</div>
            <div className="text-xs text-muted">Events</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{entry.discussions_created}</div>
            <div className="text-xs text-muted">Discussions</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
              <Star className="h-3 w-3 text-yellow-500" />
              {entry.badges_count}
            </div>
            <div className="text-xs text-muted">Badges</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
