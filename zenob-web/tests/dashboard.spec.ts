import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('redireciona raiz para dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('exibe saudação dinâmica', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  });

  test('exibe os 6 KPI cards', async ({ page }) => {
    await page.goto('/dashboard');
    for (const label of ['A receber', 'Recebido', 'Inadimplência', 'Ocupação', 'Contratos ativos', 'Despesas']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('exibe seção atalhos com 3 cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Atalhos' })).toBeVisible();
    await expect(page.getByText('Ver cobranças atrasadas')).toBeVisible();
    await expect(page.getByText('Novo contrato', { exact: true })).toBeVisible();
    await expect(page.getByText('Novo imóvel', { exact: true })).toBeVisible();
  });

  test('atalho Novo contrato navega para /contratos/novo', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /Novo contrato/ }).click();
    await expect(page).toHaveURL(/\/contratos\/novo$/);
  });
});
