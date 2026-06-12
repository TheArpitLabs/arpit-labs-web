"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, InfoCard } from "@/components/ui/card";
import { FolderKanban, TrendingUp, Heart, FileCheck, ArrowUpRight } from "lucide-react";

interface StatsCardsProps {
  totalProjects: number;
  totalViews: number;
  totalLikes: number;
  publishedProjects: number;
}

export function StatsCards({
  totalProjects,
  totalViews,
  totalLikes,
  publishedProjects,
}: StatsCardsProps) {
  const stats = [
    {
      name: "My Projects",
      value: totalProjects.toString(),
      label: "Total projects",
      trend: "+12%",
      icon: FolderKanban,
    },
    {
      name: "Total Views",
      value: totalViews.toString(),
      label: "Project views",
      trend: "+24%",
      icon: TrendingUp,
    },
    {
      name: "Total Likes",
      value: totalLikes.toString(),
      label: "Community likes",
      trend: "+18%",
      icon: Heart,
    },
    {
      name: "Published",
      value: publishedProjects.toString(),
      label: "Live projects",
      trend: "+8%",
      icon: FileCheck,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <InfoCard
            title={stat.name}
            value={stat.value}
            label={stat.label}
            trend={stat.trend}
          />
        </motion.div>
      ))}
    </div>
  );
}
