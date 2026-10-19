import "server-only";
import { bkashCreate, bkashExecute } from "../bkash";
import type { GatewayAdapter } from "../types";

const creds = (c: Record<string, string>, sandbox: boolean) => ({
  appKey: c.appKey,
  appSecret: c.appSecret,
  username: c.username,
  password: c.password,
  sandbox,
});

export const bkashAdapter: GatewayAdapter = {
  init: (c, p, sandbox) => bkashCreate(creds(c, sandbox), p),
  async verify(c, params, ctx) {
    const paymentId = params.paymentID;
    if (!paymentId || params.status !== "success") return { ok: false, transactionId: ctx.transactionId, amount: 0, gatewayRef: null, raw: params };
    const v = await bkashExecute(creds(c, ctx.sandbox), paymentId);
    return { ...v, ok: v.ok && (!v.transactionId || v.transactionId === ctx.transactionId), transactionId: ctx.transactionId };
  },
};
