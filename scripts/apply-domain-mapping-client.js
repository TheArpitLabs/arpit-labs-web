// Script to apply content domain mapping migration using Supabase client
// Run with: node scripts/apply-domain-mapping-client.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  logger.info('🚀 Applying Content Domain Mapping Migration via Supabase Client');
  logger.info('===========================================');

  try {
    // Get domain IDs
    const { data: domains, error: domainsError } = await supabase
      .from('engineering_domains')
      .select('id, slug')
      .in('slug', ['iot-embedded-systems', 'software-development', 'robotics']);

    if (domainsError) throw domainsError;

    const domainMap = {};
    domains.forEach(d => domainMap[d.slug] = d.id);

    logger.info('Found domains:', Object.keys(domainMap));

    // Get subdomain IDs
    const { data: subdomains, error: subdomainsError } = await supabase
      .from('engineering_subdomains')
      .select('id, slug')
      .in('slug', ['smart-cities', 'full-stack', 'mobile-development', 'autonomous-systems', 'arduino']);

    if (subdomainsError) throw subdomainsError;

    const subdomainMap = {};
    subdomains.forEach(s => subdomainMap[s.slug] = s.id);

    logger.info('Found subdomains:', Object.keys(subdomainMap));

    // Get project IDs
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, slug')
      .in('slug', [
        'smart-traffic-management-system',
        'hospital-attendance-system',
        'ncc-buddy',
        'ship-bridge-collision-prevention',
        'accident-detection-system'
      ]);

    if (projectsError) throw projectsError;

    const projectMap = {};
    projects.forEach(p => projectMap[p.slug] = p.id);

    logger.info('Found projects:', Object.keys(projectMap));

    // Create mappings
    const mappings = [
      {
        content_id: projectMap['smart-traffic-management-system'],
        content_type: 'project',
        domain_id: domainMap['iot-embedded-systems'],
        subdomain_id: subdomainMap['smart-cities'],
        confidence_score: 0.9
      },
      {
        content_id: projectMap['hospital-attendance-system'],
        content_type: 'project',
        domain_id: domainMap['software-development'],
        subdomain_id: subdomainMap['full-stack'],
        confidence_score: 0.85
      },
      {
        content_id: projectMap['ncc-buddy'],
        content_type: 'project',
        domain_id: domainMap['software-development'],
        subdomain_id: subdomainMap['mobile-development'],
        confidence_score: 0.9
      },
      {
        content_id: projectMap['ship-bridge-collision-prevention'],
        content_type: 'project',
        domain_id: domainMap['robotics'],
        subdomain_id: subdomainMap['autonomous-systems'],
        confidence_score: 0.85
      },
      {
        content_id: projectMap['accident-detection-system'],
        content_type: 'project',
        domain_id: domainMap['iot-embedded-systems'],
        subdomain_id: subdomainMap['arduino'],
        confidence_score: 0.9
      }
    ];

    logger.info('Inserting mappings...');

    for (const mapping of mappings) {
      const { error: insertError } = await supabase
        .from('content_domain_mapping')
        .insert(mapping);

      if (insertError) {
        logger.error('Error inserting mapping:', insertError);
      } else {
        logger.info('✓ Inserted mapping for project:', mapping.content_id);
      }
    }

    // Update domain counts
    logger.info('Updating domain project counts...');
    
    for (const domainSlug of ['iot-embedded-systems', 'software-development', 'robotics']) {
      const { count, error: countError } = await supabase
        .from('content_domain_mapping')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', 'project')
        .eq('domain_id', domainMap[domainSlug]);

      if (countError) {
        logger.error('Error counting projects for', domainSlug, ':', countError);
      } else {
        const { error: updateError } = await supabase
          .from('engineering_domains')
          .update({ total_projects: count })
          .eq('id', domainMap[domainSlug]);

        if (updateError) {
          logger.error('Error updating count for', domainSlug, ':', updateError);
        } else {
          logger.info(`✓ Updated ${domainSlug} with ${count} projects`);
        }
      }
    }

    logger.info('✅ Migration applied successfully');
    logger.info('');
    logger.info('Projects should now be visible on engineering domain landing pages.');

  } catch (error) {
    logger.error('Error applying migration:', error.message);
    logger.info('\n⚠️  Supabase client approach failed.');
    logger.info('Please apply the migration manually using:');
    logger.info('  1. Supabase Dashboard: SQL Editor');
    logger.info('  2. Navigate to: https://app.supabase.com/project/' + supabaseUrl.replace('https://', '').split('.')[0] + '/sql/new');
    logger.info('  3. Paste the contents of: supabase/migrations/20260615_populate_content_domain_mapping.sql');
    logger.info('  4. Click "Run" to execute');
    process.exit(1);
  }
}

applyMigration();
