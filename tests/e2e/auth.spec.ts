import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Authentication Flow
 * 
 * Testa o fluxo completo de autenticação:
 * - Login
 * - Logout
 * - Proteção de rotas
 */

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navega para a página inicial
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Verifica se está na página de login
    await expect(page).toHaveURL('/auth/login');
    
    // Verifica elementos da página
    await expect(page.locator('h1')).toContainText(/login|entrar/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Tenta fazer login sem preencher campos
    await page.click('button[type="submit"]');
    
    // Verifica se mensagens de erro aparecem
    await expect(page.locator('text=/required|obrigatório/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Preenche com credenciais inválidas
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verifica mensagem de erro
    await expect(page.locator('text=/invalid|inválido|incorreto/i')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Preenche com credenciais válidas (mock ou test user)
    await page.fill('input[type="email"]', 'test@compliancecore.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    
    // Aguarda redirecionamento
    await page.waitForURL('/', { timeout: 5000 });
    
    // Verifica se está logado (dashboard visível)
    await expect(page.locator('text=/dashboard|painel/i')).toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Tenta acessar rota protegida sem login
    await page.goto('/reports');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should successfully logout', async ({ page }) => {
    // Primeiro faz login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@compliancecore.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
    
    // Faz logout
    await page.click('button[aria-label="User menu"], [data-testid="user-menu"]');
    await page.click('text=/logout|sair/i');
    
    // Verifica redirecionamento para login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should maintain session after page reload', async ({ page }) => {
    // Faz login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@compliancecore.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
    
    // Recarrega a página
    await page.reload();
    
    // Verifica se ainda está logado
    await expect(page.locator('text=/dashboard|painel/i')).toBeVisible();
  });
});
