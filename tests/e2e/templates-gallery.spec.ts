import { test, expect } from '@playwright/test';

/**
 * E2E Test: Templates Gallery
 * 
 * Testa a galeria de templates do Sprint 5:
 * - Listagem de templates (4 padrões internacionais)
 * - Filtros e busca
 * - Pré-visualização
 * - Seleção de template
 * - Integração com geração de relatórios
 */

test.describe('Templates Gallery', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navegar para galeria de templates
    await page.goto('/templates');
  });

  test('should display 4 international standards', async ({ page }) => {
    // Verificar título
    await expect(page.locator('h1:has-text("Templates Gallery")')).toBeVisible();
    
    // Verificar que 4 templates são mostrados
    const templates = page.locator('[data-testid="template-card"]');
    await expect(templates).toHaveCount(4);
    
    // Verificar cada padrão
    await expect(page.locator('text="JORC 2012"')).toBeVisible();
    await expect(page.locator('text="NI 43-101"')).toBeVisible();
    await expect(page.locator('text="SAMREC 2016"')).toBeVisible();
    await expect(page.locator('text="PERC 2021"')).toBeVisible();
  });

  test('should show template details', async ({ page }) => {
    // Clicar no primeiro template (JORC)
    await page.click('[data-testid="template-card"]:has-text("JORC 2012")');
    
    // Verificar detalhes
    await expect(page.locator('h2:has-text("JORC 2012")')).toBeVisible();
    await expect(page.locator('text=/Australasian Joint Ore Reserves Committee/')).toBeVisible();
    
    // Verificar seções do template
    await expect(page.locator('text="Sections"')).toBeVisible();
    await expect(page.locator('text="1. Executive Summary"')).toBeVisible();
    await expect(page.locator('text="2. Introduction"')).toBeVisible();
    await expect(page.locator('text="3. Geology and Resources"')).toBeVisible();
    
    // Verificar metadados
    await expect(page.locator('text="Standard Type"')).toBeVisible();
    await expect(page.locator('text="International"')).toBeVisible();
    await expect(page.locator('text="Region"')).toBeVisible();
    await expect(page.locator('text="Australia, Asia-Pacific"')).toBeVisible();
  });

  test('should filter templates by region', async ({ page }) => {
    // Abrir filtro de região
    await page.click('[data-testid="region-filter"]');
    
    // Selecionar "Americas"
    await page.click('text="Americas"');
    
    // Verificar que apenas NI 43-101 é mostrado
    const templates = page.locator('[data-testid="template-card"]');
    await expect(templates).toHaveCount(1);
    await expect(page.locator('text="NI 43-101"')).toBeVisible();
    
    // Outros não devem estar visíveis
    await expect(page.locator('text="JORC 2012"')).not.toBeVisible();
    await expect(page.locator('text="SAMREC 2016"')).not.toBeVisible();
  });

  test('should search templates by name', async ({ page }) => {
    // Digitar na busca
    await page.fill('[data-testid="template-search"]', 'JORC');
    
    // Verificar resultados filtrados
    const templates = page.locator('[data-testid="template-card"]');
    await expect(templates).toHaveCount(1);
    await expect(page.locator('text="JORC 2012"')).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    // Aplicar filtro
    await page.click('[data-testid="region-filter"]');
    await page.click('text="Americas"');
    
    // Verificar que filtro foi aplicado
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount(1);
    
    // Limpar filtros
    await page.click('button:has-text("Clear Filters")');
    
    // Verificar que todos templates voltaram
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount(4);
  });

  test('should preview template sections', async ({ page }) => {
    // Clicar em preview do JORC
    await page.click('[data-testid="template-card"]:has-text("JORC 2012") button:has-text("Preview")');
    
    // Verificar modal de preview
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Template Preview")')).toBeVisible();
    
    // Verificar estrutura
    await expect(page.locator('text="Section 1: Sampling Techniques and Data"')).toBeVisible();
    await expect(page.locator('text="Section 2: Reporting of Exploration Results"')).toBeVisible();
    await expect(page.locator('text="Section 3: Estimation and Reporting of Mineral Resources"')).toBeVisible();
    
    // Fechar preview
    await page.click('button:has-text("Close")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should select template for new report', async ({ page }) => {
    // Clicar em "Use Template"
    await page.click('[data-testid="template-card"]:has-text("JORC 2012") button:has-text("Use Template")');
    
    // Deve redirecionar para criação de relatório
    await page.waitForURL(/\/reports\/generate/);
    
    // Verificar que template foi pré-selecionado
    const standardSelect = page.locator('[name="standard"]');
    await expect(standardSelect).toHaveValue('JORC_2012');
  });

  test('should show template statistics', async ({ page }) => {
    // Verificar estatísticas em cada card
    const jorcCard = page.locator('[data-testid="template-card"]:has-text("JORC 2012")');
    
    // Verificar métricas
    await expect(jorcCard.locator('text=/\\d+ reports created/')).toBeVisible();
    await expect(jorcCard.locator('text=/Last used:/')).toBeVisible();
    
    // Verificar rating/popularidade
    await expect(jorcCard.locator('[data-testid="template-popularity"]')).toBeVisible();
  });

  test('should sort templates by popularity', async ({ page }) => {
    // Abrir menu de ordenação
    await page.click('[data-testid="sort-dropdown"]');
    
    // Selecionar "Most Popular"
    await page.click('text="Most Popular"');
    
    // Verificar que ordem mudou
    const firstCard = page.locator('[data-testid="template-card"]').first();
    await expect(firstCard.locator('[data-testid="popularity-badge"]')).toBeVisible();
  });

  test('should sort templates by recent usage', async ({ page }) => {
    // Abrir menu de ordenação
    await page.click('[data-testid="sort-dropdown"]');
    
    // Selecionar "Recently Used"
    await page.click('text="Recently Used"');
    
    // Verificar que ordem mudou
    const firstCard = page.locator('[data-testid="template-card"]').first();
    await expect(firstCard.locator('text=/Last used:/')).toBeVisible();
  });

  test('should show template comparison', async ({ page }) => {
    // Selecionar múltiplos templates para comparação
    await page.click('[data-testid="template-card"]:has-text("JORC 2012") [data-testid="compare-checkbox"]');
    await page.click('[data-testid="template-card"]:has-text("NI 43-101") [data-testid="compare-checkbox"]');
    
    // Clicar em botão de comparar
    await page.click('button:has-text("Compare Selected")');
    
    // Verificar modal de comparação
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Template Comparison")')).toBeVisible();
    
    // Verificar lado a lado
    await expect(page.locator('text="JORC 2012"')).toBeVisible();
    await expect(page.locator('text="NI 43-101"')).toBeVisible();
    
    // Verificar diferenças destacadas
    await expect(page.locator('[data-testid="difference-highlight"]')).toBeVisible();
  });

  test('should download template as PDF', async ({ page }) => {
    // Abrir opções do template
    await page.click('[data-testid="template-card"]:has-text("JORC 2012") [data-testid="template-menu"]');
    
    // Clicar em download
    await page.click('text="Download as PDF"');
    
    // Aguardar download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Verificar nome do arquivo
    expect(download.suggestedFilename()).toMatch(/jorc.*\.pdf/i);
  });

  test('should download template as DOCX', async ({ page }) => {
    // Abrir opções do template
    await page.click('[data-testid="template-card"]:has-text("JORC 2012") [data-testid="template-menu"]');
    
    // Clicar em download
    await page.click('text="Download as DOCX"');
    
    // Aguardar download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Verificar nome do arquivo
    expect(download.suggestedFilename()).toMatch(/jorc.*\.docx/i);
  });

  test('should show template guidelines', async ({ page }) => {
    // Clicar em "View Guidelines"
    await page.click('[data-testid="template-card"]:has-text("JORC 2012") button:has-text("Guidelines")');
    
    // Verificar modal de guidelines
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("JORC 2012 Guidelines")')).toBeVisible();
    
    // Verificar conteúdo
    await expect(page.locator('text=/Table 1/')).toBeVisible();
    await expect(page.locator('text=/Competent Person/')).toBeVisible();
    await expect(page.locator('text=/Reasonable prospects for eventual economic extraction/')).toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    // Buscar por algo inexistente
    await page.fill('[data-testid="template-search"]', 'XYZ12345');
    
    // Verificar mensagem de vazio
    await expect(page.locator('text="No templates found"')).toBeVisible();
    await expect(page.locator('text=/Try adjusting your search/')).toBeVisible();
    
    // Verificar que nenhum template é mostrado
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount(0);
  });

  test('should show loading states', async ({ page }) => {
    // Recarregar página
    await page.reload();
    
    // Verificar skeleton loaders
    await expect(page.locator('[data-testid="template-skeleton"]')).toBeVisible();
    
    // Aguardar carregamento
    await expect(page.locator('[data-testid="template-skeleton"]')).not.toBeVisible({
      timeout: 3000
    });
    
    // Verificar que templates foram carregados
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount(4);
  });

  test('should show template categories', async ({ page }) => {
    // Verificar categorias
    await expect(page.locator('text="International Standards"')).toBeVisible();
    
    // Verificar que todos 4 templates estão sob categoria correta
    const categorySection = page.locator('[data-testid="category-international"]');
    await expect(categorySection.locator('[data-testid="template-card"]')).toHaveCount(4);
  });

  test('should responsive layout on mobile', async ({ page, viewport }) => {
    // Mudar para viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar layout de grid muda
    const gallery = page.locator('[data-testid="templates-gallery"]');
    
    // Em mobile, cards devem estar em coluna única
    const gridColumns = await gallery.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    
    // Deve ter apenas 1 coluna
    expect(gridColumns).not.toContain('repeat(');
  });
});
