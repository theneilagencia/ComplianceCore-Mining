import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client/src"),
      "@server": path.resolve(import.meta.dirname, "./server"),
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.ts", 
      "tests/unit/**/*.test.tsx",
      "tests/unit/**/*.spec.ts", 
      "server/**/*.test.ts", 
      "server/**/*.spec.ts",
      "client/**/*.test.tsx",
      "client/**/*.test.ts"
    ],
    exclude: ["tests/e2e/**", "tests/fixtures/**", "**/node_modules/**", "**/dist/**"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        "server/**/*.ts",
        "shared/**/*.ts",
        "src/**/*.ts",
        "src/**/*.tsx",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.config.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/coverage/**",
        "**/tests/**",
      ],
      thresholds: {
        lines: 15,
        functions: 20,
        branches: 15,
        statements: 15,
        // Meta progressiva:
        // Sprint 2: 15-20% (baseline)
        // Sprint 3: 40-50% (testes de integração)
        // Sprint 4: 70-80% (cobertura completa)
      },
    },
  },
});
