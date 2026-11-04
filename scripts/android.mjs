import { spawn } from 'node:child_process';
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const environment = { ...process.env };
const defaultSdk = process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Android', 'sdk')
  : process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA || os.homedir(), 'Android', 'Sdk')
  : path.join(os.homedir(), 'Android', 'Sdk');

async function exists(path) { try { await access(path, constants.F_OK); return true; } catch { return false; } }
function run(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', env: environment, shell: false });
    child.on('error', reject);
    child.on('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(command + ' failed (' + (signal || code) + ')')));
  });
}
if (!environment.ANDROID_HOME && await exists(defaultSdk)) environment.ANDROID_HOME = defaultSdk;
if (!environment.JAVA_HOME && process.platform === 'darwin') {
  for (const candidate of ['/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home', '/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home']) {
    if (await exists(candidate)) { environment.JAVA_HOME = candidate; break; }
  }
}
if (!await exists('android')) await run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'add', 'android']);
await import('./icons.mjs');
await run(process.execPath, ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android']);
if (process.argv[2] === 'apk') {
  if (environment.ANDROID_HOME) {
    const sdk = environment.ANDROID_HOME.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/ /g, '\\ ');
    await writeFile('android/local.properties', 'sdk.dir=' + sdk + '\n');
  }
  if (process.platform === 'win32') await run('cmd.exe', ['/d', '/c', 'gradlew.bat', 'assembleDebug', '--no-daemon'], process.cwd() + '/android');
  else await run('./gradlew', ['assembleDebug', '--no-daemon'], process.cwd() + '/android');
  await mkdir('release', { recursive: true });
  const version = JSON.parse(await readFile('package.json', 'utf8')).version;
  const destination = `release/A-Gent-${version}-android-debug.apk`;
  await copyFile('android/app/build/outputs/apk/debug/app-debug.apk', destination);
  console.log('Created ' + destination);
}
