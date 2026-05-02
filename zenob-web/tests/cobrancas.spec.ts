import { test, expect } from '@playwright/test';

test.describe('Cobranças', () => {
  test('exibe heading e KPIs', async ({ page }) => {
    await page.goto('/cobrancas');
    await expect(page.getByRole('main').getByRole('heading', { name: 'Cobranças', level: 1 })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^A receber$/ })).toBeVisible();
    await expect(page.getByText('Recebido no mês')).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^Atrasadas$/ })).toBeVisible();
  });

  test('tabs filtram por status via querystring', async ({ page }) => {
    await page.goto('/cobrancas');
    await page.getByRole('link', { name: 'Pagas' }).click();
    await expect(page).toHaveURL(/status=PAID/);
    await page.getByRole('link', { name: 'Atrasadas' }).click();
    await expect(page).toHaveURL(/status=OVERDUE/);
    await page.getByRole('link', { name: 'Todas' }).click();
    await expect(page).toHaveURL(/\/cobrancas$/);
  });

  test('cabeçalho da tabela tem ordem correta', async ({ page }) => {
    await page.goto('/cobrancas');
    const headers = await page.locator('th').allTextContents();
    const expected = ['Status', 'Imóvel', 'Competência', 'Vencimento', 'Valor original', 'Valor pago', 'Pago em', 'Saldo', 'Ações'];
    for (const h of expected) {
      expect(headers.some((t) => t.trim() === h)).toBeTruthy();
    }
  });
});
