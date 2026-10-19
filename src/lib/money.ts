/** All money is stored in minor units (paisa / cents). */
const SYMBOLS: Record<string, string> = { BDT: "৳", USD: "$", INR: "₹", EUR: "€", GBP: "£" };

export const toMinor = (major: number) => Math.round(major * 100);
export const toMajor = (minor: number) => minor / 100;

export function formatMoney(minor: number, currency = "BDT", opts: { decimals?: boolean } = {}) {
  const major = toMajor(minor);
  const decimals = opts.decimals ?? !Number.isInteger(major);
  const num = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(major);
  return `${SYMBOLS[currency] ?? `${currency} `}${num}`;
}

export function discountPercent(price: number, comparePrice?: number | null) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}
