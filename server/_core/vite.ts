import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  // IMPORTANT: Use middleware without path (not "*") to only catch unhandled routes
  app.use(async (req, res, next) => {
    const url = req.originalUrl;
    
    // Don't serve index.html for API routes - let them 404 naturally
    if (url.startsWith('/api')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // FIX: In Docker container, working directory is /app
  // Use absolute path /app/dist/public for production
  // IMPORTANT: Use string literal, NOT path.join() to avoid esbuild optimization
  const distPath = "/app/dist/public";
  
  console.log(`[serveStatic] Attempting to serve static files from: ${distPath}`);
  console.log(`[serveStatic] Current working directory: ${process.cwd()}`);
  console.log(`[serveStatic] Directory exists: ${fs.existsSync(distPath)}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `❌ ERROR: Could not find the build directory: ${distPath}`
    );
    console.error(`Please make sure to build the client first with: pnpm vite build`);
    
    // List what's actually in dist/
    const distRoot = path.join(process.cwd(), "dist");
    if (fs.existsSync(distRoot)) {
      console.log(`Contents of ${distRoot}:`);
      const contents = fs.readdirSync(distRoot);
      contents.forEach(item => {
        const itemPath = path.join(distRoot, item);
        const stats = fs.statSync(itemPath);
        console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${item}`);
      });
    } else {
      console.error(`❌ ERROR: dist/ directory does not exist at all!`);
    }
  } else {
    console.log(`✅ Static files directory found at: ${distPath}`);
    // List contents for debugging
    const contents = fs.readdirSync(distPath);
    console.log(`Static files available (${contents.length} items):`);
    contents.slice(0, 10).forEach(item => {
      console.log(`  - ${item}`);
    });
    if (contents.length > 10) {
      console.log(`  ... and ${contents.length - 10} more files`);
    }
  }

  // ⚠️ FIX CRÍTICO: Serve static files com headers anti-cache para JS/CSS
  app.use(express.static(distPath, {
    maxAge: 0, // ← MUDOU: Sem cache padrão (será definido por arquivo)
    etag: false, // ← MUDOU: Desabilita ETag (previne 304)
    lastModified: false, // ← MUDOU: Desabilita Last-Modified (previne 304)
    setHeaders: (res, filePath) => {
      // HTML: No cache (para garantir nova versão após deploy)
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // ⚠️ FIX CRÍTICO: JS/CSS NUNCA usa cache (mesmo com hash)
      // Problema anterior: Cache de 1 ano causava versões antigas persistentes
      else if (/\.(js|css|mjs|ts|tsx)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        // Security headers (bonus)
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      // Imagens e fontes: Cache curto (1 hora - pode ser atualizado)
      else if (/\.(woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hora
      }
      // Service Worker: NUNCA cacheia (sempre versão nova)
      else if (filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist (but not for API routes)
  // IMPORTANT: Use middleware without path (not "*") to only catch unhandled routes
  app.use((req, res, next) => {
    // Don't serve index.html for API routes - let them 404 naturally
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    
    // IMPORTANT: Use string literal to avoid esbuild optimization issues
    const indexPath = "/app/dist/public/index.html";
    console.log(`[serveStatic] Serving index.html for: ${req.originalUrl}`);
    console.log(`[serveStatic] Index path: ${indexPath}`);
    
    if (!fs.existsSync(indexPath)) {
      console.error(`❌ ERROR: index.html not found at: ${indexPath}`);
      return res.status(500).send('Application not built correctly. Missing index.html');
    }
    
    // Use absolute path with sendFile
    res.sendFile(indexPath, { root: "/" });
  });
}
