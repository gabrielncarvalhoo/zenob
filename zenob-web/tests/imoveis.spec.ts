import { test, expect } from '@playwright/test';

test.describe('Imóveis', () => {
  test('deve exibir a listagem de imóveis', async ({ page }) => {
    await page.goto('http://localhost:3001/imoveis');
    await expect(page.getByRole('heading', { name: 'Imóveis', level: 1 }).last()).toBeVisible();
    await expect(page.getByText('+ Novo imóvel')).toBeVisible();
  });

  test('deve navegar para o formulário de novo imóvel', async ({ page }) => {
    await page.goto('http://localhost:3001/imoveis');
    await page.getByText('+ Novo imóvel').click();
    await expect(page).toHaveURL('http://localhost:3001/imoveis/novo');
    await expect(page.getByRole('heading', { name: 'Novo Imóvel' })).toBeVisible();
  });

  test('deve mostrar seção de unidades ao selecionar Complexo', async ({ page }) => {
    await page.goto('http://localhost:3001/imoveis/novo');
    await page.selectOption('select[name="type"]', 'COMPLEX');
    await expect(page.getByText('Unidades do complexo')).toBeVisible();
  });

  test('deve preencher CEP e autocompletar endereço', async ({ page }) => {
    await page.goto('http://localhost:3001/imoveis/novo');
    await page.fill('input[name="zipCode"]', '58400250');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1500);
    await expect(page.locator('input[name="address"]')).not.toBeEmpty();
  });
});
