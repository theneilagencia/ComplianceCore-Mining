// esbuild.config.js
// Configuration for server bundling

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// Simple plugin to resolve @shared alias
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@shared/ }, (args) => {
      const pathWithoutAlias = args.path.replace(/^@shared\//, '');
      let resolvedPath = resolve(__dirname, 'src/shared', pathWithoutAlias);
      
      // If no extension, try to find .ts file
      if (!resolvedPath.match(/\.(ts|tsx|js|jsx)$/)) {
        const withTs = `${resolvedPath}.ts`;
        if (existsSync(withTs)) {
          resolvedPath = withTs;
        }
      }
      
      return { path: resolvedPath };
    });
  },
};

await build({
  entryPoints: ['src/_core/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outdir: 'dist',
  sourcemap: true,
  minifyWhitespace: isProduction,
  minifySyntax: isProduction,
  legalComments: 'none',
  
  // Resolve path aliases
  plugins: [aliasPlugin],
  
  // Externalize all node_modules but bundle local code
  packages: 'external',
  
  loader: {
    '.node': 'file',
  },
  
  logLevel: 'info',
  banner: {
    js: `
// ComplianceCore Mining™ Backend Bundle
// Built: ${new Date().toISOString()}
// Environment: ${process.env.NODE_ENV || 'production'}
// Build ID: ${Date.now()}
`,
  },
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});

console.log('✅ Server bundle created successfully');

