import { test, expect } from '@playwright/test';

test.describe('Imóveis', () => {
  test('exibe listagem', async ({ page }) => {
    await page.goto('/imoveis');
    await expect(page.getByRole('main').getByRole('heading', { name: 'Imóveis', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Novo imóvel/ }).first()).toBeVisible();
  });

  test('navega para formulário de novo imóvel', async ({ page }) => {
    await page.goto('/imoveis');
    await page.getByRole('link', { name: /Novo imóvel/ }).first().click();
    await expect(page).toHaveURL(/\/imoveis\/novo$/);
    await expect(page.getByRole('main').getByRole('heading', { name: /Novo imóvel/i })).toBeVisible();
  });

  test('cards mostram tipo em português', async ({ page }) => {
    await page.goto('/imoveis');
    // Espera ao menos um tipo PT (depende do seed)
    const tipos = page.getByText(/(Casa|Apartamento|Complexo|Comercial|Terreno)/);
    await expect(tipos.first()).toBeVisible();
  });
});
