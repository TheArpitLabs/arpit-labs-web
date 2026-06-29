'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    event_type: string;
    start_date: string;
    end_date?: string;
    location?: string;
    mode: string;
    max_seats?: number;
    available_seats?: number;
    image_url?: string;
    profiles?: {
      username: string;
      avatar_url?: string;
      full_name?: string;
    };
    community_chapters?: {
      name: string;
      city: string;
      country_name: string;
    };
  };
}

const eventTypeColors = {
  meetup: 'from-blue-500/20 to-blue-500/5 text-blue-500',
  workshop: 'from-purple-500/20 to-purple-500/5 text-purple-500',
  hackathon: 'from-orange-500/20 to-orange-500/5 text-orange-500',
  conference: 'from-green-500/20 to-green-500/5 text-green-500',
  bootcamp: 'from-red-500/20 to-red-500/5 text-red-500',
};

const modeLabels = {
  online: 'Online',
  offline: 'In-Person',
  hybrid: 'Hybrid',
};

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const isFull = event.max_seats && event.available_seats !== undefined && event.available_seats <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/community/events/${event.slug}` as any} className="group block">
        <div className="relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:shadow-xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${eventTypeColors[event.event_type as keyof typeof eventTypeColors] || eventTypeColors.meetup} opacity-0 transition-opacity group-hover:opacity-100`} />
          
          <div className="relative">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
                  <span className="capitalize">{event.event_type}</span>
                  <span>•</span>
                  <span>{modeLabels[event.mode as keyof typeof modeLabels] || event.mode}</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
              </div>
              <ArrowRight className="h-5 w-5 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
            </div>

            <div className="mb-4 space-y-2 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {endDate && (
                  <>
                    <span>–</span>
                    <span>{endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span>{startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {event.location && event.mode !== 'online' && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.community_chapters && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>{event.community_chapters.name}, {event.community_chapters.city}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="mb-4 line-clamp-2 text-sm text-muted">{event.description}</p>
            )}

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <div className="flex items-center gap-2">
                {event.profiles?.avatar_url && (
                  <img
                    src={event.profiles.avatar_url}
                    alt={event.profiles.username}
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span className="text-xs text-muted">
                  {event.profiles?.full_name || event.profiles?.username || 'Organizer'}
                </span>
              </div>
              {event.max_seats && (
                <div className="flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3 text-muted" />
                  <span className={isFull ? 'text-red-500 font-semibold' : 'text-muted'}>
                    {isFull ? 'Full' : `${event.available_seats || 0}/${event.max_seats} seats`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
