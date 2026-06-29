'use client';

import { motion } from 'framer-motion';
import { Users, Clock, ArrowRight, Code2 } from 'lucide-react';
import Link from 'next/link';

interface CollaborationCardProps {
  collaboration: {
    id: string;
    title: string;
    description: string;
    project_type: string;
    skills_required: string[];
    team_size: number;
    current_team_size: number;
    deadline?: string;
    profiles?: {
      username: string;
      avatar_url?: string;
      full_name?: string;
    };
  };
}

const projectTypeColors = {
  flutter: 'from-blue-500/20 to-blue-500/5 text-blue-500',
  ml: 'from-purple-500/20 to-purple-500/5 text-purple-500',
  ui: 'from-pink-500/20 to-pink-500/5 text-pink-500',
  backend: 'from-green-500/20 to-green-500/5 text-green-500',
  iot: 'from-orange-500/20 to-orange-500/5 text-orange-500',
  robotics: 'from-red-500/20 to-red-500/5 text-red-500',
  research: 'from-cyan-500/20 to-cyan-500/5 text-cyan-500',
};

const projectTypeLabels = {
  flutter: 'Flutter',
  ml: 'Machine Learning',
  ui: 'UI/UX Design',
  backend: 'Backend',
  iot: 'IoT',
  robotics: 'Robotics',
  research: 'Research',
};

export function CollaborationCard({ collaboration }: CollaborationCardProps) {
  const spotsLeft = collaboration.team_size - collaboration.current_team_size;
  const isFull = spotsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link href={`/community/collaborations/${collaboration.id}` as any} className="group block">
        <div className="relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:shadow-xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${projectTypeColors[collaboration.project_type as keyof typeof projectTypeColors] || projectTypeColors.research} opacity-0 transition-opacity group-hover:opacity-100`} />
          
          <div className="relative">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
                  <Code2 className="h-3 w-3" />
                  <span>{projectTypeLabels[collaboration.project_type as keyof typeof projectTypeLabels] || collaboration.project_type}</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                  {collaboration.title}
                </h3>
              </div>
              <ArrowRight className="h-5 w-5 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
            </div>

            <p className="mb-4 line-clamp-2 text-sm text-muted">{collaboration.description}</p>

            <div className="mb-4 flex flex-wrap gap-2">
              {collaboration.skills_required.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-lg bg-surface px-2 py-1 text-xs font-medium text-muted"
                >
                  {skill}
                </span>
              ))}
              {collaboration.skills_required.length > 3 && (
                <span className="inline-flex items-center rounded-lg bg-surface px-2 py-1 text-xs font-medium text-muted">
                  +{collaboration.skills_required.length - 3}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <div className="flex items-center gap-2">
                {collaboration.profiles?.avatar_url && (
                  <img
                    src={collaboration.profiles.avatar_url}
                    alt={collaboration.profiles.username}
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span className="text-xs text-muted">
                  {collaboration.profiles?.full_name || collaboration.profiles?.username || 'Creator'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3 text-muted" />
                <span className={isFull ? 'text-red-500 font-semibold' : 'text-muted'}>
                  {isFull ? 'Team Full' : `${spotsLeft} spots left`}
                </span>
              </div>
            </div>

            {collaboration.deadline && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                <Clock className="h-3 w-3" />
                <span>Deadline: {new Date(collaboration.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
