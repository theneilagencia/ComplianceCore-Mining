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

  // Serve static files with proper cache headers
  app.use(express.static(distPath, {
    maxAge: '1y', // Default cache for 1 year (will be overridden below)
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // No cache for HTML files to ensure new deploys are picked up immediately
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // Long cache for hashed assets (JS, CSS with hash in filename)
      else if (/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/.test(filePath)) {
        // Check if file has hash in name (e.g., index.abc123.js)
        if (/\.[a-f0-9]{8,}\.(js|css)/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Non-hashed assets, shorter cache
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
        }
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
