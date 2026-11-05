/** React-free catalog of the bot-avatars shapes supported by A Gent. */
import type { Run } from './types';

export const agentAvatarTypes = [
  'clover', 'flower', 'triangle', 'square', 'blob', 'ghost',
  'circle', 'drop', 'star', 'droid', 'mech', 'alien',
  'hexagon', 'cat', 'cloud', 'pill', 'pebble', 'puddle',
] as const;

export type AgentAvatarType = typeof agentAvatarTypes[number];
export type AgentAvatarState = 'default' | 'working' | 'sleeping';

export const agentAvatarLabels: Record<AgentAvatarType, string> = {
  clover: 'Clover',
  flower: 'Flower',
  triangle: 'Triangle',
  square: 'Square',
  blob: 'Blob',
  ghost: 'Ghost',
  circle: 'Circle',
  drop: 'Drop',
  star: 'Star',
  droid: 'Droid',
  mech: 'Mech',
  alien: 'Alien',
  hexagon: 'Hexagon',
  cat: 'Cat',
  cloud: 'Cloud',
  pill: 'Pill',
  pebble: 'Pebble',
  puddle: 'Puddle',
};

export const legacyAvatarTypeByIcon: Record<string, AgentAvatarType> = {
  spark: 'star',
  code: 'mech',
  design: 'flower',
  search: 'clover',
  custom: 'droid',
};

const avatarTypeSet = new Set<string>(agentAvatarTypes);

export function isAgentAvatarType(value: unknown): value is AgentAvatarType {
  return typeof value === 'string' && avatarTypeSet.has(value);
}

/** Explicit saved shape first; otherwise the deterministic legacy icon mapping. */
export function resolveAgentAvatarType(icon: string | undefined, avatarType: unknown): AgentAvatarType {
  if (isAgentAvatarType(avatarType)) return avatarType;
  return (icon && legacyAvatarTypeByIcon[icon]) || 'droid';
}

/** Only active runs change an avatar's pose; finished runs return agents to idle. */
export function avatarActivityForRuns(runs: Run[]): Map<string, AgentAvatarState> {
  const latest = new Map<string, Run>();
  for (const run of runs) {
    const previous = latest.get(run.agentId);
    if (!previous || run.startedAt > previous.startedAt) latest.set(run.agentId, run);
  }
  const states = new Map<string, AgentAvatarState>();
  for (const [agentId, run] of latest) {
    if (run.status === 'running') states.set(agentId, 'working');
    else if (run.status === 'waiting') states.set(agentId, 'default');
  }
  return states;
}
