import { test, expect } from '@playwright/test';

test.describe('Inquilinos', () => {
  test('deve exibir a listagem de inquilinos', async ({ page }) => {
    await page.goto('http://localhost:3001/inquilinos');
    await expect(page.getByRole('heading', { name: 'Inquilinos', level: 1 }).last()).toBeVisible();
    await expect(page.getByText('+ Novo inquilino')).toBeVisible();
  });

  test('deve navegar para o formulário de novo inquilino', async ({ page }) => {
    await page.goto('http://localhost:3001/inquilinos');
    await page.getByText('+ Novo inquilino').click();
    await expect(page).toHaveURL('http://localhost:3001/inquilinos/novo');
    await expect(page.getByRole('heading', { name: 'Novo Inquilino' })).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('http://localhost:3001/inquilinos/novo');
    await page.getByText('Salvar inquilino').click();
    await expect(page.locator('text=obrigatório').first()).toBeVisible();
  });
});
