import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, mkdir, access, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const output = new URL('../electron/assets/', import.meta.url);
await mkdir(output, { recursive: true });
const png = size => new Resvg(source, { font: { loadSystemFonts: false }, fitTo: { mode: 'width', value: size } }).render().asPng();
await writeFile(new URL('icon.png', output), png(1024));

const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = sizes.map(size => png(size));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i += 1) {
  const entry = 6 + i * 16;
  header[entry] = sizes[i] === 256 ? 0 : sizes[i];
  header[entry + 1] = header[entry];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
}
await writeFile(new URL('icon.ico', output), Buffer.concat([header, ...images]));

if (process.platform === 'darwin') {
  const iconset = new URL('icon.iconset/', output);
  await mkdir(iconset, { recursive: true });
  for (const size of [16, 32, 128, 256, 512]) {
    await writeFile(new URL(`icon_${size}x${size}.png`, iconset), png(size));
    await writeFile(new URL(`icon_${size}x${size}@2x.png`, iconset), png(size * 2));
  }
  const result = spawnSync('/usr/bin/iconutil', ['-c', 'icns', '-o', fileURLToPath(new URL('icon.icns', output)), fileURLToPath(iconset)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Could not create the macOS icon.');
  await rm(iconset, { recursive: true });
}

const android = new URL('../android/app/src/main/res/', import.meta.url);
try {
  await access(android);
  const foreground = source.replace('viewBox="0 0 128 128"', 'viewBox="-32 -32 192 192"');
  for (const [density, size, foregroundSize] of [
    ['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216], ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432],
  ]) {
    const directory = new URL(`mipmap-${density}/`, android);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('ic_launcher.png', directory), png(size));
    await writeFile(new URL('ic_launcher_round.png', directory), png(size));
    await writeFile(new URL('ic_launcher_foreground.png', directory), new Resvg(foreground, { font: { loadSystemFonts: false }, fitTo: { mode: 'width', value: foregroundSize } }).render().asPng());
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
