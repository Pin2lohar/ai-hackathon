/**
 * Format a major-unit amount for display (e.g. dollars not cents).
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
): string {
  const code = currencyCode.trim() || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}
