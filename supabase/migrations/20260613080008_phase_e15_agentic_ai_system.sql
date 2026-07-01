-- E15 — AGENTIC AI SYSTEM
-- Additive migration - never modifies existing tables destructively

-- ============================================
-- AI AGENTS TABLE
-- ============================================
create table if not exists ai_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agent_type text not null, -- discovery, research, project, learning, trend, marketplace
  description text,
  version text not null default '1.0.0',
  
  -- Capabilities
  capabilities text[] not null, -- reasoning, planning, recommendations, knowledge_navigation, cross_domain_discovery
  primary_domains text[] default array[]::text[],
  supported_tasks text[] default array[]::text[],
  
  -- Configuration
  model_config jsonb,
  tool_config jsonb,
  system_prompt text,
  personality text,
  
  -- Performance
  total_tasks_completed integer not null default 0,
  successful_tasks integer not null default 0,
  failed_tasks integer not null default 0,
  success_rate numeric, -- 0-100
  avg_response_time numeric, -- in seconds
  
  -- Status
  status text not null default 'active', -- active, inactive, maintenance, deprecated
  is_public boolean not null default false,
  requires_auth boolean not null default true,
  
  -- Limits
  rate_limit_per_hour integer not null default 100,
  max_context_length integer not null default 4000,
  max_tool_calls_per_task integer not null default 10,
  
  -- Metadata
  agent_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- AGENT TASKS TABLE
-- ============================================
create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  user_id uuid, -- References profiles.id
  
  -- Task Definition
  task_type text not null, -- reasoning, planning, recommendation, discovery, analysis
  task_name text not null,
  task_description text not null,
  task_input jsonb,
  
  -- Task Configuration
  priority text not null default 'medium', -- low, medium, high, urgent
  complexity text not null default 'medium', -- simple, medium, complex
  
  -- Execution
  status text not null default 'pending', -- pending, queued, running, completed, failed, cancelled
  started_at timestamptz,
  completed_at timestamptz,
  execution_duration numeric, -- in seconds
  
  -- Results
  task_output jsonb,
  reasoning_steps jsonb,
  tools_used text[] default array[]::text[],
  intermediate_results jsonb,
  
  -- Quality
  quality_score numeric, -- 0-100
  accuracy_score numeric, -- 0-100
  relevance_score numeric, -- 0-100
  
  -- Error Handling
  error_message text,
  error_type text,
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  
  -- Feedback
  user_feedback text,
  user_rating integer, -- 1-5
  user_corrections jsonb,
  
  -- Metadata
  task_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- AGENT CONVERSATIONS TABLE
-- ============================================
create table if not exists agent_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  user_id uuid, -- References profiles.id
  task_id uuid references agent_tasks(id) on delete cascade,
  
  -- Conversation
  conversation_name text,
  is_active boolean not null default true,
  
  -- Context
  context_summary text,
  context_data jsonb,
  
  -- Statistics
  message_count integer not null default 0,
  tool_call_count integer not null default 0,
  
  -- Metadata
  conversation_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- AGENT MESSAGES TABLE
-- ============================================
create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  agent_id uuid references ai_agents(id) on delete cascade,
  user_id uuid, -- References profiles.id
  
  -- Message
  role text not null, -- user, assistant, system, tool
  content text not null,
  content_type text not null default 'text', -- text, code, json, image
  
  -- Processing
  processing_time numeric, -- in seconds
  token_count integer,
  model_used text,
  
  -- Tool Calls (for assistant messages)
  tool_calls jsonb,
  tool_results jsonb,
  
  -- Reasoning (for assistant messages)
  reasoning text,
  confidence_score numeric, -- 0-1
  
  -- Metadata
  message_data jsonb,
  
  created_at timestamptz not null default now()
);

-- ============================================
-- AGENT TOOL CALLS TABLE
-- ============================================
create table if not exists agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  task_id uuid references agent_tasks(id) on delete cascade,
  message_id uuid references agent_messages(id) on delete cascade,
  
  -- Tool Call
  tool_name text not null,
  tool_type text not null, -- api, database, search, analysis, computation
  tool_parameters jsonb,
  
  -- Execution
  status text not null default 'pending', -- pending, running, completed, failed
  started_at timestamptz,
  completed_at timestamptz,
  execution_duration numeric, -- in seconds
  
  -- Results
  tool_result jsonb,
  result_summary text,
  
  -- Error Handling
  error_message text,
  error_type text,
  
  -- Metadata
  tool_data jsonb,
  
  created_at timestamptz not null default now()
);

-- ============================================
-- AGENT PLANS TABLE
-- ============================================
create table if not exists agent_plans (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  task_id uuid not null references agent_tasks(id) on delete cascade,
  
  -- Plan
  plan_name text not null,
  plan_description text,
  plan_type text not null, -- sequential, parallel, conditional, adaptive
  
  -- Planning
  planning_method text not null, -- chain_of_thought, tree_of_thought, recursive, hierarchical
  planning_depth integer not null default 3,
  planning_breadth integer not null default 3,
  
  -- Plan Structure
  steps jsonb not null, -- Array of step objects
  dependencies jsonb, -- Step dependencies
  estimated_duration numeric, -- in seconds
  
  -- Execution
  execution_status text not null default 'pending', -- pending, in_progress, completed, failed, modified
  started_at timestamptz,
  completed_at timestamptz,
  actual_duration numeric, -- in seconds
  
  -- Adaptation
  adaptations_made integer not null default 0,
  adaptation_reasons text[] default array[]::text[],
  
  -- Quality
  plan_quality_score numeric, -- 0-100
  execution_efficiency numeric, -- 0-100
  
  -- Metadata
  plan_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- AGENT RECOMMENDATIONS TABLE
-- ============================================
create table if not exists agent_recommendations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  task_id uuid references agent_tasks(id) on delete cascade,
  user_id uuid, -- References profiles.id
  
  -- Recommendation
  recommendation_type text not null, -- project, research, dataset, collaboration, learning_path, technology
  recommendation_title text not null,
  recommendation_text text not null,
  
  -- Scoring
  relevance_score numeric not null, -- 0-100
  confidence_score numeric not null, -- 0-100
  priority_score numeric not null, -- 0-100
  
  -- Content
  recommended_items uuid[] default array[]::uuid[], -- IDs of recommended entities
  recommended_urls text[] default array[]::text[],
  reasoning text,
  
  -- Context
  context_data jsonb,
  user_context jsonb,
  
  -- Interaction
  viewed_at timestamptz,
  accepted_at timestamptz,
  dismissed_at timestamptz,
  feedback text,
  rating integer, -- 1-5
  
  -- Metadata
  recommendation_data jsonb,
  
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ============================================
-- AGENT KNOWLEDGE NAVIGATION TABLE
-- ============================================
create table if not exists agent_knowledge_navigation (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  task_id uuid references agent_tasks(id) on delete cascade,
  
  -- Navigation
  navigation_type text not null, -- search, exploration, connection, synthesis
  start_point text,
  end_point text,
  
  -- Path
  navigation_path jsonb, -- Array of nodes visited
  path_length integer not null default 0,
  path_quality numeric, -- 0-100
  
  -- Knowledge Areas
  domains_visited text[] default array[]::text[],
  topics_explored text[] default array[]::text[],
  connections_made integer not null default 0,
  
  -- Results
  insights_discovered text[] default array[]::text[],
  patterns_found text[] default array[]::text[],
  knowledge_synthesized text,
  
  -- Metadata
  navigation_data jsonb,
  
  created_at timestamptz not null default now()
);

-- ============================================
-- AGENT CROSS_DOMAIN_DISCOVERY TABLE
-- ============================================
create table if not exists agent_cross_domain_discovery (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  task_id uuid references agent_tasks(id) on delete cascade,
  
  -- Discovery
  source_domain text not null,
  target_domain text not null,
  discovery_method text not null, -- analogy, transfer_learning, pattern_matching, semantic
  
  -- Connections
  connections_found jsonb,
  connection_strength numeric, -- 0-100
  novelty_score numeric, -- 0-100
  
  -- Insights
  cross_domain_insights text[] default array[]::text[],
  transferable_concepts text[] default array[]::text[],
  innovation_opportunities text[] default array[]::text[],
  
  -- Validation
  validation_status text not null default 'pending', -- pending, validated, rejected
  validation_evidence text,
  
  -- Metadata
  discovery_data jsonb,
  
  created_at timestamptz not null default now()
);

-- ============================================
-- AGENT PERFORMANCE METRICS TABLE
-- ============================================
create table if not exists agent_performance_metrics (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  
  -- Metrics
  metric_name text not null,
  metric_value numeric not null,
  metric_unit text,
  
  -- Dimensions
  time_period text not null, -- hourly, daily, weekly, monthly
  task_type text,
  user_segment text,
  
  -- Context
  dimensions jsonb,
  
  -- Time
  recorded_at timestamptz not null default now(),
  
  created_at timestamptz not null default now()
);

-- ============================================
-- AGENT FEEDBACK TABLE
-- ============================================
create table if not exists agent_feedback (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references ai_agents(id) on delete cascade,
  task_id uuid references agent_tasks(id) on delete cascade,
  user_id uuid not null, -- References profiles.id
  
  -- Feedback
  feedback_type text not null, -- rating, comment, correction, suggestion
  rating integer, -- 1-5
  feedback_text text,
  
  -- Specifics
  feedback_category text, -- accuracy, relevance, helpfulness, clarity, speed
  aspects text[] default array[]::text[],
  
  -- Corrections
  original_output jsonb,
  corrected_output jsonb,
  
  -- Metadata
  feedback_data jsonb,
  
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_ai_agents_type on ai_agents(agent_type);
create index if not exists idx_ai_agents_status on ai_agents(status);
create index if not exists idx_ai_agents_public on ai_agents(is_public);

create index if not exists idx_agent_tasks_agent on agent_tasks(agent_id);
create index if not exists idx_agent_tasks_user on agent_tasks(user_id);
create index if not exists idx_agent_tasks_status on agent_tasks(status);
create index if not exists idx_agent_tasks_type on agent_tasks(task_type);
create index if not exists idx_agent_tasks_created on agent_tasks(created_at desc);

create index if not exists idx_agent_conversations_agent on agent_conversations(agent_id);
create index if not exists idx_agent_conversations_user on agent_conversations(user_id);
create index if not exists idx_agent_conversations_task on agent_conversations(task_id);
create index if not exists idx_agent_conversations_active on agent_conversations(is_active);

create index if not exists idx_agent_messages_conversation on agent_messages(conversation_id);
create index if not exists idx_agent_messages_agent on agent_messages(agent_id);
create index if not exists idx_agent_messages_user on agent_messages(user_id);
create index if not exists idx_agent_messages_created on agent_messages(created_at desc);

create index if not exists idx_agent_tool_calls_agent on agent_tool_calls(agent_id);
create index if not exists idx_agent_tool_calls_task on agent_tool_calls(task_id);
create index if not exists idx_agent_tool_calls_message on agent_tool_calls(message_id);
create index if not exists idx_agent_tool_calls_status on agent_tool_calls(status);

create index if not exists idx_agent_plans_agent on agent_plans(agent_id);
create index if not exists idx_agent_plans_task on agent_plans(task_id);
create index if not exists idx_agent_plans_status on agent_plans(execution_status);

create index if not exists idx_agent_recommendations_agent on agent_recommendations(agent_id);
create index if not exists idx_agent_recommendations_user on agent_recommendations(user_id);
create index if not exists idx_agent_recommendations_type on agent_recommendations(recommendation_type);
create index if not exists idx_agent_recommendations_score on agent_recommendations(relevance_score desc);

create index if not exists idx_agent_knowledge_navigation_agent on agent_knowledge_navigation(agent_id);
create index if not exists idx_agent_knowledge_navigation_task on agent_knowledge_navigation(task_id);
create index if not exists idx_agent_knowledge_navigation_type on agent_knowledge_navigation(navigation_type);

create index if not exists idx_agent_cross_domain_discovery_agent on agent_cross_domain_discovery(agent_id);
create index if not exists idx_agent_cross_domain_discovery_task on agent_cross_domain_discovery(task_id);
create index if not exists idx_agent_cross_domain_discovery_status on agent_cross_domain_discovery(validation_status);

create index if not exists idx_agent_performance_metrics_agent on agent_performance_metrics(agent_id);
create index if not exists idx_agent_performance_metrics_name on agent_performance_metrics(metric_name);
create index if not exists idx_agent_performance_metrics_recorded on agent_performance_metrics(recorded_at desc);

create index if not exists idx_agent_feedback_agent on agent_feedback(agent_id);
create index if not exists idx_agent_feedback_user on agent_feedback(user_id);
create index if not exists idx_agent_feedback_type on agent_feedback(feedback_type);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table ai_agents enable row level security;
alter table agent_tasks enable row level security;
alter table agent_conversations enable row level security;
alter table agent_messages enable row level security;
alter table agent_tool_calls enable row level security;
alter table agent_plans enable row level security;
alter table agent_recommendations enable row level security;
alter table agent_knowledge_navigation enable row level security;
alter table agent_cross_domain_discovery enable row level security;
alter table agent_performance_metrics enable row level security;
alter table agent_feedback enable row level security;

-- Public read access for public agents
create policy "Public can view public agents" on ai_agents for select using (is_public = true);

-- User access to their own data
create policy "Users can view their tasks" on agent_tasks for select using (auth.uid() = user_id);
create policy "Users can view their conversations" on agent_conversations for select using (auth.uid() = user_id);
create policy "Users can view their messages" on agent_messages for select using (auth.uid() = user_id);
create policy "Users can view their recommendations" on agent_recommendations for select using (auth.uid() = user_id);
create policy "Users can create their feedback" on agent_feedback for insert with check (auth.uid() = user_id);

-- Admin full access
create policy "Admins can manage ai agents" on ai_agents for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent tasks" on agent_tasks for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent conversations" on agent_conversations for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent messages" on agent_messages for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent tool calls" on agent_tool_calls for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent plans" on agent_plans for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent recommendations" on agent_recommendations for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent knowledge navigation" on agent_knowledge_navigation for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent cross domain discovery" on agent_cross_domain_discovery for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent performance metrics" on agent_performance_metrics for all using (auth.role() = 'authenticated');
create policy "Admins can manage agent feedback" on agent_feedback for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger update_ai_agents_updated_at before update on ai_agents
  for each row execute function update_updated_at_column();

create trigger update_agent_tasks_updated_at before update on agent_tasks
  for each row execute function update_updated_at_column();

create trigger update_agent_conversations_updated_at before update on agent_conversations
  for each row execute function update_updated_at_column();

create trigger update_agent_plans_updated_at before update on agent_plans
  for each row execute function update_updated_at_column();
