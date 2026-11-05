const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/(authorization\s*:\s*bearer\s+)[^\s,;]+/gi, '$1[redacted]'],
  [/\b(?:sk|agt|reason|ghp|github_pat|glpat)-?[A-Za-z0-9_-]{8,}\b/g, '[redacted]'],
  [/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|secret|cookie)\s*["']?\s*[:=]\s*["']?)[^"'\s,;}]+/gi, '$1[redacted]'],
  [/(["'](?:apiKey|api_key|accessToken|refreshToken|token|password|secret|authorization|cookie)["']\s*:\s*["'])[^"']*/gi, '$1[redacted]'],
];

/** Redact common credential shapes and bound diagnostic text before it reaches a log or API response. */
export function redact(value: unknown, max = 2000): string {
  let text = typeof value === 'string' ? value : value instanceof Error ? value.message : String(value ?? '');
  for (const [pattern, replacement] of SECRET_PATTERNS) text = text.replace(pattern, replacement);
  if (text.length > max) text = `${text.slice(0, max)}…`;
  return text;
}

export function requestIdFrom(value: unknown): string | undefined {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,100}$/.test(value) ? value : undefined;
}
