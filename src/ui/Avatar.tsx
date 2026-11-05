import { createContext, memo, useContext, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from 'react';
import type { BotAvatarProps } from 'bot-avatars';
import type { Agent, Run } from '../../shared/types';
import { agentAvatarLabels, avatarActivityForRuns, resolveAgentAvatarType, type AgentAvatarState, type AgentAvatarType } from '../../shared/agentAvatars';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'working' | 'ready' | 'offline';
export type AvatarMotion = 'full' | 'static';

const sizes: Record<AvatarSize, number> = { xs: 18, sm: 24, md: 28, lg: 40, xl: 52 };
const EMPTY_RUNS: Run[] = [];
const EMPTY_ACTIVITY = new Map<string, AgentAvatarState>();
const STATIC_POSE = { yaw: 0.28, pitch: -0.03 };

interface AvatarRuntimeValue {
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  activity: ReadonlyMap<string, AgentAvatarState>;
}

const AvatarRuntimeContext = createContext<AvatarRuntimeValue>({ theme: 'dark', reducedMotion: false, activity: EMPTY_ACTIVITY });
export const useAvatarRuntime = () => useContext(AvatarRuntimeContext);

/** Live theme, reduced-motion, and run activity for every bot avatar. */
export function AvatarRuntimeProvider({ runs = EMPTY_RUNS, children }: { runs?: Run[]; children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  const [reducedMotion, setReducedMotion] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const readTheme = () => setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(media.matches);
    media.addEventListener('change', onMotion);
    return () => { observer.disconnect(); media.removeEventListener('change', onMotion); };
  }, []);

  const activity = useMemo(() => avatarActivityForRuns(runs), [runs]);

  const value = useMemo(() => ({ theme, reducedMotion, activity }), [theme, reducedMotion, activity]);
  return <AvatarRuntimeContext.Provider value={value}>{children}</AvatarRuntimeContext.Provider>;
}

export function AgentMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="11" fill="currentColor"/><path d="m10.5 29 8.2-17.3a1.5 1.5 0 0 1 2.7 0L29.5 29M14 23h12" stroke="var(--logo-ink, #211912)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="30" cy="10" r="2" fill="var(--logo-ink, #211912)"/></svg>;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return ((hash >>> 0) % 1000) / 1000;
}

type BotRenderer = ForwardRefExoticComponent<BotAvatarProps & RefAttributes<HTMLCanvasElement>>;

let rendererPromise: Promise<BotRenderer> | null = null;
function loadRenderer() {
  rendererPromise ??= import('bot-avatars')
    .then(module => module.BotAvatar)
    .catch(reason => { rendererPromise = null; throw reason; });
  return rendererPromise;
}

function AvatarFallback({ color, size }: { color: string; size: number }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return <svg className="ui-agent-avatar-fallback" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <radialGradient id={`bot-body-${id}`} cx="36%" cy="24%" r="82%">
        <stop offset="0%" stopColor={`color-mix(in srgb, ${color} 55%, white)`} />
        <stop offset="58%" stopColor={color} />
        <stop offset="100%" stopColor={`color-mix(in srgb, ${color} 72%, black)`} />
      </radialGradient>
    </defs>
    <ellipse cx="32" cy="56" rx="17" ry="3.4" fill="#000" opacity=".18" />
    <path d="M32 7c10.8 0 18.7 7.6 18.7 19.4v11.2c0 9.4-7.9 16.2-18.7 16.2s-18.7-6.8-18.7-16.2V26.4C13.3 14.6 21.2 7 32 7Z" fill={`url(#bot-body-${id})`} stroke="color-mix(in srgb, #000 14%, transparent)" strokeWidth=".7" />
    <ellipse cx="24.2" cy="31.4" rx="2.2" ry="3" fill="#171717" />
    <ellipse cx="39.8" cy="31.4" rx="2.2" ry="3" fill="#171717" />
    <circle cx="24.9" cy="30.2" r=".7" fill="#fff" opacity=".85" />
    <circle cx="40.5" cy="30.2" r=".7" fill="#fff" opacity=".85" />
  </svg>;
}

type AvatarAgent = Pick<Agent, 'color' | 'icon'> & {
  id?: string;
  name?: string;
  avatarType?: AgentAvatarType;
  archived?: boolean;
};

export interface AvatarProps {
  agent: AvatarAgent;
  size?: AvatarSize | number;
  variant?: 'solid' | 'soft';
  status?: AvatarStatus;
  className?: string;
  label?: string;
  state?: AgentAvatarState;
  motion?: AvatarMotion;
}

interface CanvasProps {
  shape: AgentAvatarType;
  color: string;
  size: number;
  state: AgentAvatarState;
  seed: number;
  theme: 'light' | 'dark';
  paused: boolean;
  interactive: boolean;
  staticPose: boolean;
  onReady: () => void;
}

const AvatarCanvas = memo(function AvatarCanvas({ shape, color, size, state, seed, theme, paused, interactive, staticPose, onReady }: CanvasProps) {
  const [Renderer, setRenderer] = useState<BotRenderer | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ready = useRef(onReady);
  ready.current = onReady;

  useEffect(() => {
    let active = true;
    loadRenderer().then(renderer => { if (active) setRenderer(() => renderer); }).catch(() => { /* the SVG fallback remains */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!Renderer) return;
    let active = true;
    let attempts = 0;
    const check = () => {
      if (!active || !canvas.current) return;
      if (Number.parseFloat(getComputedStyle(canvas.current).opacity) >= 0.99) {
        active = false;
        ready.current();
        return;
      }
      if (++attempts >= 50) { active = false; return; }
      timer = setTimeout(check, 100);
    };
    let timer = setTimeout(check, 60);
    return () => { active = false; clearTimeout(timer); };
  }, [Renderer]);

  if (!Renderer) return null;
  return <Renderer
    ref={canvas}
    type={shape}
    color={color}
    brightness={1}
    saturation={1}
    shading="plastic"
    state={state}
    size={size}
    seed={seed}
    theme={theme}
    paused={paused}
    interactive={interactive}
    pose={staticPose ? STATIC_POSE : undefined}
    className="ui-agent-avatar-canvas"
    aria-hidden="true"
  />;
}, (previous, next) => previous.shape === next.shape && previous.color === next.color && previous.size === next.size && previous.state === next.state && previous.seed === next.seed && previous.theme === next.theme && previous.paused === next.paused && previous.interactive === next.interactive && previous.staticPose === next.staticPose);

export const Avatar = memo(function Avatar({ agent, size = 'md', status, className = '', label, state, motion = 'full' }: AvatarProps) {
  const runtime = useAvatarRuntime();
  const pixels = typeof size === 'number' ? size : sizes[size];
  const shape = resolveAgentAvatarType(agent.icon, agent.avatarType);
  const activeState = agent.id ? runtime.activity.get(agent.id) : undefined;
  const resolvedState: AgentAvatarState = state ?? activeState ?? (agent.archived ? 'sleeping' : 'default');
  const seed = useMemo(() => hashSeed(agent.id || agent.name || 'agent'), [agent.id, agent.name]);
  const host = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(motion === 'static');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (near || motion === 'static') return;
    const node = host.current;
    if (!node) return;
    if (typeof IntersectionObserver !== 'function') { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '240px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [motion, near]);

  const paused = motion === 'static' || runtime.reducedMotion;
  const style = { width: pixels, height: pixels } as CSSProperties;
  return <span
    ref={host}
    className={`ui-agent-avatar ${status ? 'has-status' : ''} ${className}`.trim()}
    style={style}
    role={label ? 'img' : undefined}
    aria-label={label}
    data-avatar-type={shape}
    data-avatar-state={resolvedState}
    data-avatar-motion={paused ? 'static' : 'full'}
    data-avatar-shape={agentAvatarLabels[shape]}
  >
    {!ready && <AvatarFallback color={agent.color} size={pixels} />}
    {near && <AvatarCanvas
      shape={shape}
      color={agent.color}
      size={pixels}
      state={resolvedState}
      seed={seed}
      theme={runtime.theme}
      paused={paused}
      interactive={!paused}
      staticPose={motion === 'static'}
      onReady={() => setReady(true)}
    />}
    {status && <span className={`ui-avatar-status is-${status}`} aria-hidden="true" />}
  </span>;
});

/** Compact agent avatar used in navigation, headers, and cards. */
export function AgentGlyph({ agent, size = 24, status, className = '', state, motion = 'full' }: { agent: AvatarAgent; size?: AvatarSize | number; status?: AvatarStatus; className?: string; state?: AgentAvatarState; motion?: AvatarMotion }) {
  return <Avatar agent={agent} size={size} status={status} className={className} state={state} motion={motion} />;
}
