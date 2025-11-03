#!/usr/bin/env tsx
/**
 * Fix Dynamic Imports Script
 * Converts dynamic imports to static imports for ESBuild compatibility
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import { join } from 'path';

const ROOT_DIR = join(__dirname, '..');

// Files to fix
const patterns = [
  'server/**/*.ts',
  '!server/**/*.test.ts',
  '!server/**/*.spec.ts',
];

console.log('🔍 Finding files with dynamic imports...\n');

const files = globSync(patterns, { 
  cwd: ROOT_DIR,
  absolute: true,
  ignore: ['**/node_modules/**']
});

let totalFixed = 0;
let totalFiles = 0;

files.forEach((file) => {
  try {
    let content = readFileSync(file, 'utf-8');
    const originalContent = content;
    let fixed = false;

    // Check if file has dynamic imports
    if (!content.includes('await import(')) {
      return;
    }

    console.log(`📝 Processing: ${file.replace(ROOT_DIR, '')}`);

    // Pattern 1: await import("../../db").then((m) => m.getDb())
    if (content.includes('await import("../../db")') || content.includes("await import('../../db')")) {
      // Check if static import already exists
      if (!content.includes('import { getDb } from "../../db"')) {
        // Add static import after existing imports
        const importMatch = content.match(/^(import .+;\n)+/m);
        if (importMatch) {
          const lastImportIndex = importMatch[0].lastIndexOf('\n');
          const insertPosition = importMatch.index! + lastImportIndex + 1;
          content = content.slice(0, insertPosition) + 
                   'import { getDb } from "../../db";\n' +
                   content.slice(insertPosition);
        } else {
          // No imports, add at top after any comments
          const firstNonCommentLine = content.match(/^[^/\n]/m);
          if (firstNonCommentLine) {
            content = content.slice(0, firstNonCommentLine.index) +
                     'import { getDb } from "../../db";\n\n' +
                     content.slice(firstNonCommentLine.index);
          }
        }
      }
      
      // Replace dynamic calls
      content = content.replace(
        /const db = await import\(["']\.\.\/\.\.\/db["']\)\.then\(\(?m\)? => m\.getDb\(\)\);?/g,
        'const db = await getDb();'
      );
      fixed = true;
    }

    // Pattern 2: await import("../../../db").then((m) => m.getDb())
    if (content.includes('await import("../../../db")') || content.includes("await import('../../../db')")) {
      if (!content.includes('import { getDb } from "../../../db"')) {
        const importMatch = content.match(/^(import .+;\n)+/m);
        if (importMatch) {
          const lastImportIndex = importMatch[0].lastIndexOf('\n');
          const insertPosition = importMatch.index! + lastImportIndex + 1;
          content = content.slice(0, insertPosition) +
                   'import { getDb } from "../../../db";\n' +
                   content.slice(insertPosition);
        }
      }
      
      content = content.replace(
        /const db = await import\(["']\.\.\/\.\.\/\.\.\/db["']\)\.then\(\(?m\)? => m\.getDb\(\)\);?/g,
        'const db = await getDb();'
      );
      fixed = true;
    }

    // Pattern 3: Dynamic schema imports
    if (content.includes('await import("../../../drizzle/schema")')) {
      // Extract which exports are being imported
      const schemaImports = new Set<string>();
      const dynamicSchemaPattern = /const \{ ([^}]+) \} = await import\(["']\.\.\/\.\.\/\.\.\/drizzle\/schema["']\);?/g;
      let match;
      while ((match = dynamicSchemaPattern.exec(content)) !== null) {
        match[1].split(',').forEach(name => schemaImports.add(name.trim()));
      }

      if (schemaImports.size > 0) {
        const schemaImportList = Array.from(schemaImports).join(', ');
        if (!content.includes(`import { ${schemaImportList} } from "../../../drizzle/schema"`)) {
          const importMatch = content.match(/^(import .+;\n)+/m);
          if (importMatch) {
            const lastImportIndex = importMatch[0].lastIndexOf('\n');
            const insertPosition = importMatch.index! + lastImportIndex + 1;
            content = content.slice(0, insertPosition) +
                     `import { ${schemaImportList} } from "../../../drizzle/schema";\n` +
                     content.slice(insertPosition);
          }
        }

        // Remove dynamic imports
        content = content.replace(
          /const \{ [^}]+ \} = await import\(["']\.\.\/\.\.\/\.\.\/drizzle\/schema["']\);?\n?/g,
          ''
        );
        fixed = true;
      }
    }

    // Pattern 4: Dynamic drizzle-orm imports
    if (content.includes('await import("drizzle-orm")')) {
      const ormImports = new Set<string>();
      const dynamicOrmPattern = /const \{ ([^}]+) \} = await import\(["']drizzle-orm["']\);?/g;
      let match;
      while ((match = dynamicOrmPattern.exec(content)) !== null) {
        match[1].split(',').forEach(name => ormImports.add(name.trim()));
      }

      if (ormImports.size > 0) {
        const ormImportList = Array.from(ormImports).join(', ');
        // Check existing imports and merge
        const existingOrmImport = content.match(/import \{ ([^}]+) \} from ["']drizzle-orm["'];/);
        if (existingOrmImport) {
          const existing = new Set(existingOrmImport[1].split(',').map(s => s.trim()));
          ormImports.forEach(imp => existing.add(imp));
          const mergedList = Array.from(existing).join(', ');
          content = content.replace(
            /import \{ [^}]+ \} from ["']drizzle-orm["'];/,
            `import { ${mergedList} } from "drizzle-orm";`
          );
        } else {
          const importMatch = content.match(/^(import .+;\n)+/m);
          if (importMatch) {
            const lastImportIndex = importMatch[0].lastIndexOf('\n');
            const insertPosition = importMatch.index! + lastImportIndex + 1;
            content = content.slice(0, insertPosition) +
                     `import { ${ormImportList} } from "drizzle-orm";\n` +
                     content.slice(insertPosition);
          }
        }

        // Remove dynamic imports
        content = content.replace(
          /const \{ [^}]+ \} = await import\(["']drizzle-orm["']\);?\n?/g,
          ''
        );
        fixed = true;
      }
    }

    if (fixed && content !== originalContent) {
      writeFileSync(file, content, 'utf-8');
      console.log(`  ✅ Fixed dynamic imports\n`);
      totalFixed++;
    }

    totalFiles++;
  } catch (error) {
    console.error(`  ❌ Error processing file: ${error}\n`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${totalFiles}`);
console.log(`   Files fixed: ${totalFixed}`);
console.log(`\n✨ Done!`);
