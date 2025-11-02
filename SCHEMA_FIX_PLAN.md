# Schema Mismatch Fix Plan - Technical Reports Module

## Executive Summary
**Priority**: P0 - BLOCKER  
**Impact**: 29 TypeScript compilation errors preventing deployment  
**Affected Files**: audit.ts (23 errors), uploadsV2.ts (1 error), frontend (5 errors)  
**Root Cause**: Code expects database columns that don't exist in schema

## Problem Analysis

### Issue 1: Missing Properties on `reports` Table
**Code Location**: `server/modules/technical-reports/routers/audit.ts`

The audit router attempts to access 11 properties directly on the `reports` table that don't exist:

1. `location` (lines 500, 570, 639, 701) - 4 occurrences
2. `commodity` (lines 501, 571, 640, 700) - 4 occurrences  
3. `sectionsJson` (line 502) - 1 occurrence
4. `miningTitleNumber` (line 699) - 1 occurrence
5. `geologicalFormation` (line 702) - 1 occurrence
6. `geologicalAge` (line 703) - 1 occurrence
7. `coordinates` (line 704) - 1 occurrence
8. `environmentalLicense` (line 705) - 1 occurrence
9. `licenseType` (line 706) - 1 occurrence
10. `hasEIA` (line 707) - 1 occurrence

**Current Schema** (`drizzle/schema.ts` line 43):
```typescript
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
  parsingSummary: jsonb("parsingSummary"), // ← This is where data SHOULD be
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
```

### Issue 2: Non-Existent `auditResults` Table
**Code Location**: audit.ts lines 735, 805, 904

Code references a table called `auditResults` that doesn't exist in schema:
```typescript
const { reports, auditResults } = await import("../../../../drizzle/schema");
```

**Schema Status**: Table not defined in `drizzle/schema.ts`

### Issue 3: Column Name Mismatch on `audits` Table
**Code Location**: audit.ts lines 560, 634

Code accesses `audit.krcis` but schema has `audit.krcisJson`:
```typescript
// Code expects:
const krcis = audit.krcis;

// Schema has:
krcisJson: jsonb("krcisJson").notNull(),
```

### Issue 4: Invalid Status Value in uploadsV2.ts
**Code Location**: `server/modules/technical-reports/routers/uploadsV2.ts` line 115

Code uses `"failed"` for `reports.status` but schema enum doesn't include it:
```typescript
await db.update(reports).set({ status: "failed" })...
```

**Schema Enum**: 'draft', 'parsing', 'needs_review', 'ready_for_audit', 'audited', 'certified', 'exported'

## Solution: Option A - Refactor Code (RECOMMENDED)

**Why Option A?**
- ✅ No database migration required
- ✅ No risk of data loss
- ✅ Faster implementation (1-2 hours)
- ✅ More flexible (JSON can store arbitrary data)
- ✅ No production downtime
- ❌ Less type-safe at query time
- ❌ Cannot index/query these fields efficiently

### Fix 1: Access Data from parsingSummary

Instead of `report.location`, use `report.parsingSummary?.location`

**Implementation Steps**:
1. Define TypeScript interface for parsingSummary structure
2. Update all property accesses in audit.ts to read from parsingSummary
3. Ensure parsing service populates these fields
4. Add type guards for safe access

### Fix 2: Remove auditResults References

The `auditResults` table appears to be a planned feature that was never implemented. Code should use the `audits` table instead.

**Implementation Steps**:
1. Search for all `auditResults` imports
2. Replace with `audits` table
3. Update queries to use `audits` table
4. Verify no data loss

### Fix 3: Use krcisJson Consistently

**Implementation Steps**:
1. Replace `audit.krcis` with `audit.krcisJson`
2. OR add TypeScript alias: `const krcis = audit.krcisJson`

### Fix 4: Fix Invalid Status Value

**Implementation Steps**:
1. Use `uploads` table status (which has "failed") instead of `reports` table
2. OR set reports.status to "needs_review" on error and store error in parsingSummary

## Solution: Option B - Add Database Columns (NOT RECOMMENDED)

**Why Not Option B?**
- ❌ Requires production database migration
- ❌ Risk of migration failure
- ❌ Potential data inconsistency during transition
- ❌ Slower implementation (4-6 hours including testing)
- ✅ Better type safety
- ✅ Can create indexes for efficient queries

### Migration Required
```sql
ALTER TABLE reports
  ADD COLUMN location TEXT,
  ADD COLUMN commodity TEXT,
  ADD COLUMN sectionsJson JSONB,
  ADD COLUMN miningTitleNumber TEXT,
  ADD COLUMN geologicalFormation TEXT,
  ADD COLUMN geologicalAge TEXT,
  ADD COLUMN coordinates TEXT,
  ADD COLUMN environmentalLicense TEXT,
  ADD COLUMN licenseType TEXT,
  ADD COLUMN hasEIA BOOLEAN;

CREATE TABLE auditResults (
  -- Definition needed based on usage
);
```

## Implementation Plan (Option A - RECOMMENDED)

### Phase 1: Define parsingSummary Structure (15 mins)
Create TypeScript interface at `server/modules/technical-reports/types/parsing.ts`:

```typescript
export interface ParsedReportSummary {
  // Detection
  detectedStandard: string;
  confidence: number;
  warnings: string[];
  totalFields: number;
  uncertainFields: number;
  
  // Metadata extracted from document
  location?: string;
  commodity?: string;
  miningTitleNumber?: string;
  geologicalFormation?: string;
  geologicalAge?: string;
  coordinates?: string;
  environmentalLicense?: string;
  licenseType?: string;
  hasEIA?: boolean;
  
  // Sections
  sections?: Array<{
    id: string;
    title: string;
    contentText?: string;
    _uncertain?: boolean;
    hint?: string;
  }>;
}
```

### Phase 2: Update parsing.ts Service (30 mins)
Modify `parseAndNormalize()` to populate these fields:

```typescript
export async function parseAndNormalize(...): Promise<ParsingResult> {
  // ... existing parsing logic ...
  
  return {
    normalized,
    summary: {
      // Existing fields
      totalFields,
      uncertainFields,
      detectedStandard,
      confidence,
      warnings,
      
      // NEW: Add extracted metadata
      location: extractLocation(text),
      commodity: extractCommodity(text),
      miningTitleNumber: extractMiningTitle(text),
      // ... etc
    },
    status,
  };
}
```

### Phase 3: Fix audit.ts (45 mins)

**Before:**
```typescript
const reportData = {
  title: report.title,
  location: report.location,
  commodity: report.commodity,
  sections: report.sectionsJson as any,
};
```

**After:**
```typescript
const parsingSummary = report.parsingSummary as ParsedReportSummary | null;
const reportData = {
  title: report.title,
  location: parsingSummary?.location,
  commodity: parsingSummary?.commodity,
  sections: parsingSummary?.sections,
};
```

**Changes Needed:**
- Lines 500-502: Read from parsingSummary
- Lines 560, 634: Change `audit.krcis` to `audit.krcisJson`
- Lines 570-571: Read from parsingSummary
- Lines 639-640: Read from parsingSummary
- Lines 699-707: Read from parsingSummary
- Lines 735, 805, 904: Remove `auditResults` import, use `audits` instead

### Phase 4: Fix uploadsV2.ts (10 mins)

**Before (line 115):**
```typescript
await db.update(reports).set({ status: "failed" }).where(eq(reports.id, reportId));
```

**After:**
```typescript
await db.update(reports).set({ 
  status: "needs_review",
  parsingSummary: { error: String(error), failedAt: new Date().toISOString() } as any
}).where(eq(reports.id, reportId));
```

### Phase 5: Fix Frontend TypeScript Errors (20 mins)

**AuditKRCI.tsx (lines 58, 63):**
```typescript
// Before
const mutation = trpc.technicalReports.audit.run.useMutation({
  onSuccess: (data) => { ... },
  onError: (error) => { ... }
});

// After
const mutation = trpc.technicalReports.audit.run.useMutation({
  onSuccess: (data: AuditResult) => { ... },
  onError: (error: TRPCError) => { ... }
});
```

**ExportStandards.tsx (lines 102, 122):**
```typescript
// Before
const reports = trpc.technicalReports.generate.list.query();

// After
const { data: reports } = trpc.technicalReports.generate.list.useQuery();
```

### Phase 6: Verification (30 mins)
1. Run TypeScript compilation: `pnpm tsc --noEmit`
2. Run test suite: `pnpm test -- server/modules/technical-reports`
3. Manual smoke test: Upload report → Run audit → Verify data displayed

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Define parsingSummary interface | 15 mins | None |
| 2. Update parsing.ts | 30 mins | Phase 1 |
| 3. Fix audit.ts | 45 mins | Phase 1 |
| 4. Fix uploadsV2.ts | 10 mins | Phase 1 |
| 5. Fix frontend errors | 20 mins | None |
| 6. Verification | 30 mins | All phases |
| **TOTAL** | **2.5 hours** | |

## Rollback Plan

If Option A causes issues:
1. Revert commits
2. Fall back to Option B (add database columns)
3. Create migration script
4. Test in staging environment
5. Deploy to production

## Success Criteria

- ✅ Zero TypeScript compilation errors
- ✅ All 445 tests passing (currently 439 passing)
- ✅ Audit functionality works end-to-end
- ✅ No breaking changes to API
- ✅ No database migration required

## Post-Implementation

### Documentation
- Update API documentation with parsingSummary structure
- Add code comments explaining data access pattern
- Document migration path if Option B needed in future

### Monitoring
- Monitor parsingSummary population rate
- Track audit failures due to missing data
- Alert on null/undefined access patterns

### Future Improvements
- Consider Option B if query performance becomes issue
- Add indexes if parsingSummary queries slow
- Implement data validation on parsingSummary writes
