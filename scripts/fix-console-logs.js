#!/usr/bin/env node

/**
 * Script to replace console.log statements with logger calls
 * This helps with the systematic cleanup of debug code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to exclude from processing
const excludePaths = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'scripts/fix-console-logs.js'
];

// Patterns to replace and their replacements
const replacements = [
  {
    pattern: /console\.log\(([^)]+)\)/g,
    replacement: 'logger.info($1)',
    importNeeded: true
  },
  {
    pattern: /console\.error\(([^)]+)\)/g,
    replacement: 'logger.error($1)',
    importNeeded: true
  },
  {
    pattern: /console\.warn\(([^)]+)\)/g,
    replacement: 'logger.warn($1)',
    importNeeded: true
  },
  {
    pattern: /console\.debug\(([^)]+)\)/g,
    replacement: 'logger.debug($1)',
    importNeeded: true
  },
  {
    pattern: /console\.info\(([^)]+)\)/g,
    replacement: 'logger.info($1)',
    importNeeded: true
  }
];

const loggerImport = `import { logger } from '@/lib/logger';`;

function shouldProcessFile(filePath) {
  return excludePaths.every(exclude => !filePath.includes(exclude));
}

function addLoggerImport(content) {
  // Check if logger is already imported
  if (content.includes("import { logger }") || content.includes("import logger")) {
    return content;
  }

  // Find the last import statement
  const importRegex = /^import .+;$/gm;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;
    
    return content.slice(0, insertPosition) + '\n' + loggerImport + content.slice(insertPosition);
  }
  
  return content;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let needsImport = false;

    // Apply replacements
    replacements.forEach(({ pattern, replacement, importNeeded }) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        content = content.replace(pattern, replacement);
        modified = true;
        if (importNeeded) {
          needsImport = true;
        }
      }
    });

    if (modified) {
      if (needsImport) {
        content = addLoggerImport(content);
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findFilesToProcess(dir) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (shouldProcessFile(fullPath)) {
          files = files.concat(findFilesToProcess(fullPath));
        }
      } else if (item.isFile()) {
        // Only process .ts, .tsx, .js, .jsx files
        if (/\.(ts|tsx|js|jsx)$/.test(item.name) && shouldProcessFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

function main() {
  console.log('🔧 Starting console.log cleanup...\n');
  
  const rootDir = process.cwd();
  const files = findFilesToProcess(rootDir);
  
  console.log(`Found ${files.length} files to check\n`);
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  for (const file of files) {
    processedCount++;
    if (processFile(file)) {
      modifiedCount++;
    }
    
    // Progress update every 50 files
    if (processedCount % 50 === 0) {
      console.log(`Progress: ${processedCount}/${files.length} files checked, ${modifiedCount} modified`);
    }
  }
  
  console.log(`\n✨ Cleanup complete!`);
  console.log(`📊 Total files checked: ${processedCount}`);
  console.log(`📝 Files modified: ${modifiedCount}`);
  console.log(`📋 Files unchanged: ${processedCount - modifiedCount}`);
}

// Run the script
main();