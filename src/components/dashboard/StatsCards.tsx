"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { FolderKanban, TrendingUp, Heart, FileCheck } from "lucide-react";

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
      value: totalProjects,
      icon: FolderKanban,
      color: "bg-primary/10 text-primary",
    },
    {
      name: "Total Views",
      value: totalViews,
      icon: TrendingUp,
      color: "bg-secondary/10 text-secondary",
    },
    {
      name: "Total Likes",
      value: totalLikes,
      icon: Heart,
      color: "bg-red-500/10 text-red-500",
    },
    {
      name: "Published",
      value: publishedProjects,
      icon: FileCheck,
      color: "bg-green-500/10 text-green-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.name}
          className="border-border/70 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
