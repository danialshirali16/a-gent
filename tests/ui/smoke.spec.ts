import { expect, test } from '@playwright/test';

test('Reason-style shell, rail, settings, and connections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Message A Gent' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Personal workspace/ })).toBeVisible();

  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();

  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.getByRole('button', { name: 'Connect apps' }).click();
  await expect(page.getByRole('heading', { name: 'Connections' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Models' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
});

test('chat streams a reply through the fake Codex adapter', async ({ page }) => {
  await page.goto('/');
  const token = await page.evaluate(() => (window as any).__AGENT_CONFIG__?.token as string | undefined);
  expect(token).toBeTruthy();
  const response = await page.evaluate(async token => {
    const result = await fetch('/api/providers/codex/connect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    return result.status;
  }, token!);
  expect(response).toBe(200);

  await page.getByRole('textbox', { name: 'Message A Gent' }).fill('Hello from Playwright');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('A Gent test response 1.')).toBeVisible({ timeout: 15000 });
});

test('mobile drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible();
});
