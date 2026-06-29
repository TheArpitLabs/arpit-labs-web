'use client';

import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ChapterCardProps {
  chapter: {
    id: string;
    name: string;
    slug: string;
    country_name: string;
    city: string;
    member_count: number;
    active_projects: number;
    events_hosted: number;
    image_url?: string;
    profiles?: {
      username: string;
      avatar_url?: string;
      full_name?: string;
    };
  };
}

export function ChapterCard({ chapter }: ChapterCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/community/chapters/${chapter.slug}` as any} className="group block">
        <div className="relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
          
          <div className="relative">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-surface to-surface/50">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                    {chapter.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {chapter.city}, {chapter.country_name}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-heading font-bold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  {chapter.member_count}
                </div>
                <div className="text-xs text-muted">Members</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-heading font-bold text-foreground">
                  <Calendar className="h-4 w-4 text-accent" />
                  {chapter.events_hosted}
                </div>
                <div className="text-xs text-muted">Events</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-heading font-bold text-foreground">
                  {chapter.active_projects}
                </div>
                <div className="text-xs text-muted">Projects</div>
              </div>
            </div>

            {chapter.profiles && (
              <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
                <div className="text-sm text-muted">Ambassador:</div>
                <div className="flex items-center gap-2">
                  {chapter.profiles.avatar_url && (
                    <img
                      src={chapter.profiles.avatar_url}
                      alt={chapter.profiles.username}
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {chapter.profiles.full_name || chapter.profiles.username}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
