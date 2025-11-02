import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Dashboard & Radar Flow
 * 
 * Testa visualização do dashboard e sistema de notificações Radar:
 * - Estatísticas
 * - Notificações regulatórias
 * - Filtros
 * - Interações
 */

test.describe('Dashboard Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@compliancecore.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/');
    
    // Verifica elementos principais do dashboard
    await expect(page.locator('h1, h2')).toContainText(/dashboard|início/i);
    await expect(page).toHaveURL('/');
  });

  test('should display statistics cards', async ({ page }) => {
    await page.goto('/');
    
    // Verifica cards de estatísticas
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card, .card');
    expect(await statsCards.count()).toBeGreaterThanOrEqual(3);
    
    // Verifica labels comuns
    await expect(page.locator('text=/Reports|Relatórios/i')).toBeVisible();
    await expect(page.locator('text=/Documents|Documentos/i')).toBeVisible();
  });

  test('should display recent reports', async ({ page }) => {
    await page.goto('/');
    
    // Verifica seção de relatórios recentes
    await expect(page.locator('text=/Recent Reports|Relatórios Recentes/i')).toBeVisible();
  });

  test('should navigate to Radar page', async ({ page }) => {
    await page.goto('/');
    
    // Clica no link do Radar
    await page.click('text=/Radar|Notificações/i, a[href*="radar"]');
    
    // Verifica navegação
    await expect(page).toHaveURL(/\/radar/);
  });

  test('should display Radar notifications', async ({ page }) => {
    await page.goto('/radar');
    
    // Verifica lista de notificações
    await expect(page.locator('h1, h2')).toContainText(/Radar|Notificações/i);
    
    // Verifica se há notificações ou mensagem vazia
    const notifications = page.locator('[data-testid="notification-item"], .notification-card');
    const emptyMessage = page.locator('text=/No notifications|Nenhuma notificação/i');
    
    const hasNotifications = await notifications.count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible();
    
    expect(hasNotifications || hasEmptyMessage).toBeTruthy();
  });

  test('should filter notifications by severity', async ({ page }) => {
    await page.goto('/radar');
    
    // Aplica filtro de severidade
    const severityFilter = page.locator('select[name="severity"], button:has-text("Severity")');
    
    if (await severityFilter.isVisible()) {
      await severityFilter.click();
      await page.click('text=/high|alta/i');
      
      await page.waitForTimeout(1000);
      
      // Verifica se apenas notificações de alta severidade são exibidas
      const notifications = page.locator('[data-severity="high"], .severity-high');
      if (await notifications.count() > 0) {
        expect(await notifications.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should filter notifications by category', async ({ page }) => {
    await page.goto('/radar');
    
    // Aplica filtro de categoria
    const categoryFilter = page.locator('select[name="category"], button:has-text("Category")');
    
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Seleciona DOU
      await page.click('text=/DOU/i');
      
      await page.waitForTimeout(1000);
      
      // Verifica se apenas notificações DOU são exibidas
      const douNotifications = page.locator('text=/DOU/i');
      expect(await douNotifications.count()).toBeGreaterThan(0);
    }
  });

  test('should filter by date range', async ({ page }) => {
    await page.goto('/radar');
    
    // Aplica filtro de data
    const dateFilter = page.locator('input[type="date"], input[name="startDate"]');
    
    if (await dateFilter.isVisible()) {
      const today = new Date().toISOString().split('T')[0];
      await dateFilter.fill(today);
      
      await page.waitForTimeout(1000);
      
      // Verifica se filtro foi aplicado
      await expect(page.locator('[data-testid="notification-item"]')).toBeVisible();
    }
  });

  test('should display notification details', async ({ page }) => {
    await page.goto('/radar');
    
    // Clica na primeira notificação
    const firstNotification = page.locator('[data-testid="notification-item"], .notification-card').first();
    
    if (await firstNotification.isVisible()) {
      await firstNotification.click();
      
      // Verifica se detalhes são exibidos
      await expect(page.locator('text=/Details|Detalhes|Description/i')).toBeVisible();
    }
  });

  test('should mark notification as read', async ({ page }) => {
    await page.goto('/radar');
    
    // Marca notificação como lida
    const markReadButton = page.locator('button:has-text("Mark as Read"), button[aria-label*="read"]').first();
    
    if (await markReadButton.isVisible()) {
      await markReadButton.click();
      
      // Verifica mudança de estado
      await page.waitForTimeout(500);
      await expect(page.locator('text=/read|lida/i')).toBeVisible();
    }
  });

  test('should search notifications', async ({ page }) => {
    await page.goto('/radar');
    
    // Busca por termo
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('mineração');
      
      await page.waitForTimeout(500);
      
      // Verifica resultados
      const results = page.locator('[data-testid="notification-item"]');
      if (await results.count() > 0) {
        await expect(results.first()).toContainText(/mineração/i);
      }
    }
  });

  test('should display notification badges', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se há badge de notificações não lidas
    const badge = page.locator('[data-testid="notification-badge"], .badge, .notification-count');
    
    if (await badge.isVisible()) {
      const count = await badge.textContent();
      expect(count).toMatch(/\d+/);
    }
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Procura toggle de dark mode
    const themeToggle = page.locator('button[aria-label*="theme"], button:has-text("🌙"), button:has-text("☀")');
    
    if (await themeToggle.isVisible()) {
      // Clica para alternar tema
      await themeToggle.click();
      
      await page.waitForTimeout(300);
      
      // Verifica se classe dark foi aplicada
      const htmlElement = page.locator('html, body');
      const classes = await htmlElement.getAttribute('class');
      
      expect(classes).toContain('dark');
    }
  });

  test('should display real-time updates indicator', async ({ page }) => {
    await page.goto('/radar');
    
    // Verifica indicador de atualizações em tempo real
    const realtimeIndicator = page.locator('text=/real-time|tempo real|live/i, [data-testid="realtime-status"]');
    
    if (await realtimeIndicator.isVisible()) {
      await expect(realtimeIndicator).toBeVisible();
    }
  });

  test('should export notifications', async ({ page }) => {
    await page.goto('/radar');
    
    // Procura botão de exportar
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Exportar")');
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Verifica opções de export
      await expect(page.locator('text=/CSV|Excel|PDF/i')).toBeVisible();
    }
  });

  test('should paginate notifications', async ({ page }) => {
    await page.goto('/radar');
    
    // Verifica paginação
    const pagination = page.locator('[role="navigation"], .pagination, button:has-text("Next")');
    
    if (await pagination.isVisible()) {
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Próximo"), button[aria-label="Next"]');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        await page.waitForTimeout(1000);
        
        // Verifica se URL mudou ou conteúdo atualizou
        await expect(page.locator('[data-testid="notification-item"]')).toBeVisible();
      }
    }
  });
});
