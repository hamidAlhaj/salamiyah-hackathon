const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

/**
 * Exact sum of API money strings ("1234.50") using integer cents, so platform totals never pick up
 * floating-point drift. Returns a 2-decimal string.
 */
export function sumMoney(values: string[]): string {
  let cents = ZERO;
  for (const value of values) {
    const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
    if (!match) continue;
    const [, sign, whole, frac = ''] = match;
    const v = BigInt(whole) * HUNDRED + BigInt(frac.padEnd(2, '0'));
    cents += sign ? -v : v;
  }
  const negative = cents < ZERO;
  const abs = negative ? -cents : cents;
  return `${negative ? '-' : ''}${abs / HUNDRED}.${String(abs % HUNDRED).padStart(2, '0')}`;
}
