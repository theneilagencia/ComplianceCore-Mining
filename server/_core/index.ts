import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import paymentRouter from "../modules/payment/router";
import licenseRouter from "../modules/licenses/router";
import authRouter from "../modules/auth/router";
import googleHealthRouter from "../modules/auth/google-health-router";
import adminRouter from "../modules/admin/router";
import reportsRouter from "../modules/reports/router";
import auditsRouter from "../modules/audits/router";
import settingsRouter from "../modules/settings/router";
import uxRouter from "../modules/ux/router";
import systemRouter from "../modules/system/router";
import { passport } from "../modules/auth/google-oauth";
import devRouter from "../modules/dev/router";
import initDbRouter from "../modules/dev/init-db-router";
import makeAdminRouter from "../modules/dev/make-admin-router";
import createTablesRouter from "../modules/dev/create-tables-router";
import populateDbRouter from "../modules/dev/populate-db-router";
import stripeWebhookSetupRouter from "../modules/dev/setup-stripe-webhook";
import { runDevSeeds } from "../modules/dev/seed";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configure CORS with credentials
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://qivo-mining.onrender.com'
      : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Cookie parser for reading cookies
  app.use(cookieParser());
  
  // Initialize Passport
  app.use(passport.initialize());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Authentication routes
  app.use("/api/auth", authRouter);
  app.use("/api/auth", googleHealthRouter);
  
  // Development routes (only in dev mode)
  app.use("/api/dev", devRouter);
  
  // Database initialization route (temporary, for setup)
  app.use("/api", initDbRouter);
  
  // Make admin route (temporary, for setup)
  app.use("/api/dev", makeAdminRouter);
  
  // Create tables route (temporary, for setup)
  app.use("/api/dev", createTablesRouter);
  
  // Populate database route (temporary, for setup)
  app.use("/api/dev", populateDbRouter);
  
  // Stripe webhook setup route (temporary, for setup)
  app.use("/api", stripeWebhookSetupRouter);
  
  // Payment and License routes
  app.use("/api/payment", paymentRouter);
  app.use("/api/license", licenseRouter);
  
  // Admin routes
  app.use("/api/admin", adminRouter);
  
  // Reports, Audits, and Settings routes
  app.use("/api/reports", reportsRouter);
  app.use("/api/audits", auditsRouter);
  app.use("/api/settings", settingsRouter);
  
  // UX monitoring route
  app.use("/api/ux", uxRouter);
  
  // System status route
  app.use("/api/system", systemRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Auto-seed disabled - use POST /api/dev/init to create test users
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Dev] Development mode enabled. Use POST /api/dev/init to create test users.');
    }
  });
}

startServer().catch(console.error);
