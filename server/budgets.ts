/**
 * Shared timeout budgets for host, provider, interaction, stream, and shutdown
 * work. Adapters may use a narrower budget, but they should start here rather
 * than inventing local numbers.
 */
export const BUDGETS = {
  startup: 30_000,
  catalog: 15_000,
  auth: 20_000,
  tool: 60_000,
  interaction: 5 * 60_000,
  session: 120_000,
  stream: 15 * 60_000,
  shutdown: 6_000,
  terminationGrace: 2_000,
  terminationKill: 3_500,
  interrupt: 10_000,
  heartbeat: 15_000,
  maxResponseBytes: 8 * 1024 * 1024,
  sseBufferBytes: 2 * 1024 * 1024,
} as const;

export type BudgetName = keyof typeof BUDGETS;

export function budgetSignal(name: BudgetName, timeoutMs = BUDGETS[name]): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export function combineBudget(name: BudgetName, parent?: AbortSignal, timeoutMs = BUDGETS[name]): AbortSignal {
  const timeout = budgetSignal(name, timeoutMs);
  return parent ? AbortSignal.any([parent, timeout]) : timeout;
}

/**
 * Run one operation under a budget and always clear the timer. The caller's
 * abort signal remains authoritative; the timeout only adds a bound.
 */
export async function withBudget<T>(
  name: BudgetName,
  operation: (signal: AbortSignal) => Promise<T>,
  options: { parent?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`${name} budget exceeded.`)), options.timeoutMs ?? BUDGETS[name]);
  const signal = options.parent ? AbortSignal.any([options.parent, controller.signal]) : controller.signal;
  try {
    return await operation(signal);
  } finally {
    clearTimeout(timeout);
  }
}
