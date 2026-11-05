#!/usr/bin/env node
/**
 * Verify the FND-002 runtime baseline against the checked-in fixtures.
 *
 * Usage:
 *   node scripts/runtime-baseline.mjs
 *   node scripts/runtime-baseline.mjs --json
 *   node scripts/runtime-baseline.mjs --strict
 *
 * Optional environment:
 *   CODEX_BIN=codex
 *   OPENCODE_BIN=opencode
 *   OPENCODE_URL=http://127.0.0.1:4096
 *
 * The script never authenticates, sends a model prompt, or mutates provider
 * configuration. It reads versions, generates the Codex schema into a
 * temporary directory, and (when a server is reachable) reads OpenCode's
 * OpenAPI document.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = join(root, 'tests', 'fixtures', 'runtime-baselines');
const args = new Set(process.argv.slice(2));
const jsonOnly = args.has('--json');
const strict = args.has('--strict');

function quote(value) {
  return /[\s"]/u.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

function run(command, commandArgs) {
  return execSync([command, ...commandArgs].map(quote).join(' '), {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function readJson(path) {
  return JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/u, ''));
}

function requestMethods(schema) {
  const methods = [];
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if (value.properties?.method?.enum?.length === 1) methods.push(value.properties.method.enum[0]);
    for (const child of Object.values(value)) walk(child);
  };
  walk(schema);
  return [...new Set(methods)].sort();
}

function operationList(openapi) {
  const operations = [];
  for (const [path, item] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(item ?? {})) {
      if (operation && typeof operation === 'object' && operation.operationId) {
        operations.push(`${method.toUpperCase()} ${path}`);
      }
    }
  }
  return operations;
}

async function probeOpenCode() {
  const url = (process.env.OPENCODE_URL || 'http://127.0.0.1:4096').replace(/\/$/u, '');
  try {
    const response = await fetch(`${url}/openapi.json`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return { url, reachable: false, error: `HTTP ${response.status}` };
    const openapi = await response.json();
    const operations = operationList(openapi);
    return {
      url,
      reachable: true,
      openapi: openapi.openapi,
      pathCount: Object.keys(openapi.paths ?? {}).length,
      operationCount: operations.length,
      sha256: sha256(Buffer.from(JSON.stringify(openapi))),
      sample: operations.filter(value => /\/api\/(session|event|permission|form|mcp|model|skill)/u.test(value)).slice(0, 12),
    };
  } catch (error) {
    return { url, reachable: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function diff(expected, actual) {
  return Object.entries(expected).filter(([key, value]) => actual[key] !== value).map(([key, value]) => ({ key, expected: value, actual: actual[key] }));
}

async function main() {
  const packageJson = await readJson(join(root, 'package.json'));
  const lock = await readJson(join(root, 'package-lock.json'));
  const codexFixture = await readJson(join(fixtureRoot, 'codex-0.166.0', 'manifest.json'));
  const opencodeFixture = await readJson(join(fixtureRoot, 'opencode-2.2.5', 'manifest.json'));
  const report = {
    capturedAt: new Date().toISOString(),
    host: { platform: process.platform, arch: process.arch, node: process.version },
    expected: {
      package: packageJson.version,
      electron: lock.packages?.['node_modules/electron']?.version,
      codex: codexFixture.version,
      opencode: opencodeFixture.version,
      engines: packageJson.engines,
    },
    codex: {},
    opencode: {},
    checks: [],
  };

  const codexBin = process.env.CODEX_BIN || 'codex';
  const opencodeBin = process.env.OPENCODE_BIN || 'opencode';
  try {
    report.codex.installed = run(codexBin, ['--version']).replace(/^codex-cli\s+/u, '');
  } catch (error) {
    report.codex.error = error instanceof Error ? error.message : String(error);
  }
  try {
    report.opencode.installed = run(opencodeBin, ['--version']).replace(/^opencode\s+v?/u, '');
  } catch (error) {
    report.opencode.error = error instanceof Error ? error.message : String(error);
  }

  let temporary;
  try {
    if (report.codex.installed) {
      temporary = await mkdtemp(join(tmpdir(), 'agent-runtime-baseline-'));
      run(codexBin, ['app-server', 'generate-json-schema', '--out', temporary]);
      const clientRequest = await readJson(join(temporary, 'ClientRequest.json'));
      const serverRequest = await readJson(join(temporary, 'ServerRequest.json'));
      report.codex.clientMethodCount = requestMethods(clientRequest).length;
      report.codex.serverRequestMethodCount = requestMethods(serverRequest).length;
      report.codex.expectedClientMethodCount = codexFixture.clientMethodCount;
      report.codex.expectedServerRequestMethodCount = codexFixture.serverRequestMethodCount;
      report.codex.methodsPresent = Object.fromEntries([
        ...codexFixture.usedClientMethods,
        ...codexFixture.usedServerRequestMethods,
      ].map(method => [method, requestMethods(clientRequest).includes(method) || requestMethods(serverRequest).includes(method)]));
      const modelList = await readJson(join(temporary, 'v2', 'ModelListResponse.json'));
      report.codex.modelReasoningFields = ['defaultReasoningEffort', 'supportedReasoningEfforts']
        .every(field => JSON.stringify(modelList).includes(field));

      const hashes = {};
      for (const [relative, expected] of Object.entries(codexFixture.schemaHashes)) {
        try {
          hashes[relative] = { expected, actual: sha256(await readFile(join(temporary, relative))) };
        } catch {
          hashes[relative] = { expected, actual: null };
        }
      }
      report.codex.schemaDrift = Object.entries(hashes).filter(([, value]) => value.actual !== value.expected).map(([file, value]) => ({ file, ...value }));
      report.codex.checkedFiles = Object.keys(hashes).length;
    }
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
  }

  report.opencode.fixture = {
    version: opencodeFixture.version,
    openapi: opencodeFixture.openapi,
    pathCount: opencodeFixture.pathCount,
    operationCount: opencodeFixture.operationCount,
    sha256: opencodeFixture.sha256,
  };
  report.opencode.probe = await probeOpenCode();

  report.checks.push({
    name: 'Codex version matches fixture',
    pass: report.codex.installed === codexFixture.version,
    expected: codexFixture.version,
    actual: report.codex.installed ?? report.codex.error,
  });
  report.checks.push({
    name: 'Codex required methods present',
    pass: Object.values(report.codex.methodsPresent ?? {}).every(Boolean),
    expected: 'all used client and server-request methods',
    actual: report.codex.methodsPresent,
  });
  report.checks.push({
    name: 'Codex model reasoning metadata present',
    pass: report.codex.modelReasoningFields === true,
    expected: true,
    actual: report.codex.modelReasoningFields,
  });
  report.checks.push({
    name: 'Codex selected schema files match fixture',
    pass: (report.codex.schemaDrift ?? []).length === 0,
    expected: '0 changed selected files',
    actual: report.codex.schemaDrift,
  });
  report.checks.push({
    name: 'OpenCode version matches fixture',
    pass: report.opencode.installed === opencodeFixture.version,
    expected: opencodeFixture.version,
    actual: report.opencode.installed ?? report.opencode.error,
  });
  if (report.opencode.probe.reachable) {
    report.checks.push({
      name: 'OpenCode OpenAPI shape matches fixture counts',
      pass: report.opencode.probe.pathCount === opencodeFixture.pathCount && report.opencode.probe.operationCount === opencodeFixture.operationCount,
      expected: `${opencodeFixture.pathCount} paths / ${opencodeFixture.operationCount} operations`,
      actual: `${report.opencode.probe.pathCount} paths / ${report.opencode.probe.operationCount} operations`,
    });
  }

  const failures = report.checks.filter(check => !check.pass);
  report.result = failures.length === 0 ? 'pass' : 'drift';
  report.failures = failures;

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`A Gent runtime baseline — ${report.result}`);
    console.log(`Host: ${report.host.platform}/${report.host.arch}, Node ${report.host.node}`);
    console.log(`Expected: Electron ${report.expected.electron}, Codex ${report.expected.codex}, OpenCode ${report.expected.opencode}`);
    console.log(`Installed: Codex ${report.codex.installed ?? 'missing'}, OpenCode ${report.opencode.installed ?? 'missing'}`);
    if (report.codex.clientMethodCount) {
      console.log(`Codex schema: ${report.codex.clientMethodCount} client methods, ${report.codex.serverRequestMethodCount} server requests, ${report.codex.checkedFiles} fixture files checked`);
    }
    for (const check of report.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`);
    if (report.opencode.probe.reachable) {
      console.log(`OpenCode OpenAPI: ${report.opencode.probe.openapi}, ${report.opencode.probe.pathCount} paths, ${report.opencode.probe.operationCount} operations`);
    } else {
      console.log(`OpenCode OpenAPI: not probed (${report.opencode.probe.error})`);
    }
    if (failures.length) console.log(`\n${failures.length} drift check(s) failed. Inspect the JSON report with --json.`);
  }

  if (strict && failures.length) process.exitCode = 1;
}

await main();
