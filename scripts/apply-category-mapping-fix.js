const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  logger.info('Applying category_domain_mapping schema fix...');
  
  const migrationSQL = `
-- Fix Category Domain Mapping Schema
-- This migration fixes the schema mismatch between frontend expectations and database structure

-- 1. DROP THE INCORRECT TABLE IF IT EXISTS
drop table if exists category_domain_mapping cascade;

-- 2. CREATE THE CORRECT SCHEMA MATCHING FRONTEND EXPECTATIONS
create table category_domain_mapping (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  domain_id uuid not null references engineering_domains(id) on delete cascade,
  confidence_score numeric default 1.0 check (confidence_score >= 0 and confidence_score <= 1),
  created_at timestamptz not null default now(),
  unique(category, domain_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
create index idx_category_domain_mapping_category on category_domain_mapping(category);
create index idx_category_domain_mapping_domain on category_domain_mapping(domain_id);

-- 4. MAP PROJECTS.CATEGORY VALUES TO ENGINEERING_DOMAINS
insert into category_domain_mapping (category, domain_id, confidence_score)
select 
  distinct p.category,
  ed.id,
  1.0
from projects p
cross join engineering_domains ed
where p.category is not null
and p.published = true
and (
  -- AI & Machine Learning
  (p.category in ('artificial-intelligence', 'machine-learning', 'deep-learning', 'computer-vision', 'nlp', 'natural-language-processing', 'generative-ai', 'reinforcement-learning', 'mlops', 'data-science') and ed.slug = 'ai-machine-learning') or
  
  -- Cybersecurity
  (p.category in ('cybersecurity', 'ethical-hacking', 'penetration-testing', 'network-security', 'cloud-security', 'malware-analysis', 'digital-forensics', 'secure-coding') and ed.slug = 'cybersecurity') or
  
  -- IoT & Embedded Systems
  (p.category in ('iot', 'embedded-systems', 'arduino', 'esp32', 'raspberry-pi', 'stm32', 'embedded-linux', 'smart-cities', 'industrial-iot', 'edge-ai', 'electronics') and ed.slug = 'iot-embedded-systems') or
  
  -- Robotics
  (p.category in ('robotics', 'ros', 'drones', 'autonomous-systems', 'industrial-robotics', 'slam', 'computer-vision-robotics') and ed.slug = 'robotics') or
  
  -- Software Development
  (p.category in ('web-development', 'mobile-development', 'cloud-computing', 'devops', 'frontend', 'backend', 'full-stack', 'api-development', 'blockchain', 'open-source-tools') and ed.slug = 'software-development') or
  
  -- Data Science
  (p.category in ('data-science', 'data-analytics', 'data-engineering', 'data-visualization', 'big-data', 'business-intelligence', 'predictive-analytics') and ed.slug = 'data-science')
)
on conflict (category, domain_id) do nothing;

-- 5. ENABLE RLS
alter table category_domain_mapping enable row level security;

-- 6. RLS POLICIES
create policy "Public can view category domain mappings" on category_domain_mapping for select using (true);
create policy "Admins can manage category domain mappings" on category_domain_mapping for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);
`;

  try {
    // Execute the migration using RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      logger.error('Error applying migration:', error);
      throw error;
    }
    
    logger.info('Migration applied successfully!');
    
    // Verify the results
    const { data: domains, error: verifyError } = await supabase
      .from('engineering_domains')
      .select(`
        id,
        name,
        slug,
        category_domain_mapping (
          category
        )
      `);
    
    if (verifyError) {
      logger.error('Error verifying migration:', verifyError);
    } else {
      logger.info('\n=== Verification Results ===');
      domains.forEach(domain => {
        const categories = domain.category_domain_mapping?.map(m => m.category) || [];
        logger.info(`${domain.name} (${domain.slug}): ${categories.length} categories`);
        if (categories.length > 0) {
          logger.info(`  Categories: ${categories.join(', ')}`);
        }
      });
    }
    
  } catch (error) {
    logger.error('Failed to apply migration:', error);
    logger.info('\nPlease apply the migration manually via Supabase dashboard:');
    logger.info('1. Go to https://supabase.com/dashboard/project/lxbtuwltzljmnwxbygcl/sql/new');
    logger.info('2. Copy contents of supabase/migrations/20260615_fix_category_domain_mapping_schema.sql');
    logger.info('3. Paste and run the SQL');
    process.exit(1);
  }
}

applyMigration();
