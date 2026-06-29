'use client';

import { motion } from 'framer-motion';
import { Heart, Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface GalleryCardProps {
  item: {
    id: string;
    title: string;
    description?: string;
    image_url: string;
    category: string;
    likes_count: number;
    profiles: {
      username: string;
      avatar_url?: string;
      full_name?: string;
    };
    community_events?: {
      title: string;
      event_type: string;
    };
    community_chapters?: {
      name: string;
      city: string;
    };
  };
}

const categoryColors = {
  hackathon: 'from-orange-500/20 to-orange-500/5 text-orange-500',
  meetup: 'from-blue-500/20 to-blue-500/5 text-blue-500',
  workshop: 'from-purple-500/20 to-purple-500/5 text-purple-500',
  conference: 'from-green-500/20 to-green-500/5 text-green-500',
  innovation_lab: 'from-cyan-500/20 to-cyan-500/5 text-cyan-500',
};

export function GalleryCard({ item }: GalleryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/community/gallery/${item.id}` as any} className="group block">
        <div className="relative overflow-hidden rounded-2xl glass transition-all duration-300 hover:shadow-xl">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold backdrop-blur-sm ${categoryColors[item.category as keyof typeof categoryColors] || categoryColors.meetup}`}>
                {item.category}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <h3 className="text-sm font-heading font-semibold text-white line-clamp-1">
                {item.title}
              </h3>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.profiles.avatar_url && (
                  <img
                    src={item.profiles.avatar_url}
                    alt={item.profiles.username}
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span className="text-xs text-muted">
                  {item.profiles.full_name || item.profiles.username}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Heart className="h-3 w-3 text-red-500" />
                <span>{item.likes_count}</span>
              </div>
            </div>

            {item.community_events && (
              <div className="flex items-center gap-1 text-xs text-muted">
                <Calendar className="h-3 w-3" />
                <span className="line-clamp-1">{item.community_events.title}</span>
              </div>
            )}
            {item.community_chapters && (
              <div className="flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{item.community_chapters.name}, {item.community_chapters.city}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
