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
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
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
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
