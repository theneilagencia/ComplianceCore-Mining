-- Create ENUMs (with proper error handling)
DO $$ BEGIN
  CREATE TYPE "role" AS ENUM ('user', 'admin', 'parceiro', 'backoffice');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "plan" AS ENUM ('START', 'PRO', 'ENTERPRISE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "license_status" AS ENUM ('active', 'expired', 'cancelled', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "billing_period" AS ENUM ('monthly', 'annual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "standard" AS ENUM ('JORC_2012', 'NI_43_101', 'PERC', 'SAMREC', 'CRIRSCO', 'CBRR', 'SEC_SK_1300');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "status" AS ENUM ('draft', 'parsing', 'parsing_failed', 'needs_review', 'ready_for_audit', 'audited', 'certified', 'exported');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "source_type" AS ENUM ('internal', 'external');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "upload_status" AS ENUM ('uploading', 'uploaded', 'parsing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "audit_type" AS ENUM ('full', 'partial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "regulator" AS ENUM ('ASX', 'TSX', 'JSE', 'CRIRSCO', 'ANM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "cert_status" AS ENUM ('pending', 'in_review', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "export_format" AS ENUM ('PDF', 'DOCX', 'XLSX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "export_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "name" text,
  "email" varchar(320) UNIQUE NOT NULL,
  "passwordHash" text,
  "googleId" varchar(128),
  "loginMethod" varchar(64),
  "role" "role" DEFAULT 'user' NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "refreshToken" text,
  "stripeCustomerId" varchar(128),
  "createdAt" timestamp DEFAULT now(),
  "lastSignedIn" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "logoUrl" text,
  "primaryColor" varchar(7),
  "secondaryColor" varchar(7),
  "s3Prefix" varchar(128) NOT NULL,
  "createdAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "licenses" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "userId" varchar(64) NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "plan" "plan" DEFAULT 'START' NOT NULL,
  "status" "license_status" DEFAULT 'active' NOT NULL,
  "billingPeriod" "billing_period",
  "stripeCustomerId" varchar(128),
  "stripeSubscriptionId" varchar(128),
  "stripePriceId" varchar(128),
  "reportsLimit" integer DEFAULT 1 NOT NULL,
  "reportsUsed" integer DEFAULT 0 NOT NULL,
  "projectsLimit" integer DEFAULT 1 NOT NULL,
  "validFrom" timestamp DEFAULT now() NOT NULL,
  "validUntil" timestamp,
  "lastResetAt" timestamp DEFAULT now(),
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reports" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "userId" varchar(64) NOT NULL,
  "title" text NOT NULL,
  "standard" "standard" NOT NULL,
  "status" "status" DEFAULT 'draft' NOT NULL,
  "sourceType" "source_type" DEFAULT 'internal',
  "detectedStandard" "standard",
  "s3NormalizedUrl" text,
  "s3OriginalUrl" text,
  "parsingSummary" jsonb,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "uploads" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "reportId" varchar(64) NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "userId" varchar(64) NOT NULL,
  "fileName" text NOT NULL,
  "fileSize" integer NOT NULL,
  "mimeType" varchar(128) NOT NULL,
  "s3Url" text,
  "status" "upload_status" DEFAULT 'uploading' NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "completedAt" timestamp
);

CREATE TABLE IF NOT EXISTS "reviewLogs" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "reportId" varchar(64) NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "userId" varchar(64) NOT NULL,
  "fieldPath" text NOT NULL,
  "oldValue" text,
  "newValue" text,
  "createdAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audits" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "reportId" varchar(64) NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "userId" varchar(64) NOT NULL,
  "auditType" "audit_type" NOT NULL,
  "score" real NOT NULL,
  "totalRules" integer NOT NULL,
  "passedRules" integer NOT NULL,
  "failedRules" integer NOT NULL,
  "krcisJson" jsonb NOT NULL,
  "recommendationsJson" jsonb NOT NULL,
  "pdfUrl" text,
  "createdAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "certifications" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "reportId" varchar(64) NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "userId" varchar(64) NOT NULL,
  "regulator" "regulator" NOT NULL,
  "status" "cert_status" DEFAULT 'pending' NOT NULL,
  "checklistJson" jsonb NOT NULL,
  "pendingCount" integer NOT NULL,
  "pdfUrl" text,
  "notes" text,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "exports" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "reportId" varchar(64) NOT NULL,
  "tenantId" varchar(64) NOT NULL,
  "userId" varchar(64) NOT NULL,
  "targetStandard" "standard" NOT NULL,
  "format" "export_format" NOT NULL,
  "status" "export_status" DEFAULT 'pending' NOT NULL,
  "fileUrl" text,
  "createdAt" timestamp DEFAULT now(),
  "completedAt" timestamp
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
