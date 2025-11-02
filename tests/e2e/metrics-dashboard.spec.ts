import { test, expect } from '@playwright/test';

/**
 * E2E Test: Metrics Dashboard
 * 
 * Testa o dashboard de métricas do Sprint 5:
 * - OCR Statistics
 * - Parsing Metrics
 * - System Performance
 * - Real-time updates via SSE
 */

test.describe('Metrics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navegar para página de métricas
    await page.goto('/metrics');
  });

  test('should display OCR statistics', async ({ page }) => {
    // Verificar seção de OCR
    await expect(page.locator('h2:has-text("OCR Statistics")')).toBeVisible();
    
    // Verificar cards de métricas
    await expect(page.locator('text="Total Documents Processed"')).toBeVisible();
    await expect(page.locator('text="Average Confidence"')).toBeVisible();
    await expect(page.locator('text="Success Rate"')).toBeVisible();
    
    // Verificar valores numéricos
    const totalDocs = page.locator('[data-testid="ocr-total-docs"]');
    await expect(totalDocs).toBeVisible();
    const totalValue = await totalDocs.textContent();
    expect(totalValue).toMatch(/\d+/);
    
    // Verificar gráfico de confiança
    await expect(page.locator('[data-testid="ocr-confidence-chart"]')).toBeVisible();
  });

  test('should display parsing metrics', async ({ page }) => {
    // Verificar seção de parsing
    await expect(page.locator('h2:has-text("Parsing Metrics")')).toBeVisible();
    
    // Verificar métricas
    await expect(page.locator('text="Total Reports Parsed"')).toBeVisible();
    await expect(page.locator('text="Average Parse Time"')).toBeVisible();
    await expect(page.locator('text="Fields Extracted"')).toBeVisible();
    
    // Verificar distribuição de padrões
    await expect(page.locator('[data-testid="parsing-standards-chart"]')).toBeVisible();
    
    // Verificar lista de padrões
    await expect(page.locator('text="JORC 2012"')).toBeVisible();
    await expect(page.locator('text="NI 43-101"')).toBeVisible();
    await expect(page.locator('text="SAMREC 2016"')).toBeVisible();
  });

  test('should display system performance metrics', async ({ page }) => {
    // Verificar seção de sistema
    await expect(page.locator('h2:has-text("System Performance")')).toBeVisible();
    
    // Verificar métricas de performance
    await expect(page.locator('text="Response Time"')).toBeVisible();
    await expect(page.locator('text="Uptime"')).toBeVisible();
    await expect(page.locator('text="Cache Hit Rate"')).toBeVisible();
    
    // Verificar valores
    const responseTime = page.locator('[data-testid="system-response-time"]');
    await expect(responseTime).toBeVisible();
    const rtValue = await responseTime.textContent();
    expect(rtValue).toMatch(/\d+\s*ms/);
    
    // Verificar gráfico de uptime
    await expect(page.locator('[data-testid="system-uptime-chart"]')).toBeVisible();
  });

  test('should show cache statistics', async ({ page }) => {
    // Verificar seção de cache (Redis)
    await expect(page.locator('text="Cache Statistics"')).toBeVisible();
    
    // Verificar métricas
    await expect(page.locator('text="Hit Rate"')).toBeVisible();
    await expect(page.locator('text="Total Hits"')).toBeVisible();
    await expect(page.locator('text="Total Misses"')).toBeVisible();
    await expect(page.locator('text="Memory Usage"')).toBeVisible();
    
    // Verificar valores percentuais
    const hitRate = page.locator('[data-testid="cache-hit-rate"]');
    await expect(hitRate).toBeVisible();
    const hitValue = await hitRate.textContent();
    expect(hitValue).toMatch(/\d+(\.\d+)?%/);
  });

  test('should update metrics in real-time via SSE', async ({ page }) => {
    // Capturar valor inicial
    const totalDocs = page.locator('[data-testid="ocr-total-docs"]');
    const initialValue = await totalDocs.textContent();
    
    // Simular novo documento processado (trigger SSE event)
    // Em ambiente de teste, podemos mockar o SSE
    await page.evaluate(() => {
      const event = new CustomEvent('metrics-update', {
        detail: {
          ocrTotalDocs: parseInt(document.querySelector('[data-testid="ocr-total-docs"]')?.textContent || '0') + 1
        }
      });
      window.dispatchEvent(event);
    });
    
    // Verificar que valor foi atualizado
    await expect(totalDocs).not.toHaveText(initialValue || '');
  });

  test('should filter metrics by date range', async ({ page }) => {
    // Verificar filtro de data
    await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible();
    
    // Selecionar range (último 7 dias)
    await page.click('[data-testid="date-range-filter"]');
    await page.click('text="Last 7 days"');
    
    // Verificar que métricas foram atualizadas
    await expect(page.locator('text="Showing data for: Last 7 days"')).toBeVisible();
    
    // Verificar que gráfico foi atualizado
    await page.waitForTimeout(1000); // Aguardar reload
    const chart = page.locator('[data-testid="ocr-confidence-chart"]');
    await expect(chart).toBeVisible();
  });

  test('should filter by standard type', async ({ page }) => {
    // Verificar filtro de padrão
    await expect(page.locator('[data-testid="standard-filter"]')).toBeVisible();
    
    // Selecionar JORC
    await page.click('[data-testid="standard-filter"]');
    await page.click('text="JORC 2012"');
    
    // Verificar que apenas métricas JORC são mostradas
    await expect(page.locator('text="Filtered by: JORC 2012"')).toBeVisible();
  });

  test('should export metrics as CSV', async ({ page }) => {
    // Clicar em botão de export
    await page.click('button:has-text("Export")');
    await page.click('text="Export as CSV"');
    
    // Aguardar download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Confirm Export")');
    const download = await downloadPromise;
    
    // Verificar nome do arquivo
    expect(download.suggestedFilename()).toMatch(/metrics.*\.csv/);
  });

  test('should export metrics as PDF', async ({ page }) => {
    // Clicar em botão de export
    await page.click('button:has-text("Export")');
    await page.click('text="Export as PDF"');
    
    // Aguardar download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Confirm Export")');
    const download = await downloadPromise;
    
    // Verificar nome do arquivo
    expect(download.suggestedFilename()).toMatch(/metrics.*\.pdf/);
  });

  test('should show loading states', async ({ page }) => {
    // Recarregar página
    await page.reload();
    
    // Verificar skeleton loaders
    await expect(page.locator('[data-testid="metrics-skeleton"]')).toBeVisible();
    
    // Aguardar carregamento
    await expect(page.locator('[data-testid="metrics-skeleton"]')).not.toBeVisible({
      timeout: 5000
    });
    
    // Verificar que dados foram carregados
    await expect(page.locator('[data-testid="ocr-total-docs"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock de erro na API
    await page.route('**/api/trpc/metrics.**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Recarregar página
    await page.reload();
    
    // Verificar mensagem de erro
    await expect(page.locator('text="Failed to load metrics"')).toBeVisible();
    
    // Verificar botão de retry
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should refresh metrics on demand', async ({ page }) => {
    // Capturar timestamp inicial
    const timestamp = page.locator('[data-testid="metrics-timestamp"]');
    const initialTime = await timestamp.textContent();
    
    // Aguardar 2 segundos
    await page.waitForTimeout(2000);
    
    // Clicar em refresh
    await page.click('button:has-text("Refresh")');
    
    // Verificar que timestamp foi atualizado
    await expect(timestamp).not.toHaveText(initialTime || '');
  });

  test('should display warning for low cache hit rate', async ({ page }) => {
    // Mock de cache com hit rate baixo
    await page.route('**/api/trpc/metrics.cache**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          hitRate: 45.5, // Abaixo de 50%
          totalHits: 455,
          totalMisses: 545,
          memoryUsage: '128MB'
        })
      });
    });
    
    // Recarregar
    await page.reload();
    
    // Verificar warning
    await expect(page.locator('text=/Cache hit rate is below 50%/')).toBeVisible();
    await expect(page.locator('[data-testid="cache-warning"]')).toBeVisible();
  });

  test('should show trend indicators', async ({ page }) => {
    // Verificar indicadores de tendência
    const trendUp = page.locator('[data-testid="trend-up"]');
    const trendDown = page.locator('[data-testid="trend-down"]');
    
    // Ao menos um deve estar visível
    const upVisible = await trendUp.isVisible();
    const downVisible = await trendDown.isVisible();
    
    expect(upVisible || downVisible).toBeTruthy();
  });

  test('should compare with previous period', async ({ page }) => {
    // Ativar comparação
    await page.click('[data-testid="compare-toggle"]');
    
    // Verificar que métricas anteriores são mostradas
    await expect(page.locator('text="vs. Previous Period"')).toBeVisible();
    await expect(page.locator('[data-testid="previous-value"]')).toBeVisible();
    
    // Verificar percentual de mudança
    const changePercent = page.locator('[data-testid="change-percent"]');
    await expect(changePercent).toBeVisible();
    const changeValue = await changePercent.textContent();
    expect(changeValue).toMatch(/[+-]\d+(\.\d+)?%/);
  });
});
