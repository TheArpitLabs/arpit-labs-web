// Script to apply engineering domain ecosystem migration
// Run with: node scripts/apply-engineering-migration.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

// Create client with service role for admin privileges
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({ sql })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }
  
  return await response.json();
}

async function applyMigration() {
  logger.info('� Applying Engineering Domain Ecosystem Migration');
  logger.info('===========================================');

  try {
    // First, check if tables already exist
    const { data: domainsCheck, error: domainsError } = await supabase
      .from('engineering_domains')
      .select('id')
      .limit(1);

    if (!domainsError && domainsCheck) {
      logger.info('✅ Engineering domain tables already exist');
      logger.info('Skipping migration...');
      return;
    }

    logger.info('Tables do not exist. Creating engineering domain ecosystem...');

    // Create the tables using the REST API SQL execution
    const createDomainsSQL = `
      CREATE TABLE IF NOT EXISTS engineering_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        total_projects INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;

    const createSubdomainsSQL = `
      CREATE TABLE IF NOT EXISTS engineering_subdomains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain_id UUID NOT NULL REFERENCES engineering_domains(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;

    const createMappingSQL = `
      CREATE TABLE IF NOT EXISTS content_domain_mapping (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL,
        content_type TEXT NOT NULL,
        domain_id UUID REFERENCES engineering_domains(id) ON DELETE CASCADE,
        subdomain_id UUID REFERENCES engineering_subdomains(id) ON DELETE CASCADE,
        confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;

    // Try to execute SQL via REST API
    try {
      await executeSQL(createDomainsSQL);
      logger.info('✅ Created engineering_domains table');
    } catch (error) {
      logger.info('⚠️  Could not create table via REST API:', error.message);
      logger.info('Using alternative approach...');
    }

    // Use the Supabase client to insert data directly
    // First insert the domains
    const domains = [
      { name: 'AI & Machine Learning', slug: 'ai-machine-learning', description: 'Artificial Intelligence, Machine Learning, Deep Learning, Computer Vision, NLP, and Agentic AI systems', icon: '🤖', color: '#8B5CF6' },
      { name: 'Cybersecurity', slug: 'cybersecurity', description: 'Ethical Hacking, Penetration Testing, Network Security, Cloud Security, and Digital Forensics', icon: '🔒', color: '#EF4444' },
      { name: 'IoT & Embedded Systems', slug: 'iot-embedded-systems', description: 'Arduino, ESP32, Raspberry Pi, Embedded Linux, Smart Cities, and Industrial IoT', icon: '🌐', color: '#10B981' },
      { name: 'Robotics', slug: 'robotics', description: 'ROS, Drones, Autonomous Systems, Industrial Robotics, SLAM, and Computer Vision Robotics', icon: '🦾', color: '#F59E0B' },
      { name: 'Software Development', slug: 'software-development', description: 'Frontend, Backend, Full Stack, Mobile Development, DevOps, Cloud Engineering, and API Development', icon: '💻', color: '#3B82F6' },
      { name: 'Data Science', slug: 'data-science', description: 'Data Analytics, Data Engineering, Visualization, Big Data, Business Intelligence, and Predictive Analytics', icon: '📊', color: '#EC4899' }
    ];

    // Try to insert domains
    for (const domain of domains) {
      const { error } = await supabase
        .from('engineering_domains')
        .insert(domain);
      
      if (error) {
        logger.info(`⚠️  Could not insert domain ${domain.name}:`, error.message);
      } else {
        logger.info(`✅ Inserted domain: ${domain.name}`);
      }
    }

    logger.info('\n⚠️  Migration partially applied via REST API.');
    logger.info('Some DDL operations may require manual execution via:');
    logger.info('  1. Supabase Dashboard: SQL Editor');
    logger.info('  2. Migration file: supabase/migrations/20260615_engineering_domain_ecosystem.sql');

  } catch (error) {
    logger.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
