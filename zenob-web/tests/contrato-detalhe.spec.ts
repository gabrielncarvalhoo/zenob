import { test, expect } from '@playwright/test';

test.describe('Detalhe do contrato', () => {
  test('exibe KPIs e ReceivablesList', async ({ page, request }) => {
    const res = await request.get('http://localhost:3000/api/v1/leases', {
      headers: { 'x-account-id': 'account-teste-001' },
    });
    expect(res.ok()).toBeTruthy();
    const leases = await res.json();
    test.skip(!Array.isArray(leases) || leases.length === 0, 'sem contratos cadastrados');

    await page.goto(`/contratos/${leases[0].id}`);

    await expect(page.getByText('Próximo vencimento')).toBeVisible();
    await expect(page.getByText('Total recebido')).toBeVisible();
    await expect(page.getByText('Saldo aberto')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Cobranças Próximas/ })).toBeVisible();
  });

  test('lista de contratos: heading visível', async ({ page }) => {
    await page.goto('/contratos');
    await expect(page.getByRole('main').getByRole('heading', { name: 'Contratos', level: 1 })).toBeVisible();
  });
});
