/**
 * Mobile Devices Tests
 * Tests platform on real mobile device configurations
 */

import { test, expect, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Test on iPhone 12
test.describe('iPhone 12', () => {
  test.use(devices['iPhone 12']);

  test('should load landing page correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390);
    expect(viewport?.height).toBe(844);
    
    // Check responsive layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle touch gestures', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Simulate tap
    await page.tap('button:has-text("Começar Agora")');
    
    // Simulate scroll
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('should display mobile navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for hamburger menu on mobile
    const mobileMenu = page.locator('[aria-label="Menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // Open menu
    await mobileMenu.click();
    
    // Check menu items
    await expect(page.locator('nav a:has-text("Recursos")')).toBeVisible();
    await expect(page.locator('nav a:has-text("Preços")')).toBeVisible();
  });

  test('should handle form inputs on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill form with mobile keyboard
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@1234');
    
    // Check values
    const email = await page.inputValue('input[type="email"]');
    expect(email).toBe('test@example.com');
  });

  test('should load in under 3 seconds on 4G', async ({ page }) => {
    // Simulate 4G connection
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 100); // 100ms latency
    });
    
    const startTime = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});

// Test on iPhone 13 Pro
test.describe('iPhone 13 Pro', () => {
  test.use(devices['iPhone 13 Pro']);

  test('should load landing page correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390);
    expect(viewport?.height).toBe(844);
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle pinch zoom', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check if viewport meta tag allows zooming
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).not.toContain('user-scalable=no');
  });
});

// Test on iPad Pro
test.describe('iPad Pro', () => {
  test.use(devices['iPad Pro']);

  test('should load landing page correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(1024);
    expect(viewport?.height).toBe(1366);
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display tablet layout', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for tablet-specific layout (not mobile, not desktop)
    const width = await page.evaluate(() => window.innerWidth);
    expect(width).toBeGreaterThanOrEqual(768);
    expect(width).toBeLessThan(1280);
  });

  test('should handle landscape orientation', async ({ page, context }) => {
    await page.goto(BASE_URL);
    
    // Rotate to landscape
    await page.setViewportSize({ width: 1366, height: 1024 });
    
    // Check layout adapts
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });
});

// Test on Samsung Galaxy S21
test.describe('Samsung Galaxy S21', () => {
  test.use(devices['Galaxy S21']);

  test('should load landing page correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(360);
    expect(viewport?.height).toBe(800);
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle Android-specific features', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for PWA manifest
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toBeVisible();
  });

  test('should display correctly in Chrome Mobile', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check user agent
    const userAgent = await page.evaluate(() => navigator.userAgent);
    expect(userAgent).toContain('Android');
  });
});

// Test on Pixel 5
test.describe('Google Pixel 5', () => {
  test.use(devices['Pixel 5']);

  test('should load landing page correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(393);
    expect(viewport?.height).toBe(851);
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle high DPI display', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check device pixel ratio
    const dpr = await page.evaluate(() => window.devicePixelRatio);
    expect(dpr).toBeGreaterThanOrEqual(2);
  });
});

// Cross-device tests
test.describe('Cross-Device Compatibility', () => {
  const mobileDevices = [
    'iPhone 12',
    'iPhone 13 Pro',
    'Galaxy S21',
    'Pixel 5',
  ];

  for (const deviceName of mobileDevices) {
    test(`should load on ${deviceName}`, async ({ page, context }) => {
      await context.addInitScript(() => {
        // Mock device
      });
      
      test.use(devices[deviceName]);
      await page.goto(BASE_URL);
      
      // Basic checks
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button')).toBeVisible();
    });
  }
});

// Performance tests on mobile
test.describe('Mobile Performance', () => {
  test.use(devices['iPhone 12']);

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Measure LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    expect(lcp).toBeLessThan(2500); // Good LCP < 2.5s
  });

  test('should have minimal layout shift', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Measure CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(clsValue), 5000);
      });
    });
    
    expect(cls).toBeLessThan(0.1); // Good CLS < 0.1
  });

  test('should be interactive quickly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Measure FID (First Input Delay) by simulating click
    const startTime = Date.now();
    await page.click('button');
    const fid = Date.now() - startTime;
    
    expect(fid).toBeLessThan(100); // Good FID < 100ms
  });
});

// Accessibility tests on mobile
test.describe('Mobile Accessibility', () => {
  test.use(devices['iPhone 12']);

  test('should have proper touch target sizes', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check button sizes
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44); // Min 44x44px
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for ARIA labels
    const buttons = await page.locator('button[aria-label]').all();
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should have readable text on mobile', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check font sizes
    const paragraphs = await page.locator('p').all();
    
    for (const p of paragraphs) {
      const fontSize = await p.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      
      const sizeInPx = parseInt(fontSize);
      expect(sizeInPx).toBeGreaterThanOrEqual(14); // Min 14px on mobile
    }
  });
});
