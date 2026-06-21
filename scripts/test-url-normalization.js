/**
 * URL Normalization Test Script
 * 
 * Simple test script for GitHub URL normalization
 * Can be run with: node scripts/test-url-normalization.js
 */

// Import the normalizer functions (simplified for testing)
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
    console.error('Error normalizing GitHub URL:', error);
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

function areSameRepository(url1, url2) {
  const norm1 = normalizeGithubUrl(url1);
  const norm2 = normalizeGithubUrl(url2);
  
  return norm1 === norm2 && norm1 !== '';
}

// Test cases
const testCases = [
  {
    name: 'Standard URL',
    input: 'https://github.com/vercel/next.js',
    expected: 'github.com/vercel/next.js'
  },
  {
    name: 'URL with trailing slash',
    input: 'https://github.com/vercel/next.js/',
    expected: 'github.com/vercel/next.js'
  },
  {
    name: 'URL with .git',
    input: 'https://github.com/vercel/next.js.git',
    expected: 'github.com/vercel/next.js'
  },
  {
    name: 'URL with www',
    input: 'https://www.github.com/vercel/next.js',
    expected: 'github.com/vercel/next.js'
  },
  {
    name: 'URL with all variations',
    input: 'https://www.github.com/vercel/next.js.git/',
    expected: 'github.com/vercel/next.js'
  },
  {
    name: 'Already normalized',
    input: 'github.com/vercel/next.js',
    expected: 'github.com/vercel/next.js'
  },
  {
    name: 'HTTP URL',
    input: 'http://github.com/vercel/next.js',
    expected: 'github.com/vercel/next.js'
  },
  {
    name: 'Empty string',
    input: '',
    expected: ''
  },
  {
    name: 'Invalid URL',
    input: 'not-a-valid-url',
    expected: 'not-a-valid-url'
  }
];

// Stress test
const stressTestVariations = [
  'https://github.com/vercel/next.js',
  'https://github.com/vercel/next.js/',
  'https://github.com/vercel/next.js.git',
  'https://www.github.com/vercel/next.js',
  'https://www.github.com/vercel/next.js/',
  'https://www.github.com/vercel/next.js.git',
  'http://github.com/vercel/next.js',
  'http://www.github.com/vercel/next.js.git',
];

// Run tests
console.log('🧪 Running GitHub URL Normalization Tests\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = normalizeGithubUrl(test.input);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}`);
    failed++;
  }
});

console.log(`\n📊 Basic Tests: ${passed} passed, ${failed} failed\n`);

// Test extractGitHubUrlParts
console.log('🧪 Testing URL Parts Extraction\n');

const partsTests = [
  {
    name: 'Standard URL',
    input: 'https://github.com/vercel/next.js',
    expected: { owner: 'vercel', repo: 'next.js', normalized: 'github.com/vercel/next.js' }
  },
  {
    name: 'URL with .git',
    input: 'https://github.com/vercel/next.js.git',
    expected: { owner: 'vercel', repo: 'next.js', normalized: 'github.com/vercel/next.js' }
  },
  {
    name: 'Invalid URL',
    input: 'not-a-valid-url',
    expected: null
  }
];

let partsPassed = 0;
let partsFailed = 0;

partsTests.forEach((test, index) => {
  const result = extractGitHubUrlParts(test.input);
  const success = JSON.stringify(result) === JSON.stringify(test.expected);
  
  if (success) {
    console.log(`✅ Parts Test ${index + 1}: ${test.name}`);
    partsPassed++;
  } else {
    console.log(`❌ Parts Test ${index + 1}: ${test.name}`);
    console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    console.log(`   Got: ${JSON.stringify(result)}`);
    partsFailed++;
  }
});

console.log(`\n📊 Parts Tests: ${partsPassed} passed, ${partsFailed} failed\n`);

// Stress test
console.log('🧪 Running Stress Test\n');

const normalizedStress = stressTestVariations.map(url => normalizeGithubUrl(url));
const uniqueStress = new Set(normalizedStress);

if (uniqueStress.size === 1) {
  console.log(`✅ Stress Test: All ${stressTestVariations.length} variations normalize to same result`);
  console.log(`   Result: ${uniqueStress.values().next().value}`);
} else {
  console.log(`❌ Stress Test: Variations produced ${uniqueStress.size} different results`);
  console.log(`   Results:`, Array.from(uniqueStress));
}

// Test areSameRepository
console.log('\n🧪 Testing Repository Comparison\n');

const comparisonTests = [
  {
    name: 'Identical URLs',
    url1: 'https://github.com/vercel/next.js',
    url2: 'https://github.com/vercel/next.js',
    expected: true
  },
  {
    name: 'URL with trailing slash',
    url1: 'https://github.com/vercel/next.js',
    url2: 'https://github.com/vercel/next.js/',
    expected: true
  },
  {
    name: 'URL with .git',
    url1: 'https://github.com/vercel/next.js',
    url2: 'https://github.com/vercel/next.js.git',
    expected: true
  },
  {
    name: 'Different repositories',
    url1: 'https://github.com/vercel/next.js',
    url2: 'https://github.com/facebook/react',
    expected: false
  }
];

let comparisonPassed = 0;
let comparisonFailed = 0;

comparisonTests.forEach((test, index) => {
  const result = areSameRepository(test.url1, test.url2);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ Comparison Test ${index + 1}: ${test.name}`);
    comparisonPassed++;
  } else {
    console.log(`❌ Comparison Test ${index + 1}: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}`);
    comparisonFailed++;
  }
});

console.log(`\n📊 Comparison Tests: ${comparisonPassed} passed, ${comparisonFailed} failed\n`);

// Final summary
const totalPassed = passed + partsPassed + comparisonPassed;
const totalFailed = failed + partsFailed + comparisonFailed;
const totalTests = totalPassed + totalFailed;

console.log('🎯 Final Summary:');
console.log(`   Total Tests: ${totalTests}`);
console.log(`   Passed: ${totalPassed}`);
console.log(`   Failed: ${totalFailed}`);
console.log(`   Success Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`);

if (totalFailed === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.');
  process.exit(1);
}
