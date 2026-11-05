import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';

// The supplied icon is a 1200px transparent PNG. Wrap it in SVG so Resvg can
// rasterize every required size consistently without an extra image library.
const raster = await readFile(new URL('../public/icon-source.png', import.meta.url));
const imageData = raster.toString('base64');
const source = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><image href="data:image/png;base64,${imageData}" width="1200" height="1200"/></svg>`;
const foregroundSource = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="-200 -200 1600 1600"><image href="data:image/png;base64,${imageData}" width="1200" height="1200"/></svg>`;
const render = (svg, size) => new Resvg(svg, { font: { loadSystemFonts: false }, fitTo: { mode: 'width', value: size } }).render().asPng();
const png = size => render(source, size);
const foreground = size => render(foregroundSource, size);

const output = new URL('../electron/assets/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL('icon.png', output), png(1024));
await writeFile(new URL('../public/icon.png', import.meta.url), png(512));

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

// Build a PNG-based ICNS container directly. This avoids requiring macOS
// iconutil and keeps `npm run icons` reproducible on every development host.
const icnsTypes = [
  ['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256],
  ['ic09', 512], ['ic10', 1024], ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512],
];
const chunks = [];
for (const [type, size] of icnsTypes) {
  const data = png(size);
  const chunkHeader = Buffer.alloc(8);
  chunkHeader.write(type, 0, 4, 'ascii');
  chunkHeader.writeUInt32BE(data.length + 8, 4);
  chunks.push(chunkHeader, data);
}
const body = Buffer.concat(chunks);
const icnsHeader = Buffer.alloc(8);
icnsHeader.write('icns', 0, 4, 'ascii');
icnsHeader.writeUInt32BE(body.length + 8, 4);
await writeFile(new URL('icon.icns', output), Buffer.concat([icnsHeader, body]));

const android = new URL('../android/app/src/main/res/', import.meta.url);
try {
  await access(android);
  for (const [density, size, foregroundSize] of [
    ['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216], ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432],
  ]) {
    const directory = new URL(`mipmap-${density}/`, android);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('ic_launcher.png', directory), png(size));
    await writeFile(new URL('ic_launcher_round.png', directory), png(size));
    await writeFile(new URL('ic_launcher_foreground.png', directory), foreground(foregroundSize));
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
