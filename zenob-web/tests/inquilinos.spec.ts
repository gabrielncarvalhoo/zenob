import { test, expect } from '@playwright/test';

test.describe('Inquilinos', () => {
  test('exibe listagem', async ({ page }) => {
    await page.goto('/inquilinos');
    await expect(page.getByRole('main').getByRole('heading', { name: 'Inquilinos', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Novo inquilino/ }).first()).toBeVisible();
  });

  test('navega para formulário de novo inquilino', async ({ page }) => {
    await page.goto('/inquilinos');
    await page.getByRole('link', { name: /Novo inquilino/ }).first().click();
    await expect(page).toHaveURL(/\/inquilinos\/novo$/);
  });

  test('tabela tem 5 colunas', async ({ page }) => {
    await page.goto('/inquilinos');
    for (const col of ['Nome', 'CPF', 'Telefone', 'Status', 'Total devido']) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible();
    }
  });
});
