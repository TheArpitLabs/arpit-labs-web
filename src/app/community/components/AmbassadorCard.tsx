'use client';

import { motion } from 'framer-motion';
import { MapPin, Trophy, Users, Calendar, Award } from 'lucide-react';
import Link from 'next/link';

interface AmbassadorCardProps {
  ambassador: {
    id: string;
    user_id: string;
    achievements: number;
    events_hosted: number;
    members_recruited: number;
    profiles: {
      username: string;
      avatar_url?: string;
      full_name?: string;
      bio?: string;
    };
    community_chapters?: {
      name: string;
      city: string;
      country_name: string;
    };
  };
}

export function AmbassadorCard({ ambassador }: AmbassadorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/community/ambassadors/${ambassador.user_id}` as any} className="group block">
        <div className="relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
          
          <div className="relative">
            <div className="mb-4 flex items-start gap-4">
              {ambassador.profiles.avatar_url ? (
                <img
                  src={ambassador.profiles.avatar_url}
                  alt={ambassador.profiles.username}
                  className="h-16 w-16 rounded-full border-2 border-primary/20"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br from-primary/20 to-accent/20">
                  <span className="text-2xl font-bold text-primary">
                    {ambassador.profiles.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                    {ambassador.profiles.full_name || ambassador.profiles.username}
                  </h3>
                  <Award className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="text-sm text-muted">@{ambassador.profiles.username}</div>
                {ambassador.community_chapters && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3 w-3" />
                    <span>{ambassador.community_chapters.name}, {ambassador.community_chapters.city}</span>
                  </div>
                )}
              </div>
            </div>

            {ambassador.profiles.bio && (
              <p className="mb-4 line-clamp-2 text-sm text-muted">{ambassador.profiles.bio}</p>
            )}

            <div className="grid grid-cols-3 gap-3 border-t border-border/50 pt-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-lg font-heading font-bold text-foreground">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  {ambassador.achievements}
                </div>
                <div className="text-xs text-muted">Achievements</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-lg font-heading font-bold text-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {ambassador.events_hosted}
                </div>
                <div className="text-xs text-muted">Events</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-lg font-heading font-bold text-foreground">
                  <Users className="h-4 w-4 text-green-500" />
                  {ambassador.members_recruited}
                </div>
                <div className="text-xs text-muted">Recruited</div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
