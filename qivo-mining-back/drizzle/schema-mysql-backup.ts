import { mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, float, int } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "parceiro", "backoffice"]).default("user").notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logoUrl"),
  s3Prefix: varchar("s3Prefix", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  
  // Source and detection
  sourceType: mysqlEnum("sourceType", ["internal", "external"]).default("internal").notNull(),
  detectedStandard: varchar("detectedStandard", { length: 32 }),
  
  // Original fields
  standard: varchar("standard", { length: 32 }).notNull(),
  title: text("title").notNull(),
  
  // Enhanced status for ETAPA 2
  status: mysqlEnum("status", [
    "draft",
    "processing",
    "parsing",
    "needs_review",
    "ready_for_audit",
    "audited",
    "certified",
    "exported",
    "completed",
    "failed"
  ]).default("draft").notNull(),
  
  // S3 storage
  s3Key: text("s3Key"),
  s3Url: text("s3Url"),
  s3NormalizedUrl: text("s3NormalizedUrl"),
  s3OriginalUrl: text("s3OriginalUrl"),
  
  // Parsing metadata
  parsingSummary: json("parsingSummary"),
  metadata: json("metadata"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Upload tracking table
export const uploads = mysqlTable("uploads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  reportId: varchar("reportId", { length: 64 }),
  
  fileName: text("fileName").notNull(),
  fileSize: varchar("fileSize", { length: 32 }),
  fileType: varchar("fileType", { length: 64 }),
  
  s3Key: text("s3Key").notNull(),
  s3Url: text("s3Url"),
  
  status: mysqlEnum("status", ["uploading", "uploaded", "parsing", "completed", "failed"]).default("uploading").notNull(),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Review logs for audit trail
export const reviewLogs = mysqlTable("reviewLogs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  
  fieldPath: text("fieldPath").notNull(),
  previousValue: text("previousValue"),
  newValue: text("newValue").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

export type ReviewLog = typeof reviewLogs.$inferSelect;
export type InsertReviewLog = typeof reviewLogs.$inferInsert;

export const audits = mysqlTable("audits", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  
  auditType: mysqlEnum("auditType", ["full", "partial"]).default("full").notNull(),
  score: float("score").notNull(),
  totalRules: int("totalRules").notNull(),
  passedRules: int("passedRules").notNull(),
  failedRules: int("failedRules").notNull(),
  
  krcisJson: json("krcisJson"),
  recommendationsJson: json("recommendationsJson"),
  
  pdfUrl: text("pdfUrl"),
  
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Audit = typeof audits.$inferSelect;
export type InsertAudit = typeof audits.$inferInsert;

export const exports = mysqlTable("exports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  
  fromStandard: varchar("fromStandard", { length: 32 }).notNull(),
  toStandard: varchar("toStandard", { length: 32 }).notNull(),
  format: mysqlEnum("format", ["PDF", "DOCX", "XLSX"]).notNull(),
  
  s3Url: text("s3Url").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Export = typeof exports.$inferSelect;
export type InsertExport = typeof exports.$inferInsert;

export const certifications = mysqlTable("certifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  
  regulator: mysqlEnum("regulator", ["ASX", "TSX", "JSE", "CRIRSCO"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "approved", "rejected"]).default("pending").notNull(),
  
  checklistJson: json("checklistJson"),
  pendingItemsJson: json("pendingItemsJson"),
  
  complianceScore: float("complianceScore"),
  pdfUrl: text("pdfUrl"),
  
  notes: text("notes"),
  
  submittedAt: timestamp("submittedAt").defaultNow(),
  reviewedAt: timestamp("reviewedAt"),
});

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;

