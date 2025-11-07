import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
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
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const clientTemplate = path.resolve(
        __dirname,
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
  // ⚠️ FIX CRÍTICO: Detectar produção corretamente
  // Em produção, o código compilado está em dist/ e os assets em dist/public/
  // Verificamos se estamos rodando do código compilado (dist/index.js)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const isProduction = __dirname.includes('/dist');
  
  const distPath = isProduction
    ? path.resolve(__dirname, "public") // dist/public (relativo a dist/)
    : path.resolve(__dirname, "../..", "dist", "public"); // Desenvolvimento
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
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
        // ⚠️ FIX CRÍTICO: Setar Content-Type explicitamente
        if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
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
    // Don't serve index.html for API routes or assets - let them 404 naturally
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/assets')) {
      return next();
    }
    
    // ⚠️ FIX CRÍTICO: Headers anti-cache AGRESSIVOS para index.html
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
