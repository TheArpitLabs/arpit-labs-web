/**
 * Admin Analytics Dashboard
 * Displays key metrics and analytics
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Eye, MessageSquare, Mail, FileText } from 'lucide-react';

interface AnalyticsMetrics {
  totalVisitors: number;
  pageViews: number;
  uniqueUsers: number;
  topProjects: Array<{ title: string; views: number }>;
  topArticles: Array<{ title: string; views: number }>;
  subscriberGrowth: Array<{ date: string; count: number }>;
  contactMessages: number;
  conversionRate: number;
}

interface AdminAnalyticsDashboardProps {
  metrics: AnalyticsMetrics;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {change && (
            <p
              className={`mt-2 text-sm ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
            </p>
          )}
        </div>
        <Icon className="h-8 w-8 text-primary opacity-50" />
      </div>
    </Card>
  );
}

export function AdminAnalyticsDashboard({ metrics }: AdminAnalyticsDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Analytics Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={Users}
            label="Total Visitors"
            value={metrics.totalVisitors.toLocaleString()}
            change="+12% this month"
            trend="up"
          />
          <MetricCard
            icon={Eye}
            label="Page Views"
            value={metrics.pageViews.toLocaleString()}
            change="+8% this month"
            trend="up"
          />
          <MetricCard
            icon={TrendingUp}
            label="Conversion Rate"
            value={`${metrics.conversionRate.toFixed(2)}%`}
            change="+2.1% this month"
            trend="up"
          />
          <MetricCard
            icon={Mail}
            label="Newsletter Subscribers"
            value={metrics.subscriberGrowth[metrics.subscriberGrowth.length - 1]?.count || 0}
            change="+23 new"
            trend="up"
          />
          <MetricCard
            icon={MessageSquare}
            label="Contact Messages"
            value={metrics.contactMessages}
            change="This month"
            trend="neutral"
          />
          <MetricCard
            icon={FileText}
            label="Unique Users"
            value={metrics.uniqueUsers.toLocaleString()}
            change="+5% this month"
            trend="up"
          />
        </div>
      </div>

      {/* Top Projects */}
      <div>
        <h3 className="mb-4 text-xl font-bold">Top Projects</h3>
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium">Project</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Views</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topProjects.map((project, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50 transition">
                  <td className="px-6 py-3 text-sm">{project.title}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium">{project.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Top Articles */}
      <div>
        <h3 className="mb-4 text-xl font-bold">Top Articles</h3>
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium">Article</th>
                <th className="px-6 py-3 text-right text-sm font-medium">Views</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topArticles.map((article, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50 transition">
                  <td className="px-6 py-3 text-sm">{article.title}</td>
                  <td className="px-6 py-3 text-right text-sm font-medium">{article.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
