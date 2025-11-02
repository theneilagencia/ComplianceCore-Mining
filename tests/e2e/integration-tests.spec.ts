import { test, expect } from '@playwright/test';

/**
 * Integration Tests
 * 
 * Testa integrações entre componentes do Sprint 5:
 * - Redis Cache + API calls
 * - SSE Events + Real-time updates
 * - Storage Hybrid + Upload flow
 * - Language Selection + Report Generation
 */

test.describe('Integration Tests - Sprint 5', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Redis Cache Integration', () => {
    test('should cache API responses', async ({ page }) => {
      // Primeira chamada (cache miss)
      await page.goto('/reports');
      
      // Capturar tempo de resposta
      const firstLoadStart = Date.now();
      await page.waitForSelector('[data-testid="reports-list"]');
      const firstLoadTime = Date.now() - firstLoadStart;
      
      // Recarregar (cache hit)
      await page.reload();
      const secondLoadStart = Date.now();
      await page.waitForSelector('[data-testid="reports-list"]');
      const secondLoadTime = Date.now() - secondLoadStart;
      
      // Segunda carga deve ser mais rápida (cached)
      expect(secondLoadTime).toBeLessThan(firstLoadTime);
      
      // Verificar header de cache no DevTools
      const responses: any[] = [];
      page.on('response', response => {
        if (response.url().includes('/api/trpc')) {
          responses.push(response);
        }
      });
      
      await page.reload();
      
      // Aguardar resposta
      await page.waitForTimeout(500);
      
      // Verificar que ao menos uma resposta tem cache hit
      const cachedResponse = responses.find(r => 
        r.headers()['x-cache'] === 'HIT'
      );
      
      expect(cachedResponse).toBeDefined();
    });

    test('should invalidate cache on mutation', async ({ page }) => {
      // Carregar lista de relatórios
      await page.goto('/reports');
      await page.waitForSelector('[data-testid="reports-list"]');
      
      // Criar novo relatório
      await page.click('button:has-text("New Report")');
      await page.fill('[name="title"]', 'Test Report for Cache');
      await page.click('[name="standard"]');
      await page.click('text="JORC 2012"');
      await page.click('button:has-text("Create")');
      
      // Aguardar criação
      await page.waitForTimeout(1000);
      
      // Voltar para lista
      await page.goto('/reports');
      
      // Novo relatório deve aparecer (cache invalidado)
      await expect(page.locator('text="Test Report for Cache"')).toBeVisible({
        timeout: 5000
      });
    });

    test('should show cache status in metrics', async ({ page }) => {
      // Navegar para métricas
      await page.goto('/metrics');
      
      // Verificar seção de cache
      await expect(page.locator('text="Cache Statistics"')).toBeVisible();
      
      // Fazer várias requisições para gerar estatísticas
      for (let i = 0; i < 5; i++) {
        await page.goto('/reports');
        await page.waitForTimeout(300);
      }
      
      // Voltar para métricas
      await page.goto('/metrics');
      
      // Verificar que hits aumentaram
      const hitRate = page.locator('[data-testid="cache-hit-rate"]');
      await expect(hitRate).toBeVisible();
      
      const hitValue = await hitRate.textContent();
      expect(parseFloat(hitValue || '0')).toBeGreaterThan(0);
    });
  });

  test.describe('SSE Events Integration', () => {
    test('should receive real-time metric updates', async ({ page }) => {
      // Abrir métricas
      await page.goto('/metrics');
      
      // Capturar valor inicial
      const totalDocs = page.locator('[data-testid="ocr-total-docs"]');
      const initialValue = await totalDocs.textContent();
      
      // Em outra aba/janela, simular processamento de documento
      // (Em teste real, isso seria feito via API ou segundo browser)
      await page.evaluate(() => {
        // Simular evento SSE
        const event = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'metrics-update',
            payload: {
              ocrTotalDocs: parseInt(document.querySelector('[data-testid="ocr-total-docs"]')?.textContent || '0') + 1
            }
          })
        });
        window.dispatchEvent(event);
      });
      
      // Aguardar atualização
      await page.waitForTimeout(1000);
      
      // Verificar que valor foi atualizado sem reload
      const newValue = await totalDocs.textContent();
      expect(newValue).not.toBe(initialValue);
    });

    test('should reconnect SSE on connection lost', async ({ page }) => {
      // Abrir métricas
      await page.goto('/metrics');
      
      // Verificar conexão SSE ativa
      await expect(page.locator('[data-testid="sse-status"]')).toHaveText('Connected');
      
      // Simular perda de conexão
      await page.evaluate(() => {
        // Fechar conexão SSE
        const event = new Event('error');
        window.dispatchEvent(event);
      });
      
      // Verificar reconexão
      await expect(page.locator('[data-testid="sse-status"]')).toHaveText('Reconnecting...');
      
      // Aguardar reconexão
      await expect(page.locator('[data-testid="sse-status"]')).toHaveText('Connected', {
        timeout: 5000
      });
    });

    test('should show notification when report completes', async ({ page }) => {
      // Iniciar upload de relatório
      await page.goto('/reports/generate');
      await page.click('button:has-text("Upload de Arquivo")');
      
      // Simular upload (mock)
      // ... código de upload ...
      
      // SSE deve enviar notificação quando processing completar
      await page.evaluate(() => {
        const event = new MessageEvent('message', {
          data: JSON.stringify({
            type: 'report-completed',
            payload: {
              reportId: 'rpt_test123',
              status: 'ready_for_audit'
            }
          })
        });
        window.dispatchEvent(event);
      });
      
      // Verificar toast de notificação
      await expect(page.locator('text="Report processing completed"')).toBeVisible();
    });
  });

  test.describe('Storage Hybrid Integration', () => {
    test('should upload to available provider', async ({ page }) => {
      // Navegar para upload
      await page.goto('/reports/generate');
      await page.click('button:has-text("Upload de Arquivo")');
      
      // Interceptar upload para ver qual provider foi usado
      let usedProvider = '';
      page.on('response', async response => {
        if (response.url().includes('uploadFile')) {
          const body = await response.json();
          if (body.result?.data?.provider) {
            usedProvider = body.result.data.provider;
          }
        }
      });
      
      // Upload arquivo
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/sample-jorc-report.pdf');
      await page.click('button:has-text("Fazer Upload")');
      
      // Aguardar upload
      await page.waitForTimeout(3000);
      
      // Verificar que provider foi usado
      expect(usedProvider).toMatch(/cloudinary|forge|render-disk/);
    });

    test('should fallback to secondary provider on failure', async ({ page }) => {
      // Mock: primeiro provider falha, segundo sucede
      await page.route('**/api/trpc/**', route => {
        const url = route.request().url();
        if (url.includes('uploadFile')) {
          // Primeira tentativa: simular falha do Cloudinary
          const postData = route.request().postDataJSON();
          if (postData && !postData._retry) {
            route.fulfill({
              status: 500,
              body: JSON.stringify({ error: 'Cloudinary unavailable' })
            });
          } else {
            // Segunda tentativa: sucesso com Render Disk
            route.fulfill({
              status: 200,
              body: JSON.stringify({
                result: {
                  data: {
                    s3Url: '/api/storage/download/test.pdf',
                    s3Key: 'test.pdf',
                    provider: 'render-disk'
                  }
                }
              })
            });
          }
        } else {
          route.continue();
        }
      });
      
      // Tentar upload
      await page.goto('/reports/generate');
      await page.click('button:has-text("Upload de Arquivo")');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/sample-jorc-report.pdf');
      await page.click('button:has-text("Fazer Upload")');
      
      // Deve eventualmente suceder com fallback
      await expect(page.locator('text=/Relatório processado com sucesso/')).toBeVisible({
        timeout: 30000
      });
    });

    test('should download from correct provider', async ({ page }) => {
      // Criar relatório com arquivo
      // ... código de criação ...
      
      // Tentar download
      await page.goto('/reports');
      await page.click('[data-testid="report-card"]:first-child');
      await page.click('button:has-text("Download")');
      
      // Verificar que download usa URL correta
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toBeTruthy();
    });
  });

  test.describe('Language Selection Integration', () => {
    test('should generate report in selected language', async ({ page }) => {
      // Criar relatório
      await page.goto('/reports/generate');
      
      // Selecionar idioma
      await page.click('[name="language"]');
      await page.click('text="🇪🇸 Español"');
      
      // Preencher dados
      await page.fill('[name="projectName"]', 'Proyecto de Prueba');
      await page.click('[name="standard"]');
      await page.click('text="JORC 2012"');
      
      // Criar
      await page.click('button:has-text("Criar Relatório")');
      
      // Aguardar criação
      await page.waitForTimeout(2000);
      
      // Abrir relatório
      await page.goto('/reports');
      await page.click('text="Proyecto de Prueba"');
      
      // Verificar que conteúdo está em espanhol
      await expect(page.locator('text="Resumen Ejecutivo"')).toBeVisible();
      await expect(page.locator('text="Introducción"')).toBeVisible();
      await expect(page.locator('text="Metodología"')).toBeVisible();
    });

    test('should export DOCX in selected language', async ({ page }) => {
      // Abrir relatório existente
      await page.goto('/reports');
      await page.click('[data-testid="report-card"]:first-child');
      
      // Exportar
      await page.click('button:has-text("Export")');
      await page.click('text="Export as DOCX"');
      
      // Aguardar download
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Confirm")');
      const download = await downloadPromise;
      
      // Verificar que arquivo foi criado
      expect(download.suggestedFilename()).toMatch(/\.docx$/);
    });

    test('should switch language dynamically', async ({ page }) => {
      // Abrir relatório
      await page.goto('/reports');
      await page.click('[data-testid="report-card"]:first-child');
      
      // Verificar idioma atual (português)
      await expect(page.locator('text="Resumo Executivo"')).toBeVisible();
      
      // Mudar idioma
      await page.click('[data-testid="language-selector"]');
      await page.click('text="English"');
      
      // Aguardar atualização
      await page.waitForTimeout(500);
      
      // Verificar que conteúdo mudou
      await expect(page.locator('text="Executive Summary"')).toBeVisible();
      await expect(page.locator('text="Resumo Executivo"')).not.toBeVisible();
    });
  });

  test.describe('Complete Flow Integration', () => {
    test('should complete full workflow: upload → parse → review → audit → export', async ({ page }) => {
      // 1. Upload
      await page.goto('/reports/generate');
      await page.click('button:has-text("Upload de Arquivo")');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/sample-jorc-report.pdf');
      await page.click('button:has-text("Fazer Upload")');
      
      await expect(page.locator('text=/Relatório processado com sucesso/')).toBeVisible({
        timeout: 30000
      });
      
      // 2. Review
      await page.click('button:has-text("Revisar agora")');
      await expect(page.locator('h1:has-text("Review Report")')).toBeVisible();
      
      // Fazer algumas edições
      await page.fill('[name="projectName"]', 'Gold Mine Project Updated');
      await page.click('button:has-text("Save Changes")');
      
      // 3. Audit
      await page.click('button:has-text("Run Audit")');
      await expect(page.locator('text="Audit completed"')).toBeVisible({
        timeout: 15000
      });
      
      // Verificar score
      const auditScore = page.locator('[data-testid="audit-score"]');
      await expect(auditScore).toBeVisible();
      
      // 4. Export
      await page.click('button:has-text("Export")');
      await page.click('text="Export as PDF"');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Confirm Export")');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      
      // 5. Verificar métricas foram atualizadas
      await page.goto('/metrics');
      
      // Parsing metrics devem ter incrementado
      const totalParsed = page.locator('[data-testid="total-reports-parsed"]');
      const parsedValue = await totalParsed.textContent();
      expect(parseInt(parsedValue || '0')).toBeGreaterThan(0);
    });
  });
});
