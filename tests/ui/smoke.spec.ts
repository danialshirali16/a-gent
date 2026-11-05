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

  await page.getByRole('button', { name: 'Connections' }).click();
  await expect(page.getByRole('heading', { name: 'Connections' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Codex' })).toBeVisible();
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
  await expect(page.getByRole('main').getByText('A Gent test response 1.')).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: 'Open side panel' }).click();
  await page.getByRole('tab', { name: 'Terminal' }).click();
  const terminal = page.locator('.reason-terminal-panel');
  await expect(terminal.getByText('Connecting to your model')).toBeVisible();
});

test('Stop stays truthful until provider cleanup and then releases the chat', async ({ page }) => {
  await page.goto('/');
  const token = await page.evaluate(() => (window as any).__AGENT_CONFIG__?.token as string | undefined);
  const status = await page.evaluate(async next => (await fetch('/api/providers/codex/connect', { method: 'POST', headers: { Authorization: `Bearer ${next}`, 'Content-Type': 'application/json' }, body: '{}' })).status, token!);
  expect(status).toBe(200);
  await page.getByRole('textbox', { name: 'Message A Gent' }).fill('[stop-slow]');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('button', { name: 'Stop reply' }).click();
  await expect(page.locator('.reason-composer-status .chip', { hasText: 'Stopping…' })).toBeVisible();
  await expect(page.getByText('Stopped by you')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Message A Gent' }).fill('After stop');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('main').getByText(/A Gent test response/).last()).toBeVisible({ timeout: 15000 });
});

test('a dropped stream reconnects and resynchronizes the running chat', async ({ page, context }) => {
  await page.goto('/');
  const token = await page.evaluate(() => (window as any).__AGENT_CONFIG__?.token as string | undefined);
  const status = await page.evaluate(async next => (await fetch('/api/providers/codex/connect', { method: 'POST', headers: { Authorization: `Bearer ${next}`, 'Content-Type': 'application/json' }, body: '{}' })).status, token!);
  expect(status).toBe(200);
  await page.getByRole('textbox', { name: 'Message A Gent' }).fill('[slow]');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('main').getByText('[slow]')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Stop reply' })).toBeVisible();
  await page.waitForTimeout(300);
  await context.setOffline(true);
  await expect(page.getByText('Reconnecting')).toBeVisible({ timeout: 15000 });
  await context.setOffline(false);
  await expect(page.getByText('Reconnecting')).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('main').getByText('Slow task completed.')).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
});

test('unsent drafts survive agent navigation and reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Product Designer', exact: true }).click();
  const composer = page.getByRole('textbox', { name: 'Message Product Designer' });
  await composer.fill('Draft that must survive navigation');
  await page.getByRole('button', { name: 'Software Engineer', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Message Software Engineer' })).toHaveValue('');
  await page.getByRole('button', { name: 'Product Designer', exact: true }).click();
  await expect(composer).toHaveValue('Draft that must survive navigation');
  await page.reload();
  await expect(composer).toHaveValue('Draft that must survive navigation');
  await composer.fill('');
  await page.waitForTimeout(400);
});

test('mobile drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible();
});


test('settings do not advertise deferred remote-device setup', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await page.getByRole('button', { name: 'Devices' }).click();
  await expect(page.getByRole('heading', { name: 'Devices', exact: true })).toBeVisible();
  await expect(page.getByText(/remote-device setup is deferred/i)).toBeVisible();
  await expect(page.getByLabel('Device name')).toHaveCount(0);
  await expect(page.getByText('Create a pairing token')).toHaveCount(0);
});


test('a device token can rotate itself from Settings', async ({ page, context }) => {
  await page.goto('/');
  const admin = await page.evaluate(() => (window as any).__AGENT_CONFIG__?.token as string | undefined);
  expect(admin).toBeTruthy();
  const created = await page.request.post('/api/devices', {
    headers: { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' },
    data: { name: 'Mac Test' },
  });
  expect(created.status()).toBe(201);
  const { token } = await created.json() as { token: string };
  const origin = new URL(page.url()).origin;
  await context.addCookies([{ name: 'agent_desktop_token', value: token, url: origin, httpOnly: true, sameSite: 'Strict' }]);

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Message A Gent' })).toBeVisible();
  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await page.getByRole('button', { name: 'Devices' }).click();
  await expect(page.getByRole('heading', { name: 'This device', exact: true })).toBeVisible();
  const row = page.locator('.device-row', { hasText: 'Mac Test' });
  await expect(row.getByText('Current', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Rotate' }).click();
  await expect(page.getByText('New token for Mac Test')).toBeVisible();
  const rotated = await page.locator('.device-token-value code').textContent();
  expect(rotated).toMatch(/^agt_/);
  expect(rotated).not.toBe(token);
  await expect(row.getByText('Current', { exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: 'Revoke' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('aGent.token'))).toBe(rotated);
  const status = await page.evaluate(async next => (await fetch('/api/bootstrap', { headers: { Authorization: `Bearer ${next}` } })).status, rotated!);
  expect(status).toBe(200);
  const oldStatus = await page.request.get('/api/bootstrap', { headers: { Authorization: `Bearer ${token}` } });
  expect(oldStatus.status()).toBe(401);
});


test('side panel exposes an approvals tab', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open side panel' }).click();
  await page.getByRole('tab', { name: 'Approvals' }).click();
  await expect(page.getByText('No approvals are waiting.')).toBeVisible();
});


test('side panel approvals can complete a waiting run', async ({ page }) => {
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
  await page.route('**/api/conversations/*/messages', async route => {
    const response = await route.fetch();
    await responseGate;
    await route.fulfill({ response });
  });
  await page.goto('/');
  const token = await page.evaluate(() => (window as any).__AGENT_CONFIG__?.token as string | undefined);
  expect(token).toBeTruthy();
  const status = async () => page.evaluate(async next => {
    const result = await fetch('/api/providers', { headers: { Authorization: `Bearer ${next}` } });
    const providers = await result.json() as Array<{ id: string; status: string }>;
    return providers.find(provider => provider.id === 'codex')?.status;
  }, token!);
  if (await status() !== 'connected') {
    const response = await page.evaluate(async next => {
      const result = await fetch('/api/providers/codex/connect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${next}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      return result.status;
    }, token!);
    expect(response).toBe(200);
  }
  await expect.poll(status, { timeout: 15000 }).toBe('connected');

  await page.getByRole('textbox', { name: 'Message A Gent' }).fill('[approval]');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.reason-approval').first()).toBeVisible({ timeout: 15000 });
  releaseResponse();
  await expect(page.getByRole('textbox', { name: 'Message A Gent' })).toBeEnabled();
  await expect(page.locator('.reason-approval').first()).toBeVisible();

  await page.getByRole('button', { name: 'Open side panel' }).click();
  await page.getByRole('tab', { name: 'Approvals' }).click();
  const panelApproval = page.locator('.reason-sidepanel-approvals');
  await expect(panelApproval).toBeVisible();
  await panelApproval.getByRole('button', { name: 'Allow this action' }).click();
  await expect(page.getByRole('main').getByText('Approved task completed.')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('No approvals are waiting.')).toBeVisible();
});


test('agent groups create, assign, rename, and delete from the sidebar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New group', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New agent group' })).toBeVisible();
  await page.getByLabel('Group name').fill('Product');
  await page.getByRole('button', { name: 'Create group' }).click();
  const groupOptions = page.getByRole('button', { name: 'Options for Product' });
  await expect(groupOptions).toBeVisible();
  await groupOptions.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Rename group' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Delete group' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(groupOptions).toBeFocused();

  await page.getByRole('button', { name: 'More workspace options' }).click();
  await page.getByRole('menuitem', { name: 'All agents' }).click();
  await page.getByRole('button', { name: 'Actions for Product Designer' }).click();
  await page.getByRole('menuitem', { name: 'Customize agent' }).click();
  await page.getByRole('combobox', { name: 'Agent group', exact: true }).selectOption({ label: 'Product' });
  await page.getByRole('button', { name: 'Save agent' }).click();

  const productGroup = page.locator('.reason-agent-group').filter({ hasText: 'Product' }).first();
  await expect(productGroup.getByRole('button', { name: 'Product Designer' })).toBeVisible();

  await page.getByRole('button', { name: 'Options for Product' }).click();
  await page.getByRole('menuitem', { name: 'Rename group' }).click();
  await expect(page.getByRole('heading', { name: 'Agent group' })).toBeVisible();
  await page.getByLabel('Group name').fill('Design');
  await page.getByRole('button', { name: 'Save group' }).click();
  await expect(page.getByRole('button', { name: 'Options for Design' })).toBeVisible();

  await page.getByRole('button', { name: 'Options for Design' }).click();
  await page.getByRole('menuitem', { name: 'Delete group' }).click();
  await expect(page.getByRole('heading', { name: 'Agent group' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete group' }).click();
  await expect(page.getByRole('heading', { name: 'Delete this group?' })).toBeVisible();
  await page.getByRole('dialog', { name: 'Delete this group?' }).getByRole('button', { name: 'Delete group' }).click();
  await expect(page.getByRole('button', { name: 'Options for Design' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Product Designer', exact: true })).toBeVisible();
});


test('side panel files browse the workspace read-only', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open side panel' }).click();
  await page.getByRole('tab', { name: 'Files' }).click();
  const files = page.locator('.reason-files-panel');
  await expect(files.getByText('README.md')).toBeVisible();
  await files.getByRole('button', { name: 'src' }).click();
  await expect(files.getByText('index.ts')).toBeVisible();
  await files.getByRole('button', { name: 'Back to parent folder' }).click();
  await expect(files.getByText('README.md')).toBeVisible();
});


test('keyboard navigates the workspace menu', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'More workspace options' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'All agents' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Scheduled' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'Workspace options' })).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('keyboard navigates the composer add menu', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Add' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Attach files' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /Project folder/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'Add' })).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('keyboard toggles and navigates the side panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Message A Gent' })).toBeVisible();
  await page.keyboard.press('Control+Backslash');
  await expect(page.getByRole('tab', { name: 'Session', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Session', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Sessions', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Approvals' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Session', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tab', { name: 'Session', exact: true })).not.toBeVisible();
});

test('dialogs close with Escape and restore focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /Personal workspace/ });
  await trigger.click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Settings' })).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('model picker supports keyboard navigation', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('.reason-model-pill');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('dialog', { name: 'Choose a model' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search connected models' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Choose a model' })).not.toBeVisible();
  await expect(trigger).toBeFocused();
});


test('model selection shows the effective chat choice and persists', async ({ page }) => {
  await page.goto('/');
  const token = await page.evaluate(() => (window as any).__AGENT_CONFIG__?.token as string | undefined);
  const status = await page.evaluate(async next => (await fetch('/api/providers/codex/connect', { method: 'POST', headers: { Authorization: `Bearer ${next}`, 'Content-Type': 'application/json' }, body: '{}' })).status, token!);
  expect(status).toBe(200);
  await page.getByRole('button', { name: 'Research Partner', exact: true }).click();
  await page.locator('.reason-model-pill').click();
  await page.getByRole('option', { name: 'Test model 2' }).click();
  await expect(page.locator('.reason-model-pill')).toContainText('Test model 2');
  await expect(page.locator('.model-picker-thinking-unavailable')).toHaveText('Provider default');
  await page.reload();
  await expect(page.locator('.reason-model-pill')).toContainText('Test model 2');
  await page.getByRole('button', { name: 'Open side panel' }).click();
  await page.getByRole('tab', { name: 'Session', exact: true }).click();
  await expect(page.locator('.reason-session-row', { hasText: 'Model' })).toContainText('Test model 2');
  await expect(page.locator('.reason-session-row', { hasText: 'Reasoning' })).toContainText('Provider default');
});

test('dialogs keep keyboard focus inside', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Personal workspace/ }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  for (let index = 0; index < 20; index++) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')));
  expect(inside).toBe(true);
});


test('reduced motion pauses live bot avatars', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Message A Gent' })).toBeVisible();
  const avatar = page.locator('.reason-agent-row .ui-agent-avatar').first();
  await expect(avatar).toHaveAttribute('data-avatar-motion', 'full');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(avatar).toHaveAttribute('data-avatar-motion', 'static');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(avatar).toHaveAttribute('data-avatar-motion', 'full');
});

test('loads the Inter Latin variable font only', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: /^Message / })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('14px "Inter Variable"'))).toBe(true);
  const fonts = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(entry => /inter-.*\.woff2/.test(entry.name))
    .map(entry => ({ name: entry.name, size: (entry as PerformanceResourceTiming).encodedBodySize })));
  expect(fonts).toHaveLength(1);
  expect(fonts[0].size).toBeGreaterThan(0);
  expect(fonts[0].size).toBeLessThan(60_000);
});


test('connections list only the retained Codex runtime', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Connections' }).click();
  await expect(page.getByRole('heading', { name: 'Connections' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Codex', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OpenCode' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Cloud' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Antigravity' })).toHaveCount(0);
  const codex = page.locator('.provider-card', { hasText: 'Codex' });
  await codex.getByRole('button', { name: 'Manage' }).click();
  await expect(codex.getByRole('button', { name: 'Check connection' })).toBeVisible();
});
