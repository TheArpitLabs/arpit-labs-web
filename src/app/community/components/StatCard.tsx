'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  color: 'primary' | 'accent' | 'blue' | 'yellow' | 'green' | 'purple';
}

const colorClasses = {
  primary: 'from-primary/20 to-primary/5 text-primary',
  accent: 'from-accent/20 to-accent/5 text-accent',
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-500',
  yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-500',
  green: 'from-green-500/20 to-green-500/5 text-green-500',
  purple: 'from-purple-500/20 to-purple-500/5 text-purple-500',
};

export function StatCard({ icon: Icon, label, value, suffix = '', color }: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:shadow-xl"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 transition-opacity group-hover:opacity-100`} />
      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-surface to-surface/50">
          <Icon className={`h-6 w-6 ${colorClasses[color].split(' ')[2]}`} />
        </div>
        <div className="mb-2 text-3xl font-heading font-bold text-foreground">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-sm font-medium text-muted">{label}</div>
      </div>
    </motion.div>
  );
}
