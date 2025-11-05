/**
 * Accessibility Tests with axe-core
 * Automated WCAG 2.1 AA compliance testing
 */

import { describe, it, expect } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

describe('Accessibility Tests - WCAG 2.1 AA', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Landing Page', () => {
    it('should have no accessibility violations', async () => {
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });

      expect(violations.length).toBe(0);
      
      if (violations.length > 0) {
        console.error('Accessibility violations found:');
        violations.forEach((violation) => {
          console.error(`- ${violation.id}: ${violation.description}`);
          console.error(`  Impact: ${violation.impact}`);
          console.error(`  Help: ${violation.helpUrl}`);
        });
      }
    }, 30000);

    it('should have proper heading hierarchy', async () => {
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['heading-order'],
        },
      });

      expect(violations.length).toBe(0);
    });

    it('should have sufficient color contrast', async () => {
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['color-contrast'],
        },
      });

      expect(violations.length).toBe(0);
    });

    it('should have alt text for images', async () => {
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['image-alt'],
        },
      });

      expect(violations.length).toBe(0);
    });

    it('should have labels for form inputs', async () => {
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['label'],
        },
      });

      expect(violations.length).toBe(0);
    });
  });

  describe('Login Page', () => {
    it('should have no accessibility violations', async () => {
      await page.goto(`${BASE_URL}/login`);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      });

      expect(violations.length).toBe(0);
    }, 30000);

    it('should have proper ARIA attributes', async () => {
      await page.goto(`${BASE_URL}/login`);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['aria-valid-attr', 'aria-required-attr'],
        },
      });

      expect(violations.length).toBe(0);
    });
  });

  describe('Dashboard', () => {
    it('should have no accessibility violations', async () => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@qivomining.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/dashboard');
      
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      });

      expect(violations.length).toBe(0);
    }, 30000);
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation', async () => {
      await page.goto(BASE_URL);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
      
      // Continue tabbing
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });

    it('should have visible focus indicators', async () => {
      await page.goto(BASE_URL);
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusVisible = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement;
        if (!element) return false;
        
        const styles = window.getComputedStyle(element);
        const outline = styles.getPropertyValue('outline');
        const boxShadow = styles.getPropertyValue('box-shadow');
        
        return outline !== 'none' || boxShadow !== 'none';
      });
      
      expect(focusVisible).toBe(true);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper landmark regions', async () => {
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['region'],
        },
      });

      expect(violations.length).toBe(0);
    });

    it('should have skip to content link', async () => {
      await page.goto(BASE_URL);
      
      const skipLink = await page.locator('a[href="#main-content"]').first();
      expect(await skipLink.count()).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should be accessible on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      });

      expect(violations.length).toBe(0);
    }, 30000);

    it('should be accessible on tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto(BASE_URL);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa'],
        },
      });

      expect(violations.length).toBe(0);
    }, 30000);
  });

  describe('Color Modes', () => {
    it('should be accessible in dark mode', async () => {
      await page.goto(BASE_URL);
      
      // Set dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['color-contrast'],
        },
      });

      expect(violations.length).toBe(0);
    });

    it('should be accessible in light mode', async () => {
      await page.goto(BASE_URL);
      
      // Set light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'rule',
          values: ['color-contrast'],
        },
      });

      expect(violations.length).toBe(0);
    });
  });
});
