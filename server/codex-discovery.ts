import { access, realpath, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export interface CodexLaunch { command: string; args?: string[]; }

/** Extract the app-server build from its initialize user agent, e.g. `a_gent/0.166.0 (...)`. */
export function parseCodexVersion(userAgent: unknown): string | undefined {
  if (typeof userAgent !== 'string') return undefined;
  const match = /\b(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\b/.exec(userAgent);
  return match?.[1];
}

/**
 * Personal v1 is verified against the 0.166 minor. Patch releases are accepted
 * because the protocol schema remains compatible; pre-releases and other
 * minors are rejected with an actionable message instead of failing later.
 */
export function codexCompatibility(version: string | undefined): { supported: boolean; detail: string } {
  if (!version) return { supported: false, detail: 'Could not determine the Codex CLI version. Reinstall the supported Codex CLI (0.166.x), run codex login, then reconnect.' };
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
  if (!match) return { supported: false, detail: `The installed Codex CLI reports an unreadable version (${version}). Install Codex 0.166.x, then reconnect.` };
  if (match[4]) return { supported: false, detail: `Codex ${version} is a pre-release build. A Gent v1 requires the stable Codex 0.166.x CLI; install a stable release, then reconnect.` };
  if (Number(match[1]) !== 0 || Number(match[2]) !== 166) {
    return { supported: false, detail: `Codex ${version} is not supported by this A Gent release. Install Codex 0.166.x, run codex login, then reconnect.` };
  }
  return { supported: true, detail: `Codex ${version} is compatible with this release.` };
}

export interface CodexDiscoveryOptions {
  platform?: NodeJS.Platform;
  arch?: string;
  home?: string;
  env?: NodeJS.ProcessEnv;
  execPath?: string;
  exists?: (filename: string) => Promise<boolean>;
  canonical?: (filename: string) => Promise<string>;
}

/** Resolve executable and argv separately. A Windows npm .cmd shim is never run through a shell. */
export async function locateCodex(options: CodexDiscoveryOptions = {}): Promise<CodexLaunch> {
  const platform = options.platform ?? process.platform, arch = options.arch ?? process.arch;
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const env = options.env ?? process.env, home = options.home ?? homedir(), node = options.execPath ?? process.execPath;
  const exists = options.exists ?? (async filename => {
    try { await access(filename, platform === 'win32' ? constants.F_OK : constants.X_OK); return (await stat(filename)).isFile(); } catch { return false; }
  });
  const fileExists = options.exists ?? (async filename => { try { return (await stat(filename)).isFile(); } catch { return false; } });
  const canonical = options.canonical ?? (async filename => { try { return await realpath(filename); } catch { return filename; } });
  const target = platform === 'win32' ? arch === 'arm64' ? 'aarch64-pc-windows-msvc' : 'x86_64-pc-windows-msvc' : platform === 'darwin' ? arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin' : arch === 'arm64' ? 'aarch64-unknown-linux-musl' : 'x86_64-unknown-linux-musl';
  const platformPackage = platform === 'win32' ? `codex-win32-${arch}` : platform === 'darwin' ? `codex-darwin-${arch}` : `codex-linux-${arch}`;
  const executable = platform === 'win32' ? 'codex.exe' : 'codex';
  const vendorLaunch = async (packageRoot: string): Promise<CodexLaunch | undefined> => {
    const scopes = [packageRoot, paths.join(paths.dirname(packageRoot), platformPackage)];
    for (const scope of scopes) for (const relative of [['vendor', target, 'bin', executable], ['vendor', target, 'codex', executable]]) {
      const candidate = paths.join(scope, ...relative);
      if (await exists(candidate)) return { command: candidate };
    }
    const entry = paths.join(packageRoot, 'bin', 'codex.js');
    if (await fileExists(entry)) return { command: node, args: [entry] };
    return undefined;
  };
  const resolveCandidate = async (candidate: string): Promise<CodexLaunch | undefined> => {
    if (!await fileExists(candidate)) return undefined;
    const resolved = await canonical(candidate);
    if (/\.cmd$/i.test(candidate)) {
      const directory = paths.dirname(candidate);
      for (const packageRoot of [paths.join(directory, 'node_modules', '@openai', 'codex'), paths.join(paths.dirname(directory), 'node_modules', '@openai', 'codex')]) {
        const launch = await vendorLaunch(packageRoot); if (launch) return launch;
      }
      return undefined;
    }
    if (/\.(?:m?js|cjs)$/i.test(resolved)) {
      const launch = await vendorLaunch(paths.dirname(paths.dirname(resolved)));
      return launch ?? { command: node, args: [resolved] };
    }
    return await exists(candidate) ? { command: candidate } : undefined;
  };
  if (env.AGENT_CODEX_COMMAND) {
    let args: string[] = [];
    if (env.AGENT_CODEX_ARGS) {
      const parsed: unknown = JSON.parse(env.AGENT_CODEX_ARGS);
      if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) throw new Error('AGENT_CODEX_ARGS must be a JSON string array.');
      args = parsed;
    }
    const explicit = env.AGENT_CODEX_COMMAND;
    if (/\.cmd$/i.test(explicit) || /\.(?:m?js|cjs)$/i.test(explicit)) {
      const launch = await resolveCandidate(explicit);
      if (!launch) throw new Error('The selected Codex launcher is incomplete. Set AGENT_CODEX_COMMAND to its native executable or reinstall the official Codex CLI.');
      return { command: launch.command, args: [...(launch.args ?? []), ...args] };
    }
    return { command: explicit, args };
  }
  const directories = [...(env.PATH ?? '').split(platform === 'win32' ? ';' : ':'), paths.join(home, '.local', 'bin'), ...(platform === 'win32' ? [paths.join(env.APPDATA ?? paths.join(home, 'AppData', 'Roaming'), 'npm'), paths.join(env.LOCALAPPDATA ?? paths.join(home, 'AppData', 'Local'), 'Microsoft', 'WinGet', 'Links')] : ['/opt/homebrew/bin', '/usr/local/bin'])].filter(directory => directory && paths.isAbsolute(directory));
  const standalone = paths.join(home, '.codex', 'packages', 'standalone', 'current', 'bin', executable);
  for (const directory of [...new Set(directories)]) for (const name of platform === 'win32' ? ['codex.exe', 'codex.cmd'] : ['codex']) {
    const launch = await resolveCandidate(paths.join(directory, name)); if (launch) return launch;
  }
  for (const candidate of [standalone, ...(platform === 'darwin' ? ['/Applications/Codex.app/Contents/Resources/codex'] : [])]) {
    const launch = await resolveCandidate(candidate); if (launch) return launch;
  }
  throw new Error('Codex CLI was not found in the standard installation locations. Install the official Codex CLI, run codex login, then reconnect. A custom native path can be set with AGENT_CODEX_COMMAND.');
}
