import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Reports Generation Flow
 * 
 * Testa o fluxo completo de geração de relatórios:
 * - Seleção de documento
 * - Configuração de relatório
 * - Geração
 * - Visualização
 * - Download
 */

test.describe('Reports Generation Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@compliancecore.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.click('text=/reports|relatórios/i');
    
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.locator('h1, h2')).toContainText(/reports|relatórios/i);
  });

  test('should display reports list', async ({ page }) => {
    await page.goto('/reports');
    
    // Verifica lista de relatórios
    await expect(page.locator('table, [data-testid="reports-list"]')).toBeVisible();
    
    // Verifica colunas
    await expect(page.locator('text=/title|título/i')).toBeVisible();
    await expect(page.locator('text=/status/i')).toBeVisible();
    await expect(page.locator('text=/date|data/i')).toBeVisible();
  });

  test('should create new report button', async ({ page }) => {
    await page.goto('/reports');
    
    // Verifica botão de criar novo relatório
    const createButton = page.locator('button:has-text("New Report"), button:has-text("Novo Relatório"), a[href*="new"]');
    await expect(createButton.first()).toBeVisible();
  });

  test('should open report creation form', async ({ page }) => {
    await page.goto('/reports');
    
    // Clica em criar novo relatório
    await page.click('button:has-text("New Report"), button:has-text("Novo Relatório")');
    
    // Verifica se form ou modal abre
    await expect(page.locator('form, [role="dialog"]')).toBeVisible();
    await expect(page.locator('text=/title|título/i')).toBeVisible();
  });

  test('should fill report form and generate', async ({ page }) => {
    await page.goto('/reports/new');
    
    // Preenche formulário
    await page.fill('input[name="title"], input[placeholder*="title"]', 'Test Technical Report');
    await page.fill('input[name="projectName"], input[placeholder*="project"]', 'Gold Mine Project');
    
    // Seleciona standard
    await page.click('select[name="standard"], button:has-text("Select Standard")');
    await page.click('text=/JORC/i');
    
    // Seleciona documento base (se aplicável)
    if (await page.locator('select[name="documentId"]').isVisible()) {
      await page.selectOption('select[name="documentId"]', { index: 0 });
    }
    
    // Submete
    await page.click('button[type="submit"], button:has-text("Generate")');
    
    // Verifica processamento
    await expect(page.locator('text=/generating|gerando|processing/i')).toBeVisible();
  });

  test('should show report generation progress', async ({ page }) => {
    await page.goto('/reports/new');
    
    await page.fill('input[name="title"]', 'Progress Test Report');
    await page.click('button[type="submit"]');
    
    // Verifica indicador de progresso
    await expect(page.locator('[role="progressbar"], .spinner, .loading')).toBeVisible();
  });

  test('should display generated report', async ({ page }) => {
    await page.goto('/reports');
    
    // Clica no primeiro relatório
    await page.click('table tr:first-child td:first-child, [data-testid="report-item"]:first-child');
    
    // Verifica visualização do relatório
    await expect(page).toHaveURL(/\/reports\/\w+/);
    await expect(page.locator('h1')).toBeVisible();
    
    // Verifica seções do relatório
    await expect(page.locator('text=/Executive Summary|Geology|Resource/i')).toBeVisible();
  });

  test('should display report metadata', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Verifica metadados
    await expect(page.locator('text=/Project Name|Title|Standard|Date/i')).toBeVisible();
  });

  test('should display audit score', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Verifica se score de auditoria está visível
    await expect(page.locator('text=/score|pontuação|compliance/i')).toBeVisible();
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
  });

  test('should display KRCI violations', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Verifica seção de KRCIs
    await expect(page.locator('text=/KRCI|violations|issues/i')).toBeVisible();
  });

  test('should filter reports by status', async ({ page }) => {
    await page.goto('/reports');
    
    // Aplica filtro de status
    if (await page.locator('select[name="status"], button:has-text("Status")').isVisible()) {
      await page.click('select[name="status"], button:has-text("Status")');
      await page.click('text=/completed|concluído/i');
      
      // Aguarda filtro aplicar
      await page.waitForTimeout(1000);
      
      // Verifica se apenas relatórios completos são exibidos
      const statusCells = page.locator('td:has-text("Completed"), td:has-text("Concluído")');
      expect(await statusCells.count()).toBeGreaterThan(0);
    }
  });

  test('should search reports by title', async ({ page }) => {
    await page.goto('/reports');
    
    // Busca por título
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Gold');
      
      await page.waitForTimeout(500);
      
      // Verifica resultados
      await expect(page.locator('text=/Gold/i')).toBeVisible();
    }
  });

  test('should edit report', async ({ page }) => {
    await page.goto('/reports');
    await page.click('table tr:first-child');
    
    // Clica em editar
    const editButton = page.locator('button:has-text("Edit"), button[aria-label="Edit"]');
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Verifica se form de edição abre
      await expect(page.locator('form, input[name="title"]')).toBeVisible();
    }
  });

  test('should delete report', async ({ page }) => {
    await page.goto('/reports');
    
    // Clica em opções do primeiro relatório
    const optionsButton = page.locator('button[aria-label="Options"], button:has-text("⋮")').first();
    if (await optionsButton.isVisible()) {
      await optionsButton.click();
      
      // Clica em delete
      await page.click('text=/delete|excluir/i');
      
      // Confirma exclusão
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');
      
      // Verifica mensagem de sucesso
      await expect(page.locator('text=/deleted|excluído|removed/i')).toBeVisible();
    }
  });
});
