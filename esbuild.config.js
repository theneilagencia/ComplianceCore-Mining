// esbuild.config.js
// Configuration for server bundling

import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

await build({
  entryPoints: ['server/_core/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  outdir: 'dist',
  sourcemap: true,
  minifyWhitespace: isProduction,
  minifySyntax: isProduction,
  legalComments: 'none',
  
  // Externalize all node_modules but bundle local code
  packages: 'external',
  
  loader: {
    '.node': 'file',
  },
  
  logLevel: 'info',
  banner: {
    js: `
// ComplianceCore Mining™ Server Bundle
// Built: ${new Date().toISOString()}
// Environment: ${process.env.NODE_ENV || 'production'}
`,
  },
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});

console.log('✅ Server bundle created successfully');
