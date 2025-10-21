import { pgTable, pgEnum, varchar, text, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";

// Define enums
export const roleEnum = pgEnum('role', ['user', 'admin', 'parceiro', 'backoffice']);
export const planEnum = pgEnum('plan', ['START', 'PRO', 'ENTERPRISE']);
export const licenseStatusEnum = pgEnum('license_status', ['active', 'expired', 'cancelled', 'suspended']);
export const billingPeriodEnum = pgEnum('billing_period', ['monthly', 'annual']);
export const standardEnum = pgEnum('standard', ['JORC_2012', 'NI_43_101', 'PERC', 'SAMREC', 'CRIRSCO']);
export const statusEnum = pgEnum('status', ['draft', 'parsing', 'needs_review', 'ready_for_audit', 'audited', 'certified', 'exported']);
export const sourceTypeEnum = pgEnum('source_type', ['internal', 'external']);
export const uploadStatusEnum = pgEnum('upload_status', ['uploading', 'uploaded', 'parsing', 'completed', 'failed']);
export const auditTypeEnum = pgEnum('audit_type', ['full', 'partial']);
export const regulatorEnum = pgEnum('regulator', ['ASX', 'TSX', 'JSE', 'CRIRSCO']);
export const certStatusEnum = pgEnum('cert_status', ['pending', 'in_review', 'approved', 'rejected']);
export const exportFormatEnum = pgEnum('export_format', ['PDF', 'DOCX', 'XLSX']);
export const exportStatusEnum = pgEnum('export_status', ['pending', 'processing', 'completed', 'failed']);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique().notNull(),
  passwordHash: text("passwordHash"), // For local auth
  googleId: varchar("googleId", { length: 128 }), // For Google OAuth
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default('user').notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  refreshToken: text("refreshToken"), // JWT refresh token
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logoUrl"),
  s3Prefix: varchar("s3Prefix", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  title: text("title").notNull(),
  standard: standardEnum("standard").notNull(),
  status: statusEnum("status").default('draft').notNull(),
  sourceType: sourceTypeEnum("sourceType").default('internal'),
  detectedStandard: standardEnum("detectedStandard"),
  s3NormalizedUrl: text("s3NormalizedUrl"),
  s3OriginalUrl: text("s3OriginalUrl"),
  parsingSummary: jsonb("parsingSummary"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  fileName: text("fileName").notNull(),
  fileSize: integer("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  s3Url: text("s3Url"),
  status: uploadStatusEnum("status").default('uploading').notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  completedAt: timestamp("completedAt"),
});

export const reviewLogs = pgTable("reviewLogs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  fieldPath: text("fieldPath").notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const audits = pgTable("audits", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  auditType: auditTypeEnum("auditType").notNull(),
  score: real("score").notNull(),
  totalRules: integer("totalRules").notNull(),
  passedRules: integer("passedRules").notNull(),
  failedRules: integer("failedRules").notNull(),
  krcisJson: jsonb("krcisJson").notNull(),
  recommendationsJson: jsonb("recommendationsJson").notNull(),
  pdfUrl: text("pdfUrl"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const certifications = pgTable("certifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  regulator: regulatorEnum("regulator").notNull(),
  status: certStatusEnum("status").default('pending').notNull(),
  checklistJson: jsonb("checklistJson").notNull(),
  pendingCount: integer("pendingCount").notNull(),
  pdfUrl: text("pdfUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const exports = pgTable("exports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  targetStandard: standardEnum("targetStandard").notNull(),
  format: exportFormatEnum("format").notNull(),
  status: exportStatusEnum("status").default('pending').notNull(),
  fileUrl: text("fileUrl"),
  createdAt: timestamp("createdAt").defaultNow(),
  completedAt: timestamp("completedAt"),
});

/**
 * Licenses table for subscription management
 */
export const licenses = pgTable("licenses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().references(() => users.id),
  tenantId: varchar("tenantId", { length: 64 }).notNull(),
  plan: planEnum("plan").default('START').notNull(),
  status: licenseStatusEnum("status").default('active').notNull(),
  billingPeriod: billingPeriodEnum("billingPeriod"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  reportsLimit: integer("reportsLimit").default(1).notNull(), // START: 1, PRO: 5, ENTERPRISE: 15
  reportsUsed: integer("reportsUsed").default(0).notNull(),
  projectsLimit: integer("projectsLimit").default(1).notNull(), // START: 1, PRO: 3, ENTERPRISE: unlimited (-1)
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validUntil: timestamp("validUntil"), // null = unlimited (for START)
  lastResetAt: timestamp("lastResetAt").defaultNow(), // For monthly report reset
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type User = SelectUser;
export type InsertLicense = typeof licenses.$inferInsert;
export type SelectLicense = typeof licenses.$inferSelect;
export type License = SelectLicense;

