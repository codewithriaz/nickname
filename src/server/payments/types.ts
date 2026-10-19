export type PaymentKind = "order" | "billing";

export type GatewayCustomer = {
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
};

export type InitPaymentParams = {
  kind: PaymentKind;
  transactionId: string;
  /** minor units */
  amount: number;
  currency: string;
  customer: GatewayCustomer;
  productName: string;
  /**
   * Shop orders: generic callback base (`/api/payments/gateway/<key>/callback?tran=…`).
   * Adapters append `&status=success|fail|cancel` where the gateway needs separate URLs.
   */
  callbackBase?: string;
  clientIp?: string;
};

export type InitPaymentResult = { redirectUrl: string; gatewayRef?: string };

export type VerifiedPayment = {
  ok: boolean;
  transactionId: string;
  /** minor units as reported by the gateway */
  amount: number;
  gatewayRef: string | null;
  raw: Record<string, unknown>;
};

/** Uniform interface every online gateway implements (src/server/payments/adapters). */
export type GatewayAdapter = {
  init(creds: Record<string, string>, p: InitPaymentParams & { callbackBase: string }, sandbox: boolean): Promise<InitPaymentResult>;
  /** `params` = callback query + form fields. Must call the gateway's API to confirm — never trust params alone. */
  verify(
    creds: Record<string, string>,
    params: Record<string, string>,
    ctx: { sandbox: boolean; transactionId: string; gatewayRef: string | null; currency: string },
  ): Promise<VerifiedPayment>;
};

export const withStatus = (base: string, status: string) => `${base}${base.includes("?") ? "&" : "?"}status=${status}`;

export type SslCommerzCredentials = { storeId: string; storePassword: string; sandbox: boolean };
export type BkashCredentials = { appKey: string; appSecret: string; username: string; password: string; sandbox: boolean };

export const toMajorString = (minor: number) => (minor / 100).toFixed(2);
export const majorToMinor = (major: string | number) => Math.round(Number(major) * 100);
