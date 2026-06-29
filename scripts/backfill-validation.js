require('dotenv').config({
  path: '.env.local'
});

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validation logic (ported from repository-data-validator.ts)
function validateRepositoryData(data) {
  const errors = [];
  const warnings = [];
  let validationScore = 100;

  // Normalization layer: map database field names to validation logic
  const stars =
    data.github_stars ??
    data.stars ??
    0;

  const topics =
    data.repository_topics ??
    data.topics ??
    [];

  const owner =
    data.github_owner ??
    data.owner ??
    null;

  // Debug logging
  logger.info({
    title: data.title,
    stars,
    topicsCount: topics?.length || 0,
    owner,
  });

  // Check required fields
  const requiredFields = {
    title: !!data.title && data.title.trim().length > 0,
    description: !!data.description && data.description.trim().length > 0,
    github_url: !!data.github_url && data.github_url.trim().length > 0,
    category: !!data.category && data.category.trim().length > 0,
    language: !!data.language && data.language.trim().length > 0,
  };

  // Deduct points for missing required fields
  if (!requiredFields.title) {
    errors.push('Missing required field: title');
    validationScore -= 20;
  }
  if (!requiredFields.description) {
    errors.push('Missing required field: description');
    validationScore -= 20;
  }
  if (!requiredFields.github_url) {
    errors.push('Missing required field: github_url');
    validationScore -= 20;
  }
  if (!requiredFields.category) {
    errors.push('Missing required field: category');
    validationScore -= 10;
  }
  if (!requiredFields.language) {
    errors.push('Missing required field: language');
    validationScore -= 10;
  }

  // Check rejection rules
  const rejectionRules = {
    descriptionTooShort: false,
    starsTooLow: false,
    isArchived: false,
    isDisabled: false,
    emptyTopics: false,
    missingOwner: false,
  };

  // Description length check (minimum 50 characters)
  if (data.description && data.description.trim().length < 50) {
    rejectionRules.descriptionTooShort = true;
    errors.push(`Description too short (${data.description.trim().length} < 50 characters)`);
    validationScore -= 15;
  }

  // Stars check (minimum 50)
  if (stars < 50) {
    rejectionRules.starsTooLow = true;
    errors.push(`Stars below threshold (${stars} < 50)`);
    validationScore -= 15;
  }

  // Archived check
  if (data.archived) {
    rejectionRules.isArchived = true;
    errors.push('Repository is archived');
    validationScore -= 20;
  }

  // Disabled check
  if (data.disabled) {
    rejectionRules.isDisabled = true;
    errors.push('Repository is disabled');
    validationScore -= 20;
  }

  // Empty topics check
  if (!topics || topics.length === 0) {
    rejectionRules.emptyTopics = true;
    errors.push('Repository has no topics');
    validationScore -= 10;
  }

  // Missing owner check
  if (!owner || owner.trim().length === 0) {
    rejectionRules.missingOwner = true;
    errors.push('Repository owner is missing');
    validationScore -= 15;
  }

  // URL validation
  const urlValidation = {
    homepageValid: true,
    avatarValid: true,
    repositoryValid: true,
  };

  // Homepage URL validation
  if (data.homepage_url) {
    if (!isValidUrl(data.homepage_url)) {
      urlValidation.homepageValid = false;
      warnings.push('Invalid homepage URL format');
      validationScore -= 5;
    }
  }

  // Avatar URL validation
  if (data.avatar_url) {
    if (!isValidUrl(data.avatar_url)) {
      urlValidation.avatarValid = false;
      warnings.push('Invalid avatar URL format');
      validationScore -= 5;
    }
  }

  // Repository URL validation
  if (data.repository_url) {
    if (!isValidUrl(data.repository_url)) {
      urlValidation.repositoryValid = false;
      warnings.push('Invalid repository URL format');
      validationScore -= 5;
    }
  }

  // Ensure validation score doesn't go below 0
  validationScore = Math.max(0, validationScore);

  // Determine validation status
  let validationStatus = 'passed';
  let shouldReject = false;

  // Auto-reject if any critical rejection rules are triggered
  if (rejectionRules.isArchived || rejectionRules.isDisabled || rejectionRules.starsTooLow) {
    validationStatus = 'failed';
    shouldReject = true;
  }

  // Fail if too many errors or score too low
  if (errors.length > 3 || validationScore < 50) {
    validationStatus = 'failed';
    shouldReject = true;
  }

  // Skip if missing critical required fields
  if (!requiredFields.title || !requiredFields.github_url) {
    validationStatus = 'skipped';
  }

  return {
    isValid: validationStatus === 'passed',
    shouldReject,
    validationScore,
    validationStatus,
    errors,
    warnings,
    metadata: {
      requiredFields,
      rejectionRules,
      urlValidation,
    },
  };
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function backfillValidation() {
  logger.info('🚀 Starting validation backfill...\n');

  // Fetch all projects
  const { data: projects, error: fetchError } = await supabase
    .from('projects')
    .select('*');

  if (fetchError) {
    logger.error('❌ Error fetching projects:', fetchError);
    process.exit(1);
  }

  logger.info(`📊 Found ${projects.length} projects\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const project of projects) {
    try {
      // Skip if already validated
      if (project.validation_status && project.validation_status !== 'pending') {
        skipped++;
        logger.info(`⏭️  Skipping ${project.title} (already validated: ${project.validation_status})`);
        continue;
      }

      // Validate repository data
      const validationResult = validateRepositoryData({
        title: project.title,
        description: project.description,
        github_url: project.github_url,
        category: project.category,
        language: project.language,
        github_stars: project.github_stars,
        repository_topics: project.repository_topics,
        github_owner: project.github_owner,
        archived: project.archived,
        disabled: project.disabled,
        homepage_url: project.homepage_url,
        avatar_url: project.avatar_url,
        repository_url: project.github_url,
      });

      // Update project with validation results
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          validation_score: validationResult.validationScore,
          validation_status: validationResult.validationStatus,
          validation_errors: validationResult.errors,
          validated_at: new Date().toISOString(),
          validation_metadata: validationResult.metadata,
        })
        .eq('id', project.id);

      if (updateError) {
        logger.error(`❌ Failed to update ${project.title}:`, updateError);
        failed++;
        continue;
      }

      updated++;
      logger.info(`✅ Updated ${project.title}: ${validationResult.validationStatus} (score: ${validationResult.validationScore})`);
    } catch (error) {
      logger.error(`❌ Error processing ${project.title}:`, error);
      failed++;
    }
  }

  logger.info('\n📈 Final Statistics:');
  logger.info(`   Updated: ${updated}`);
  logger.info(`   Skipped: ${skipped}`);
  logger.info(`   Failed: ${failed}`);
  logger.info(`   Total: ${projects.length}`);

  // Verify results
  const { data: verification } = await supabase
    .from('projects')
    .select('validation_status')
    .not('validation_status', 'is', null);

  const statusCounts = {
    passed: 0,
    failed: 0,
    skipped: 0,
    pending: 0,
  };

  verification?.forEach(p => {
    statusCounts[p.validation_status] = (statusCounts[p.validation_status] || 0) + 1;
  });

  logger.info('\n📊 Validation Status Distribution:');
  logger.info(`   Passed: ${statusCounts.passed}`);
  logger.info(`   Failed: ${statusCounts.failed}`);
  logger.info(`   Skipped: ${statusCounts.skipped}`);
  logger.info(`   Pending: ${statusCounts.pending}`);

  logger.info('\n✨ Backfill complete!');
}

backfillValidation().catch(console.error);
