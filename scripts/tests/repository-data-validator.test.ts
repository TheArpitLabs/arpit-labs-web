/**
 * Repository Data Validator Test
 * 
 * Phase 5: Data Validation Layer
 * Tests the validation logic to ensure it correctly validates repository data
 */

import { validateRepositoryData, getValidationStatistics, getValidationSummary, type RepositoryDataInput } from '@/lib/project-discovery/repository-data-validator';

// Test cases for validation
const testCases: { name: string; input: RepositoryDataInput; expectedStatus: 'passed' | 'failed' | 'skipped' }[] = [
  {
    name: 'Valid repository with all required fields',
    input: {
      title: 'Test Project',
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: false,
      disabled: false,
      topics: ['web', 'typescript', 'testing'],
      owner: 'test-user',
    },
    expectedStatus: 'passed',
  },
  {
    name: 'Repository with short description',
    input: {
      title: 'Test Project',
      description: 'Short desc',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: false,
      disabled: false,
      topics: ['web'],
      owner: 'test-user',
    },
    expectedStatus: 'failed',
  },
  {
    name: 'Repository with low stars',
    input: {
      title: 'Test Project',
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 25,
      archived: false,
      disabled: false,
      topics: ['web'],
      owner: 'test-user',
    },
    expectedStatus: 'failed',
  },
  {
    name: 'Archived repository',
    input: {
      title: 'Test Project',
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: true,
      disabled: false,
      topics: ['web'],
      owner: 'test-user',
    },
    expectedStatus: 'failed',
  },
  {
    name: 'Disabled repository',
    input: {
      title: 'Test Project',
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: false,
      disabled: true,
      topics: ['web'],
      owner: 'test-user',
    },
    expectedStatus: 'failed',
  },
  {
    name: 'Repository missing title',
    input: {
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: false,
      disabled: false,
      topics: ['web'],
      owner: 'test-user',
    },
    expectedStatus: 'skipped',
  },
  {
    name: 'Repository missing github_url',
    input: {
      title: 'Test Project',
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: false,
      disabled: false,
      topics: ['web'],
      owner: 'test-user',
    },
    expectedStatus: 'skipped',
  },
  {
    name: 'Repository with empty topics',
    input: {
      title: 'Test Project',
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: false,
      disabled: false,
      topics: [],
      owner: 'test-user',
    },
    expectedStatus: 'failed',
  },
  {
    name: 'Repository missing owner',
    input: {
      title: 'Test Project',
      description: 'This is a comprehensive test project with a description that is definitely longer than 50 characters to meet the validation requirements.',
      github_url: 'https://github.com/test/test-project',
      category: 'web-development',
      language: 'TypeScript',
      stars: 100,
      archived: false,
      disabled: false,
      topics: ['web'],
    },
    expectedStatus: 'failed',
  },
];

// Run tests
function runTests() {
  console.log('Running Repository Data Validator Tests...\n');
  
  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    
    const result = validateRepositoryData(testCase.input);
    
    if (result.validationStatus === testCase.expectedStatus) {
      console.log(`✅ PASSED - Status: ${result.validationStatus}, Score: ${result.validationScore}`);
      passed++;
    } else {
      console.log(`❌ FAILED - Expected: ${testCase.expectedStatus}, Got: ${result.validationStatus}, Score: ${result.validationScore}`);
      console.log(`   Errors: ${result.errors.join(', ')}`);
      failed++;
    }
    
    console.log('');
  });

  console.log(`\n=== Test Results ===`);
  console.log(`Total: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  return { total: testCases.length, passed, failed };
}

// Export for use in other test files
export { runTests, testCases };
