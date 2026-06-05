const SOFASCORE_WIDGET_BASE =
  'https://widgets.sofascore.com/embed/attackMomentum';
const SOFASCORE_MATCH_BASE = 'https://www.sofascore.com/football/match';

export function normalizeSofascoreId(value: unknown): string | null {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) return null;
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const numeric = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return String(numeric);
  }

  return null;
}

export function buildSofascoreAttackMomentumUrl(value: unknown, theme: 'light' | 'dark' = 'light'): string {
  const normalizedId = normalizeSofascoreId(value);
  if (!normalizedId) return '';

  return `${SOFASCORE_WIDGET_BASE}?id=${normalizedId}&widgetTheme=${theme}`;
}

export function buildSofascoreMatchUrl(value: unknown): string {
  const normalizedId = normalizeSofascoreId(value);
  if (!normalizedId) return '';
  return `${SOFASCORE_MATCH_BASE}#id:${normalizedId}`;
}
