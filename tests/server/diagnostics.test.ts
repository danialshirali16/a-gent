import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { startServer } from '../../server/index.js';
import { redact } from '../../server/diagnostics.js';

const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });

test('diagnostic redaction removes credential shapes and bounds text', () => {
  assert.equal(redact('Authorization: Bearer abc123'), 'Authorization: Bearer [redacted]');
  assert.ok(!redact('token=supersecret').includes('supersecret'));
  assert.ok(!redact('{"apiKey":"sk-1234567890abcdef"}').includes('sk-1234567890abcdef'));
  assert.ok(!redact('agt_1234567890abcdef_secret').includes('1234567890abcdef'));
  assert.ok(!redact('password: hunter2').includes('hunter2'));
  assert.equal(redact('ordinary provider text'), 'ordinary provider text');
  assert.ok(redact('x'.repeat(1000), 20).endsWith('…'));
  assert.equal(redact('x'.repeat(1000), 20).length, 21);
});

test('API errors expose a request id in the header and body without leaking secrets', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-diagnostics-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  try {
    const unauthorized = await fetch(`${handle.url}/api/bootstrap`, { headers: { 'X-Request-Id': 'req-auth-test' } });
    assert.equal(unauthorized.status, 401);
    assert.equal(unauthorized.headers.get('x-request-id'), 'req-auth-test');
    assert.equal((await unauthorized.json() as any).requestId, 'req-auth-test');

    const invalid = await fetch(`${handle.url}/api/agents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json', 'X-Request-Id': 'req-validation-test' },
      body: JSON.stringify({ name: '' }),
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.headers.get('x-request-id'), 'req-validation-test');
    const body = await invalid.json() as any;
    assert.equal(body.requestId, 'req-validation-test');
    assert.ok(!String(body.error).includes(handle.token));
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});
