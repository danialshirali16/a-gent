import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 60000 });

async function home(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: /^Message / })).toBeVisible();
}

async function connectCodex(page: Page) {
  const token = await page.evaluate(() => (window as unknown as { __AGENT_CONFIG__?: { token?: string } }).__AGENT_CONFIG__?.token);
  expect(token).toBeTruthy();
  const status = () => page.evaluate(async next => {
    const response = await fetch('/api/providers', { headers: { Authorization: `Bearer ${next}` } });
    const providers = await response.json() as Array<{ id: string; status: string }>;
    return providers.find(provider => provider.id === 'codex')?.status;
  }, token!);
  if (await status() !== 'connected') {
    const response = await page.evaluate(async next => {
      const result = await fetch('/api/providers/codex/connect', { method: 'POST', headers: { Authorization: `Bearer ${next}`, 'Content-Type': 'application/json' }, body: '{}' });
      return result.status;
    }, token!);
    expect(response).toBe(200);
  }
  await expect.poll(status, { timeout: 15000 }).toBe('connected');
}

test('agents can be created and customized', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: 'Create an agent', exact: true }).click();
  await page.getByLabel('Name').fill('E2E Agent');
  await page.getByLabel('What does it help with?').fill('Agent created by the E2E matrix.');
  await page.getByLabel('Instructions').fill('Act as a careful E2E test agent.');
  await page.getByRole('button', { name: 'Create agent' }).click();
  await expect(page.getByRole('button', { name: 'E2E Agent', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'More workspace options' }).click();
  await page.getByRole('menuitem', { name: 'All agents' }).click();
  await page.getByRole('button', { name: 'Actions for E2E Agent' }).click();
  await page.getByRole('menuitem', { name: 'Customize agent' }).click();
  await page.getByLabel('Name').fill('E2E Agent Updated');
  await page.getByRole('button', { name: 'Save agent' }).click();
  await expect(page.getByRole('button', { name: 'E2E Agent Updated', exact: true })).toBeVisible();
});

test('agent avatar shapes can be chosen, saved, and persist', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: 'Create an agent', exact: true }).click();
  await page.getByLabel('Name').fill('Avatar Shape Agent');
  const trigger = page.locator('.avatar-picker-trigger');
  await trigger.click();
  await page.getByRole('radio', { name: 'Cat' }).check({ force: true });
  await page.keyboard.press('Enter');
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Create agent' }).click();
  const row = page.getByRole('button', { name: 'Avatar Shape Agent', exact: true });
  await expect(row).toBeVisible();
  await expect(row.locator('[data-avatar-type="cat"]')).toHaveCount(1);

  await page.reload();
  await expect(row).toBeVisible();
  await expect(row.locator('[data-avatar-type="cat"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Create an agent', exact: true }).click();
  await page.locator('.avatar-picker-trigger').click();
  await page.getByRole('radio', { name: 'Puddle' }).check({ force: true });
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Create an agent', exact: true }).click();
  await expect(page.locator('.avatar-picker-trigger-copy strong')).toHaveText('Droid');
  await page.getByRole('button', { name: 'Cancel' }).click();
});

test('chat approvals, terminal activity, and files work end to end', async ({ page }) => {
  await home(page);
  await page.getByRole('navigation', { name: 'Agents' }).getByRole('button', { name: 'A Gent', exact: true }).click();
  await connectCodex(page);
  await page.waitForTimeout(500);
  await page.getByRole('textbox', { name: 'Message A Gent' }).fill('[approval]');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.reason-approval').first()).toBeVisible({ timeout: 30000 });

  await page.getByRole('button', { name: 'Open side panel' }).click();
  await page.getByRole('tab', { name: 'Approvals' }).click();
  const panelApproval = page.locator('.reason-sidepanel-approvals');
  await expect(panelApproval).toBeVisible();
  await panelApproval.getByRole('button', { name: 'Allow this action' }).click();
  await expect(page.getByRole('main').getByText('Approved task completed.')).toBeVisible({ timeout: 15000 });

  await page.getByRole('tab', { name: 'Terminal' }).click();
  await expect(page.locator('.reason-terminal-panel').getByText('Connecting to your model')).toBeVisible();
  await page.getByRole('tab', { name: 'Files' }).click();
  const files = page.locator('.reason-files-panel');
  await expect(files.getByText('README.md')).toBeVisible();
  await files.getByRole('button', { name: 'src' }).click();
  await expect(files.getByText('index.ts')).toBeVisible();
});

test('schedules can be created and listed', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: 'More workspace options' }).click();
  await page.getByRole('menuitem', { name: 'Scheduled' }).click();
  await expect(page.getByRole('heading', { name: 'Scheduled' })).toBeVisible();
  await page.getByRole('button', { name: 'Schedule task' }).click();
  await expect(page.getByRole('heading', { name: 'Schedule a task' })).toBeVisible();
  await page.getByLabel('Task name').fill('E2E weekly review');
  await page.getByLabel('Instructions').fill('Prepare the E2E review.');
  await page.getByRole('button', { name: 'Schedule task' }).click();

  await page.getByRole('button', { name: 'More workspace options' }).click();
  await page.getByRole('menuitem', { name: 'Scheduled' }).click();
  await expect(page.getByText('E2E weekly review')).toBeVisible();
  await expect(page.locator('.ui-badge', { hasText: 'Scheduled' })).toBeVisible();
});

test('workspace export and import round-trip', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await page.getByRole('button', { name: 'Data' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const exported = await readFile(path!, 'utf8');
  expect(exported).toContain('"agentGroups"');
  expect(exported).toContain('E2E Agent Updated');
  expect(exported).toContain('E2E weekly review');

  const responsePromise = page.waitForResponse(response => response.url().includes('/api/import') && response.request().method() === 'POST');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import' }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(path!);
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Your data' })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('device tokens can be created, rotated, and revoked', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await page.getByRole('button', { name: 'Devices' }).click();
  await page.getByPlaceholder('Device name').fill('E2E Phone');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByText('New token for E2E Phone')).toBeVisible();
  const token = await page.locator('.device-token-value code').textContent();
  expect(token).toMatch(/^agt_/);
  await page.getByRole('button', { name: 'Done' }).click();
  const row = page.locator('.device-row', { hasText: 'E2E Phone' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Rotate' }).click();
  await expect(page.getByText('New token for E2E Phone')).toBeVisible();
  const rotated = await page.locator('.device-token-value code').textContent();
  expect(rotated).toMatch(/^agt_/);
  expect(rotated).not.toBe(token);
  await page.getByRole('button', { name: 'Done' }).click();
  await row.getByRole('button', { name: 'Revoke' }).click();
  await expect(page.getByRole('dialog', { name: 'Revoke E2E Phone?' })).toBeVisible();
  await page.getByRole('dialog', { name: 'Revoke E2E Phone?' }).getByRole('button', { name: 'Revoke device' }).click();
  await expect(row.getByText('Revoked', { exact: true })).toBeVisible();
});

test('keyboard flows work across menus, side panel, and dialogs', async ({ page }) => {
  await home(page);
  const more = page.getByRole('button', { name: 'More workspace options' });
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'All agents' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Scheduled' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();

  const add = page.getByRole('button', { name: 'Add' });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Attach files' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(add).toBeFocused();

  await page.keyboard.press('Control+Backslash');
  await expect(page.getByRole('tab', { name: 'Session', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Session', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Sessions', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tab', { name: 'Session', exact: true })).not.toBeVisible();

  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Settings' })).not.toBeVisible();
});
