"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface TechStackChartProps {
  projects: any[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
];

export function TechStackChart({ projects }: TechStackChartProps) {
  // Generate tech stack data from projects
  const generateTechStackData = () => {
    const techStackCount: Record<string, number> = {};

    projects.forEach((project) => {
      if (project.tech_stack && Array.isArray(project.tech_stack)) {
        project.tech_stack.forEach((tech: string) => {
          const normalizedTech = tech.trim().toLowerCase();
          techStackCount[normalizedTech] = (techStackCount[normalizedTech] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by count
    const data = Object.entries(techStackCount)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 technologies

    return data;
  };

  const data = generateTechStackData();

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Tech Stack Distribution</h3>
        <div className="flex h-64 items-center justify-center text-muted">
          <p className="text-sm">No tech stack data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Tech Stack Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
