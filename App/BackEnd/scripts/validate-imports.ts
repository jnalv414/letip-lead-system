#!/usr/bin/env ts-node
/**
 * Import Validation Script
 *
 * Purpose: Validate that vertical slice modules maintain proper import boundaries.
 * Prevents cross-slice imports and enforces architectural integrity during refactoring.
 *
 * Rules:
 * 1. Slices can only import from:
 *    - Their own slice directory
 *    - Shared infrastructure (prisma, websocket, config)
 *    - External dependencies
 *
 * 2. Slices CANNOT import from:
 *    - Other slice directories
 *    - Legacy horizontal layer files
 *
 * 3. Shared infrastructure CANNOT import from:
 *    - Any slice directory
 *
 * Usage:
 *   ts-node scripts/validate-imports.ts
 *   npm run validate:imports
 */

import * as fs from 'fs';
import * as path from 'path';

interface ImportViolation {
  file: string;
  line: number;
  import: string;
  reason: string;
}

const violations: ImportViolation[] = [];

// Define slice directories (will be created during refactoring)
const SLICE_DIRS = ['slices/scraper', 'slices/enrichment', 'slices/outreach'];

// Define shared infrastructure
const SHARED_DIRS = ['prisma', 'websocket', 'config', 'caching'];

// Allowed import patterns
const ALLOWED_PATTERNS = [
  /^@nestjs\//,           // NestJS framework
  /^@prisma\//,           // Prisma client
  /^socket\.io/,          // Socket.io
  /^class-validator/,     // Validation
  /^class-transformer/,   // Transformation
  /^puppeteer/,           // Scraper
  /^axios/,               // HTTP client
  /^\.\.\/(prisma|websocket|config|caching)\//, // Shared infrastructure
];

/**
 * Check if an import violates architecture rules
 */
function validateImport(
  filePath: string,
  importPath: string,
  lineNumber: number,
): void {
  const fileDir = path.dirname(filePath);
  const isInSlice = SLICE_DIRS.some((slice) => fileDir.includes(slice));

  if (!isInSlice) {
    // Not in a slice directory yet, skip validation
    return;
  }

  // Check if importing from another slice
  const currentSlice = SLICE_DIRS.find((slice) => fileDir.includes(slice));
  const importingFromOtherSlice = SLICE_DIRS.some(
    (slice) => importPath.includes(slice) && slice !== currentSlice,
  );

  if (importingFromOtherSlice) {
    violations.push({
      file: filePath,
      line: lineNumber,
      import: importPath,
      reason: 'Cross-slice import detected. Slices must be independent.',
    });
    return;
  }

  // Check if importing from legacy horizontal layers
  const legacyLayers = ['services', 'controllers', 'modules'];
  const importingFromLegacy = legacyLayers.some((layer) =>
    importPath.includes(layer),
  );

  if (importingFromLegacy) {
    violations.push({
      file: filePath,
      line: lineNumber,
      import: importPath,
      reason:
        'Legacy layer import detected. Use slice-based architecture instead.',
    });
    return;
  }

  // Check if relative import goes outside slice boundary
  if (importPath.startsWith('../') && isInSlice) {
    const resolvedPath = path.resolve(fileDir, importPath);
    const stillInSlice = resolvedPath.includes(currentSlice!);
    const isSharedInfra = SHARED_DIRS.some((dir) =>
      resolvedPath.includes(dir),
    );

    if (!stillInSlice && !isSharedInfra) {
      violations.push({
        file: filePath,
        line: lineNumber,
        import: importPath,
        reason: 'Import crosses slice boundary. Keep slice self-contained.',
      });
    }
  }
}

/**
 * Parse TypeScript file and extract imports
 */
function extractImports(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Match ES6 imports: import ... from '...'
      const es6ImportMatch = line.match(/import\s+.*?\s+from\s+['"](.+?)['"]/);
      if (es6ImportMatch) {
        validateImport(filePath, es6ImportMatch[1], index + 1);
      }

      // Match CommonJS requires: require('...')
      const requireMatch = line.match(/require\s*\(\s*['"](.+?)['"]\s*\)/);
      if (requireMatch) {
        validateImport(filePath, requireMatch[1], index + 1);
      }
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
}

/**
 * Recursively scan directory for TypeScript files
 */
function scanDirectory(dirPath: string): void {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip node_modules, dist, and test directories
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'test' ||
        entry.name === '__tests__'
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        extractImports(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
}

/**
 * Print validation results
 */
function printResults(): void {
  console.log('\n=== Import Validation Results ===\n');

  if (violations.length === 0) {
    console.log('✓ No import violations found. Architecture is clean!');
    console.log('✓ All slices maintain proper boundaries.');
    process.exit(0);
  }

  console.log(`✗ Found ${violations.length} import violation(s):\n`);

  // Group by file
  const byFile: Record<string, ImportViolation[]> = {};
  violations.forEach((v) => {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  });

  Object.entries(byFile).forEach(([file, fileViolations]) => {
    console.log(`\n${file}:`);
    fileViolations.forEach((v) => {
      console.log(`  Line ${v.line}: ${v.import}`);
      console.log(`    → ${v.reason}`);
    });
  });

  console.log(
    '\n=== Refactoring Guidelines ===\n',
  );
  console.log('1. Slices should be self-contained vertical features');
  console.log('2. Share code via shared infrastructure, not cross-imports');
  console.log('3. Emit events for cross-slice communication');
  console.log('4. Use dependency injection for shared services\n');

  process.exit(1);
}

/**
 * Main execution
 */
function main(): void {
  const srcPath = path.join(__dirname, '../src');

  console.log('🔍 Validating import boundaries...');
  console.log(`📂 Scanning: ${srcPath}\n`);

  scanDirectory(srcPath);
  printResults();
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { validateImport, extractImports, scanDirectory };
