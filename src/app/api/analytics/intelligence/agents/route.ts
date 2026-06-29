/**
 * Analytics API for Agentic AI System (E15)
 * Provides metrics and analytics for AI agents and tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limiting';
import { featureFlags } from '@/lib/infrastructure/feature-flags';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`analytics-agents-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('agentic_ai_system')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    // Calculate time range
    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch agents
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (agentsError) throw agentsError;

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('agent_tasks')
      .select('*, ai_agents(*)')
      .gte('created_at', startDate.toISOString());

    if (tasksError) throw tasksError;

    // Fetch performance metrics
    const { data: performanceMetrics, error: metricsError } = await supabase
      .from('agent_performance_metrics')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (metricsError) throw metricsError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalAgents: agents?.length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
        failedTasks: tasks?.filter(t => t.status === 'failed').length || 0,
        avgSuccessRate: agents?.reduce((acc, a) => acc + (a.success_rate || 0), 0) / (agents?.length || 1) || 0,
        avgResponseTime: agents?.reduce((acc, a) => acc + (a.avg_response_time || 0), 0) / (agents?.length || 1) || 0,
      },
      byAgentType: agents?.reduce((acc, agent) => {
        acc[agent.agent_type] = (acc[agent.agent_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byTaskType: tasks?.reduce((acc, task) => {
        acc[task.task_type] = (acc[task.task_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byTaskStatus: tasks?.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      topAgents: agents
        ?.sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))
        .slice(0, 10) || [],
      taskCompletionRate: tasks?.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
      avgTaskDuration: tasks
        ?.filter(t => t.execution_duration)
        .reduce((acc, t) => acc + (t.execution_duration || 0), 0) / (tasks?.filter(t => t.execution_duration).length || 1) || 0,
      agentPerformance: agents?.map(agent => ({
        name: agent.name,
        type: agent.agent_type,
        totalTasks: agent.total_tasks_completed,
        successfulTasks: agent.successful_tasks,
        failedTasks: agent.failed_tasks,
        successRate: agent.success_rate,
        avgResponseTime: agent.avg_response_time,
      })) || [],
      qualityDistribution: {
        high: tasks?.filter(t => (t.quality_score || 0) >= 75).length || 0,
        medium: tasks?.filter(t => (t.quality_score || 0) >= 50 && (t.quality_score || 0) < 75).length || 0,
        low: tasks?.filter(t => (t.quality_score || 0) < 50).length || 0,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    logger.error('Error fetching agent analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
