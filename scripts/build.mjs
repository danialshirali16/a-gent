import { build as buildWeb } from 'vite';
import { build as buildServer } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import './icons.mjs';
import { writeThirdPartyNotices } from './notices.mjs';

await buildWeb();
await writeThirdPartyNotices();
await rm('dist-server', { recursive: true, force: true });
await mkdir('dist-server', { recursive: true });
await buildServer({
  entryPoints: ['server/index.ts'],
  outfile: 'dist-server/index.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
