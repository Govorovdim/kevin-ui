/**
 * Format a number as a currency string.
 *
 * @param n        The numeric value.
 * @param currency ISO 4217 currency code (default "USD").
 * @param compact  Use compact notation (e.g. "$1.2K") when true.
 */
export function formatCurrency(
  n: number,
  currency: string = "USD",
  opts?: { compact?: boolean; decimals?: boolean },
): string {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
  };

  if (opts?.compact) {
    options.notation = "compact";
    options.maximumFractionDigits = opts?.decimals === false ? 0 : 1;
  } else if (opts?.decimals === false) {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }

  return new Intl.NumberFormat("en-US", options).format(n);
}
