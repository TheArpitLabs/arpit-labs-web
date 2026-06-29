#!/usr/bin/env node

/**
 * Script to add missing logger imports
 */

const fs = require('fs');
const path = require('path');

const filesNeedingLogger = [
  'src/lib/github-rate-limit.service.ts',
  'src/lib/github-url-normalizer.ts', 
  'src/lib/ingestion/compliance.ts',
  'src/lib/project-discovery/repository-data-validator.ts',
  'src/lib/retry-with-backoff.ts',
  'src/lib/security.ts'
];

function addLoggerImport(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if logger is already imported
    if (content.includes("import { logger }") || content.includes("import logger")) {
      console.log(`✅ Already has logger import: ${filePath}`);
      return false;
    }

    // Check if logger is used in the file
    if (!content.includes('logger.')) {
      console.log(`ℹ️  Logger not used in: ${filePath}`);
      return false;
    }

    // Find the position to add the import (after existing imports or at the top)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement or multiline comment block
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || 
          lines[i].trim().startsWith('require(') ||
          (lines[i].trim().startsWith('/*') && !lines[i].trim().startsWith('*/')) ||
          (lines[i].trim().startsWith('*') && !lines[i].trim().startsWith('*/')) ||
          lines[i].trim().startsWith('//')) {
        insertIndex = i + 1;
      } else if (insertIndex > 0 && !lines[i].trim() && !lines[i-1].trim().startsWith('//')) {
        // Stop at first empty line after imports
        break;
      }
    }

    // Add the import
    lines.splice(insertIndex, 0, "import { logger } from '@/lib/logger';");
    
    fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    console.log(`✅ Added logger import to: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
let modifiedCount = 0;
filesNeedingLogger.forEach(file => {
  if (addLoggerImport(file)) {
    modifiedCount++;
  }
});

console.log(`\n📊 Summary: Modified ${modifiedCount} out of ${filesNeedingLogger.length} files`);