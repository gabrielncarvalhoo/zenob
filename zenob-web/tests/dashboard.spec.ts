import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('deve redirecionar raiz para dashboard', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await expect(page).toHaveURL('http://localhost:3001/dashboard');
  });

  test('deve exibir os 4 cards de KPI', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    await expect(page.getByText('A RECEBER')).toBeVisible();
    await expect(page.getByText('RECEBIDO')).toBeVisible();
    await expect(page.getByText('INADIMPLÊNCIA')).toBeVisible();
    await expect(page.getByText('OCUPAÇÃO')).toBeVisible();
  });

  test('deve exibir a saudação', async ({ page }) => {
    await page.goto('http://localhost:3001/dashboard');
    await expect(page.getByText('Bom dia, Gabriel')).toBeVisible();
  });
});