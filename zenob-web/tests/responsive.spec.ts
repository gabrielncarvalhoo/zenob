import { test, expect } from '@playwright/test';

test.describe('Layout responsivo', () => {
  test('mobile: hamburger abre/fecha sidebar drawer', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only');
    await page.goto('/dashboard');

    const sidebar = page.locator('aside');
    // estado inicial: oculto
    await expect(sidebar).toHaveClass(/-translate-x-full/);

    // abre via hamburger
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // fecha via backdrop
    await page.locator('div[aria-hidden="true"]').click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('mobile: sidebar fecha ao trocar de rota', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only');
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // navega para Imóveis
    await page.getByRole('link', { name: 'Imóveis' }).click();
    await expect(page).toHaveURL(/\/imoveis$/);
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('desktop: sidebar visível, sem hamburger', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only');
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeHidden();
  });

  test('cobranças: tabela com scroll horizontal em mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only');
    await page.goto('/cobrancas');
    await page.waitForLoadState('networkidle');
    // wrapper da tabela precisa ter overflow-x-auto
    const wrapper = page.locator('div.overflow-x-auto').first();
    await expect(wrapper).toBeVisible();
  });

  test('topbar: search bar oculta em mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only');
    await page.goto('/dashboard');
    await expect(page.getByPlaceholder('Buscar...')).toBeHidden();
  });

  test('topbar: search bar visível em desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only');
    await page.goto('/dashboard');
    await expect(page.getByPlaceholder('Buscar...')).toBeVisible();
  });
});
