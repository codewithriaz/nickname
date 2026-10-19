/**
 * Country-aware payment gateway registry (isomorphic — safe for client).
 * A seller picks a country; only gateways available there can be enabled.
 * Server adapters live in src/server/payments/adapters (one file per gateway).
 */

export type CountryCode = "BD" | "IN" | "PK" | "AE" | "MY" | "SG" | "GB" | "US" | "CA" | "AU" | "EU" | "OTHER";

export const COUNTRIES: { code: CountryCode; name: string; currency: string; flag: string }[] = [
  { code: "BD", name: "Bangladesh", currency: "BDT", flag: "🇧🇩" },
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", currency: "PKR", flag: "🇵🇰" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", flag: "🇦🇪" },
  { code: "MY", name: "Malaysia", currency: "MYR", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", currency: "SGD", flag: "🇸🇬" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺" },
  { code: "EU", name: "Europe (Euro)", currency: "EUR", flag: "🇪🇺" },
  { code: "OTHER", name: "Other / International", currency: "USD", flag: "🌍" },
];

export const CURRENCIES = ["BDT", "INR", "PKR", "AED", "MYR", "SGD", "GBP", "USD", "CAD", "AUD", "EUR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const GATEWAY_KEYS = ["bkash", "nagad", "sslcommerz", "razorpay", "paypal", "stripe", "twocheckout"] as const;
export type GatewayKey = (typeof GATEWAY_KEYS)[number];

export type GatewayField = { key: string; label: string; secret?: boolean; multiline?: boolean; placeholder?: string };

export type GatewayDef = {
  key: GatewayKey;
  name: string;
  description: string;
  /** "*" = available worldwide */
  countries: CountryCode[] | "*";
  /** "*" = any currency in CURRENCIES */
  currencies: readonly CurrencyCode[] | "*";
  fields: GatewayField[];
  docsUrl: string;
  /** shown on checkout */
  checkoutLabel: string;
  checkoutHint: string;
  /** brand color for the checkout badge */
  color: string;
};

export const GATEWAYS: GatewayDef[] = [
  {
    key: "bkash",
    name: "bKash",
    description: "bKash Tokenized Checkout (merchant account)",
    countries: ["BD"],
    currencies: ["BDT"],
    fields: [
      { key: "appKey", label: "App key" },
      { key: "appSecret", label: "App secret", secret: true },
      { key: "username", label: "Username" },
      { key: "password", label: "Password", secret: true },
    ],
    docsUrl: "https://developer.bka.sh",
    checkoutLabel: "bKash",
    checkoutHint: "Pay instantly with your bKash account",
    color: "#e2136e",
  },
  {
    key: "nagad",
    name: "Nagad",
    description: "Nagad Online Payment Gateway (merchant account)",
    countries: ["BD"],
    currencies: ["BDT"],
    fields: [
      { key: "merchantId", label: "Merchant ID" },
      { key: "merchantNumber", label: "Merchant number (optional)", placeholder: "01XXXXXXXXX" },
      { key: "merchantPrivateKey", label: "Merchant private key", secret: true, multiline: true },
      { key: "nagadPublicKey", label: "Nagad public key", multiline: true },
    ],
    docsUrl: "https://nagad.com.bd/merchant",
    checkoutLabel: "Nagad",
    checkoutHint: "Pay with your Nagad account",
    color: "#ec1c24",
  },
  {
    key: "sslcommerz",
    name: "SSLCommerz",
    description: "Cards, mobile banking & net banking in Bangladesh",
    countries: ["BD"],
    currencies: ["BDT", "USD", "EUR", "GBP", "INR", "SGD", "MYR", "AUD", "CAD"],
    fields: [
      { key: "storeId", label: "Store ID" },
      { key: "storePassword", label: "Store password", secret: true },
    ],
    docsUrl: "https://developer.sslcommerz.com",
    checkoutLabel: "Card / Mobile banking",
    checkoutHint: "Visa, Mastercard, bKash, Nagad, Rocket via SSLCommerz",
    color: "#2563eb",
  },
  {
    key: "razorpay",
    name: "Razorpay",
    description: "UPI, cards, net banking & wallets in India",
    countries: ["IN"],
    currencies: ["INR", "USD", "EUR", "GBP", "AED", "SGD", "MYR", "AUD", "CAD"],
    fields: [
      { key: "keyId", label: "Key ID", placeholder: "rzp_live_…" },
      { key: "keySecret", label: "Key secret", secret: true },
    ],
    docsUrl: "https://razorpay.com/docs/payments/payment-links/apis/",
    checkoutLabel: "UPI / Cards (Razorpay)",
    checkoutHint: "UPI, cards, net banking, wallets",
    color: "#0c2451",
  },
  {
    key: "paypal",
    name: "PayPal",
    description: "PayPal & cards worldwide",
    countries: "*",
    currencies: ["USD", "EUR", "GBP", "CAD", "AUD", "SGD", "MYR"],
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client secret", secret: true },
    ],
    docsUrl: "https://developer.paypal.com/docs/api/orders/v2/",
    checkoutLabel: "PayPal",
    checkoutHint: "Pay with PayPal or card",
    color: "#003087",
  },
  {
    key: "stripe",
    name: "Stripe",
    description: "Cards, Apple Pay & Google Pay worldwide",
    countries: "*",
    currencies: "*",
    fields: [{ key: "secretKey", label: "Secret key", secret: true, placeholder: "sk_live_… or sk_test_…" }],
    docsUrl: "https://docs.stripe.com/api/checkout/sessions",
    checkoutLabel: "Card (Stripe)",
    checkoutHint: "Visa, Mastercard, Amex, Apple Pay, Google Pay",
    color: "#635bff",
  },
  {
    key: "twocheckout",
    name: "2Checkout (Verifone)",
    description: "Global cards & PayPal via 2Checkout hosted checkout",
    countries: "*",
    currencies: ["USD", "EUR", "GBP", "CAD", "AUD", "AED", "INR", "SGD", "MYR"],
    fields: [
      { key: "merchantCode", label: "Merchant code" },
      { key: "secretKey", label: "Secret key (API)", secret: true },
      { key: "buyLinkSecret", label: "Buy-link secret word", secret: true },
    ],
    docsUrl: "https://verifone.cloud/docs/2checkout",
    checkoutLabel: "Card (2Checkout)",
    checkoutHint: "Cards & PayPal via 2Checkout",
    color: "#1f2937",
  },
];

export const gatewayDef = (key: string) => GATEWAYS.find((g) => g.key === key);

export const countryDef = (code: string) => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[COUNTRIES.length - 1];

export const gatewaysForCountry = (country: string) =>
  GATEWAYS.filter((g) => g.countries === "*" || (g.countries as string[]).includes(country));

export const gatewaySupportsCurrency = (g: GatewayDef, currency: string) =>
  g.currencies === "*" || (g.currencies as readonly string[]).includes(currency);

/** Manual "send money" methods that make sense per country. */
export type ManualProvider = "bkash" | "nagad" | "rocket" | "upi" | "bank";
export const MANUAL_PROVIDERS: Record<ManualProvider, { label: string; countries: CountryCode[] | "*"; placeholder: string }> = {
  bkash: { label: "bKash (Send Money)", countries: ["BD"], placeholder: "01XXXXXXXXX" },
  nagad: { label: "Nagad (Send Money)", countries: ["BD"], placeholder: "01XXXXXXXXX" },
  rocket: { label: "Rocket (Send Money)", countries: ["BD"], placeholder: "01XXXXXXXXX-X" },
  upi: { label: "UPI", countries: ["IN"], placeholder: "yourname@okbank" },
  bank: { label: "Bank transfer", countries: "*", placeholder: "Bank, account name & number" },
};
export const manualProvidersForCountry = (country: string) =>
  (Object.keys(MANUAL_PROVIDERS) as ManualProvider[]).filter((k) => {
    const c = MANUAL_PROVIDERS[k].countries;
    return c === "*" || (c as string[]).includes(country);
  });

/** Human label for an order's payment method (COD / manual / gateway name). */
export function paymentMethodLabel(method: string, gateway?: string | null) {
  if (method === "COD") return "Cash on Delivery";
  if (method === "MANUAL") return "Manual payment";
  return gatewayDef(gateway ?? "")?.name ?? "Online";
}
