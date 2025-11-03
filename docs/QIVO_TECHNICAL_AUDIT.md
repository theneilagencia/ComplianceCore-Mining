# 🤖 QIVO Engineer AI v2 - Technical Audit Report

**Generated:** 11/3/2025, 7:18:17 PM  
**Status:** 🔴 Critical

---

## 📦 Build Analysis

- **Duration:** 7331ms
- **Status:** ❌ Failed
- **Errors:**
  - Command failed: pnpm run build
<script src="/umami.js"> in "/index.html" can't be bundled without type="module" attribute
✘ [ERROR] Could not resolve "../../db"

    server/modules/technical-reports/services/business-rules.ts:54:26:
      54 │   const db = await import("../../db").then((m) => m.getDb());
         ╵                           ~~~~~~~~~~

✘ [ERROR] Could not resolve "../../../drizzle/schema"

    server/modules/technical-reports/services/business-rules.ts:57:36:
      57 │   const { licenses } = await import("../../../drizzle/schema");
         ╵                                     ~~~~~~~~~~~~~~~~~~~~~~~~~

2 errors
node:child_process:931
    throw err;
    ^

Error: Command failed: /Users/viniciusguimaraes/Documents/GITHUB/ComplianceCore-Mining/node_modules/.pnpm/@esbuild+darwin-arm64@0.25.11/node_modules/@esbuild/darwin-arm64/bin/esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --sourcemap --minify-whitespace --minify-syntax --target=node24 --legal-comments=none
    at genericNodeError (node:internal/errors:983:15)
    at wrappedFn (node:internal/errors:537:14)
    at checkExecSyncError (node:child_process:892:11)
    at Object.execFileSync (node:child_process:928:15)
    at Object.<anonymous> (/Users/viniciusguimaraes/Documents/GITHUB/ComplianceCore-Mining/node_modules/.pnpm/esbuild@0.25.11/node_modules/esbuild/bin/esbuild:222:28)
    at Module._compile (node:internal/modules/cjs/loader:1692:14)
    at Object..js (node:internal/modules/cjs/loader:1824:10)
    at Module.load (node:internal/modules/cjs/loader:1427:32)
    at Module._load (node:internal/modules/cjs/loader:1250:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14) {
  status: 1,
  signal: null,
  output: [ null, null, null ],
  pid: 67972,
  stdout: null,
  stderr: null
}

Node.js v24.3.0


---

## 📋 Dependencies

- **Total:** 143
- **Outdated:** 0 ✅
- **Vulnerable:** 0 ✅



---

## 📊 Bundle Sizes

### Client
- **Size:** 2.48 MB
- **Files:** 47

### Server
- **Size:** 0.00 MB
- **Files:** 0

---

## 🔍 Code Quality

- **Lint Errors:** 0 ✅
- **Lint Warnings:** 0 ✅
- **Type Errors:** 147 ❌
- **Test Coverage:** 0.0% ⚠️

---

## 🏥 Health Status: DOWN

- ❌ **API Server**
- ❌ **Database**
- ❌ **Storage**
- ❌ **AI Engines**

---

## 📊 Overall Score

0/100

## 🎯 Recommendations

1. 🔧 **Fix build errors immediately** - Build is failing
2. 📝 **Fix TypeScript errors** - 147 type errors found
3. 🧪 **Increase test coverage** - Current: 0.0%, Target: 80%
4. 🏥 **Check unhealthy services** - Some health checks are failing
