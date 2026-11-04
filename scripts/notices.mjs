import { readFile, writeFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export async function writeThirdPartyNotices() {
  const args = ['ls', '--omit=dev', '--parseable', '--all'];
  const result = process.env.npm_execpath
    ? spawnSync(process.execPath, [process.env.npm_execpath, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    : process.platform === 'win32'
      ? spawnSync('cmd.exe', ['/d', '/c', 'npm', ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
      : spawnSync('npm', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error('Could not collect dependency notices. Run npm ci before building.');
  const directories = [...new Set(result.stdout.trim().split(/\r?\n/))].filter(directory => path.resolve(directory) !== process.cwd());
  const sections = [];
  for (const directory of directories) {
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
    const names = (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isFile() && /^(licen[sc]e|copying|notice|ofl)([.\-_]|$)/i.test(entry.name))
      .map(entry => entry.name).sort();
    const texts = await Promise.all(names.map(async name => `${name}\n${await readFile(path.join(directory, name), 'utf8')}`));
    sections.push(`${manifest.name}@${manifest.version}\n${texts.join('\n\n') || `License: ${typeof manifest.license === 'string' ? manifest.license : 'See package metadata.'}`}`);
  }
  sections.sort((left, right) => left.localeCompare(right));
  await writeFile('dist/THIRD_PARTY_NOTICES.txt', 'A Gent — third-party software and font notices\n\n' + sections.join('\n\n' + '='.repeat(72) + '\n\n') + '\n');
}
