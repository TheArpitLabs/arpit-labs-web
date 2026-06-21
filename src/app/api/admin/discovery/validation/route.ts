import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { validateRepositoryData, getValidationStatistics as getBatchValidationStatistics, type RepositoryDataInput } from '@/lib/project-discovery/repository-data-validator';
import { logValidationEvent, getValidationAnalytics } from '@/lib/validation-logging-service';

/**
 * GET /api/admin/discovery/validation
 * 
 * Returns validation statistics and recent validation results
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'statistics') {
      return await getValidationStatistics();
    } else if (action === 'recent') {
      return await getRecentValidations();
    } else if (action === 'errors') {
      return await getCommonErrors();
    } else if (action === 'analytics') {
      const days = parseInt(searchParams.get('days') || '30');
      const analytics = await getValidationAnalytics(days);
      return NextResponse.json(analytics);
    } else {
      // Return overview by default
      return await getValidationOverview();
    }
  } catch (error) {
    console.error('Error in validation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/discovery/validation
 * 
 * Validate repository data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositories, project_id } = body;

    if (!repositories || !Array.isArray(repositories)) {
      return NextResponse.json(
        { error: 'Invalid request: repositories array required' },
        { status: 400 }
      );
    }

    // Validate repositories
    const results = repositories.map((repo: RepositoryDataInput) => {
      const result = validateRepositoryData(repo);
      return {
        repository: repo,
        validation: result,
      };
    });

    // If project_id is provided, update the project with validation results
    if (project_id) {
      await updateProjectValidation(project_id, results);
    }

    // Log validation events
    for (const result of results) {
      await logValidationEvent({
        project_id: project_id,
        validation_status: result.validation.validationStatus,
        validation_score: result.validation.validationScore,
        validation_errors: result.validation.errors,
        validation_metadata: result.validation.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    // Get statistics
    const statistics = getBatchValidationStatistics(results.map(r => r.validation));

    return NextResponse.json({
      success: true,
      results,
      statistics,
    });
  } catch (error) {
    console.error('Error validating repositories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/discovery/validation
 * 
 * Re-validate a specific project
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Fetch project data
    const { data: project, error: fetchError } = await supabaseServer
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate project data
    const validationInput: RepositoryDataInput = {
      title: project.title,
      description: project.description,
      github_url: project.github_url,
      category: project.category,
      language: project.language,
      stars: project.stars,
      archived: project.archived,
      disabled: project.disabled,
      topics: project.topics,
      owner: project.github_owner,
      homepage_url: project.homepage_url,
      avatar_url: project.avatar_url,
      repository_url: project.github_url,
    };

    const validationResult = validateRepositoryData(validationInput);

    // Update project with validation results
    const { error: updateError } = await supabaseServer
      .from('projects')
      .update({
        validation_score: validationResult.validationScore,
        validation_status: validationResult.validationStatus,
        validation_errors: validationResult.errors,
        validated_at: new Date().toISOString(),
        validation_metadata: validationResult.metadata,
      })
      .eq('id', project_id);

    if (updateError) {
      console.error('Error updating project validation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update project validation' },
        { status: 500 }
      );
    }

    // Log validation event
    await logValidationEvent({
      project_id: project_id,
      validation_status: validationResult.validationStatus,
      validation_score: validationResult.validationScore,
      validation_errors: validationResult.errors,
      validation_metadata: validationResult.metadata,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      validation: validationResult,
    });
  } catch (error) {
    console.error('Error re-validating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get validation overview statistics
 */
async function getValidationOverview() {
  // Get validation status distribution
  const { data: projects, error: projectsError } = await supabaseServer
    .from('projects')
    .select('validation_status, validation_score, validation_errors')
    .not('validation_status', 'is', null);

  if (projectsError) {
    console.error('Error fetching validation data:', projectsError);
    return NextResponse.json(
      { error: 'Failed to fetch validation data' },
      { status: 500 }
    );
  }

  // Calculate statistics
  const statusCounts: Record<string, number> = {
    passed: 0,
    failed: 0,
    pending: 0,
    skipped: 0,
  };

  let totalScore = 0;
  let scoredCount = 0;
  const allErrors: string[] = [];

  projects?.forEach(project => {
    const status = project.validation_status || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (project.validation_score !== null && project.validation_score !== undefined) {
      totalScore += project.validation_score;
      scoredCount++;
    }

    if (project.validation_errors && Array.isArray(project.validation_errors)) {
      allErrors.push(...project.validation_errors);
    }
  });

  const averageScore = scoredCount > 0 ? totalScore / scoredCount : 0;

  // Count most common errors
  const errorCounts: Record<string, number> = {};
  allErrors.forEach(error => {
    errorCounts[error] = (errorCounts[error] || 0) + 1;
  });

  const mostCommonErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    total: projects?.length || 0,
    passed: statusCounts.passed || 0,
    failed: statusCounts.failed || 0,
    pending: statusCounts.pending || 0,
    skipped: statusCounts.skipped || 0,
    average_score: Math.round(averageScore),
    most_common_errors: mostCommonErrors,
  });
}

/**
 * Get validation statistics
 */
async function getValidationStatistics() {
  const { data: projects, error: projectsError } = await supabaseServer
    .from('projects')
    .select('validation_status, validation_score')
    .not('validation_status', 'is', null);

  if (projectsError) {
    console.error('Error fetching validation statistics:', projectsError);
    return NextResponse.json(
      { error: 'Failed to fetch validation statistics' },
      { status: 500 }
    );
  }

  const statusCounts: Record<string, number> = {
    passed: 0,
    failed: 0,
    pending: 0,
    skipped: 0,
  };

  let totalScore = 0;
  let scoredCount = 0;

  projects?.forEach(project => {
    const status = project.validation_status || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (project.validation_score !== null && project.validation_score !== undefined) {
      totalScore += project.validation_score;
      scoredCount++;
    }
  });

  const averageScore = scoredCount > 0 ? totalScore / scoredCount : 0;

  return NextResponse.json({
    total_validated: projects?.length || 0,
    passed: statusCounts.passed || 0,
    failed: statusCounts.failed || 0,
    pending: statusCounts.pending || 0,
    skipped: statusCounts.skipped || 0,
    average_score: Math.round(averageScore),
  });
}

/**
 * Get recent validation results
 */
async function getRecentValidations() {
  const { data: projects, error: projectsError } = await supabaseServer
    .from('projects')
    .select('id, title, validation_status, validation_score, validation_errors, validated_at')
    .not('validation_status', 'is', null)
    .order('validated_at', { ascending: false })
    .limit(20);

  if (projectsError) {
    console.error('Error fetching recent validations:', projectsError);
    return NextResponse.json(
      { error: 'Failed to fetch recent validations' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    recent_validations: projects || [],
  });
}

/**
 * Get common validation errors
 */
async function getCommonErrors() {
  const { data: projects, error: projectsError } = await supabaseServer
    .from('projects')
    .select('validation_errors')
    .not('validation_errors', 'is', null)
    .eq('validation_status', 'failed');

  if (projectsError) {
    console.error('Error fetching common errors:', projectsError);
    return NextResponse.json(
      { error: 'Failed to fetch common errors' },
      { status: 500 }
    );
  }

  const allErrors: string[] = [];
  projects?.forEach(project => {
    if (project.validation_errors && Array.isArray(project.validation_errors)) {
      allErrors.push(...project.validation_errors);
    }
  });

  const errorCounts: Record<string, number> = {};
  allErrors.forEach(error => {
    errorCounts[error] = (errorCounts[error] || 0) + 1;
  });

  const mostCommonErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    common_errors: mostCommonErrors,
    total_errors: allErrors.length,
  });
}

/**
 * Update project with validation results
 */
async function updateProjectValidation(project_id: string, results: any[]) {
  // Use the first validation result (assuming single project validation)
  const validation = results[0]?.validation;
  if (!validation) {
    console.log('No validation result found for:', project_id);
    return;
  }

  const { error } = await supabaseServer
    .from('projects')
    .update({
      validation_score: validation.validationScore,
      validation_status: validation.validationStatus,
      validation_errors: validation.errors,
      validated_at: new Date().toISOString(),
      validation_metadata: validation.metadata,
    })
    .eq('id', project_id);

  if (error) {
    console.error('Error updating project validation:', error);
    throw error;
  }

  console.log('Updated project validation for:', project_id, validation.validationStatus);
}
