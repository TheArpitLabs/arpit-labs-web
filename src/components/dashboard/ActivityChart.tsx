"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActivityChartProps {
  projects: any[];
}

export function ActivityChart({ projects }: ActivityChartProps) {
  // Generate activity data from projects
  const generateActivityData = () => {
    const data: any[] = [];
    const now = new Date();
    
    // Generate last 7 days data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      // Count projects created on this day
      const projectsCreated = projects.filter((p) => {
        const projectDate = new Date(p.created_at);
        return (
          projectDate.getDate() === date.getDate() &&
          projectDate.getMonth() === date.getMonth() &&
          projectDate.getFullYear() === date.getFullYear()
        );
      }).length;

      // Aggregate views for projects created on this day
      const views = projects
        .filter((p) => {
          const projectDate = new Date(p.created_at);
          return (
            projectDate.getDate() === date.getDate() &&
            projectDate.getMonth() === date.getMonth() &&
            projectDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, p) => sum + (p.views_count || 0), 0);

      data.push({
        date: dateStr,
        projects: projectsCreated,
        views: views,
      });
    }

    return data;
  };

  const data = generateActivityData();

  return (
    <Card variant="glass" className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Activity Overview</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted">Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <span className="text-muted">Projects</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey="date"
              className="text-xs text-muted"
              stroke="currentColor"
            />
            <YAxis
              className="text-xs text-muted"
              stroke="currentColor"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="views"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="projects"
              stroke="hsl(var(--secondary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--secondary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
