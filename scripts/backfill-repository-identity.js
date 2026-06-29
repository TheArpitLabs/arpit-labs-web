/**
 * Repository Identity Backfill Script
 * 
 * Backfills existing GitHub repositories with repository identity columns:
 * - github_owner
 * - github_repo_name
 * - normalized_github_url
 * 
 * Usage: node scripts/backfill-repository-identity.js
 */

require('dotenv').config({
  path: '.env.local'
});

const { createClient } = require('@supabase/supabase-js');

// GitHub URL normalization functions
function normalizeGithubUrl(url) {
  if (!url) return '';
  
  try {
    const trimmed = url.trim();
    let parsed;
    
    try {
      parsed = new URL(trimmed);
    } catch {
      if (trimmed.startsWith('github.com/')) {
        return trimmed;
      }
      if (trimmed.includes('github.com/')) {
        const match = trimmed.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          return `github.com/${match[1]}/${match[2]}`;
        }
      }
      return trimmed;
    }
    
    let hostname = parsed.hostname.replace(/^www\./, '');
    
    if (!hostname.endsWith('github.com')) {
      return trimmed;
    }
    
    let pathname = parsed.pathname;
    if (pathname.endsWith('.git')) {
      pathname = pathname.slice(0, -4);
    }
    
    pathname = pathname.replace(/\/$/, '');
    
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1];
      return `github.com/${owner}/${repo}`;
    }
    
    return trimmed;
  } catch (error) {
    logger.error('Error normalizing GitHub URL:', error);
    return url;
  }
}

function extractGitHubUrlParts(url) {
  const normalized = normalizeGithubUrl(url);
  if (!normalized) return null;
  
  const parts = normalized.split('/');
  if (parts.length >= 3 && parts[0] === 'github.com') {
    return {
      owner: parts[1],
      repo: parts[2],
      normalized: normalized
    };
  }
  
  return null;
}

async function backfillRepositoryIdentity() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Debug logs to verify environment loading
  logger.info('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  logger.info(
    'SERVICE KEY:',
    process.env.SUPABASE_SERVICE_ROLE_KEY ? 'FOUND' : 'MISSING'
  );
  
  if (!supabaseUrl || !supabaseKey) {
    logger.error('Missing Supabase credentials');
    logger.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  logger.info('🔄 Starting repository identity backfill...');
  
  try {
    // Fetch all projects with GitHub URLs
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, github_url, github_owner, github_repo_name, normalized_github_url')
      .not('github_url', 'is', null);
    
    if (error) {
      logger.error('Error fetching projects:', error);
      process.exit(1);
    }
    
    logger.info(`📊 Found ${projects.length} projects with GitHub URLs`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const project of projects) {
      try {
        // Skip if already has identity data
        if (project.github_owner && project.github_repo_name && project.normalized_github_url) {
          skipped++;
          continue;
        }
        
        // Extract repository identity
        const parts = extractGitHubUrlParts(project.github_url);
        
        if (!parts) {
          logger.warn(`⚠️  Could not extract parts from URL: ${project.github_url}`);
          errors++;
          continue;
        }
        
        // Update project with identity data
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            github_owner: parts.owner,
            github_repo_name: parts.repo,
            normalized_github_url: parts.normalized
          })
          .eq('id', project.id);
        
        if (updateError) {
          logger.error(`❌ Error updating project ${project.id}:`, updateError);
          errors++;
          continue;
        }
        
        updated++;
        logger.info(`✅ Updated: ${parts.owner}/${parts.repo}`);
        
      } catch (error) {
        logger.error(`❌ Error processing project ${project.id}:`, error);
        errors++;
      }
    }
    
    logger.info('\n📋 Backfill Summary:');
    logger.info(`✅ Updated: ${updated}`);
    logger.info(`⏭️  Skipped: ${skipped}`);
    logger.info(`❌ Errors: ${errors}`);
    logger.info(`📊 Total: ${projects.length}`);
    
    // Get final health statistics
    const { count: totalWithOwner } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('github_owner', 'is', null);
    
    const { count: totalWithNormalizedUrl } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('normalized_github_url', 'is', null);
    
    logger.info('\n🏥 Repository Identity Health:');
    logger.info(`📝 Projects with owner: ${totalWithOwner || 0}`);
    logger.info(`🔗 Projects with normalized URL: ${totalWithNormalizedUrl || 0}`);
    
    logger.info('\n✅ Backfill completed successfully!');
    
  } catch (error) {
    logger.error('💥 Fatal error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillRepositoryIdentity();
