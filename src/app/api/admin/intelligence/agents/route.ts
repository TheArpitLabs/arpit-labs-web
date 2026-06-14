/**
 * Admin API for Agentic AI System (E15)
 * Provides management endpoints for AI agents and tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { audit } from '@/lib/infrastructure/audit-logger';
import { featureFlags } from '@/lib/infrastructure/feature-flags';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-agents-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('agentic_ai_system')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const agent_type = searchParams.get('agent_type'); // discovery, research, project, learning, trend, marketplace
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agent_type) {
      query = query.eq('agent_type', agent_type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_agents',
      'agentic_ai',
      undefined,
      { agent_type, status, limit }
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-agents-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('agentic_ai_system')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'create_agent':
        result = await createAgent(data);
        break;
      case 'update_agent':
        result = await updateAgent(data);
        break;
      case 'execute_task':
        result = await executeTask(data);
        break;
      case 'get_task_status':
        result = await getTaskStatus(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `agent_${action}`,
      'agentic_ai',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in agent API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function createAgent(data: any) {
  const { data: agent, error } = await supabase
    .from('ai_agents')
    .insert({
      ...data,
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return agent;
}

async function updateAgent(data: any) {
  const { id, ...updateData } = data;
  
  const { data: agent, error } = await supabase
    .from('ai_agents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return agent;
}

async function executeTask(data: any) {
  const { agent_id, user_id, task_type, task_name, task_description, task_input } = data;
  
  const { data: task, error } = await supabase
    .from('agent_tasks')
    .insert({
      agent_id,
      user_id,
      task_type,
      task_name,
      task_description,
      task_input,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // In production, this would trigger the actual agent execution
  await supabase
    .from('agent_tasks')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', task.id);

  return task;
}

async function getTaskStatus(data: any) {
  const { task_id } = data;
  
  const { data: task, error } = await supabase
    .from('agent_tasks')
    .select('*, ai_agents(*)')
    .eq('id', task_id)
    .single();

  if (error) throw error;
  return task;
}
