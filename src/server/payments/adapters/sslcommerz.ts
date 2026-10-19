import "server-only";
import { sslcommerzInit, sslcommerzValidate } from "../sslcommerz";
import type { GatewayAdapter } from "../types";

const creds = (c: Record<string, string>, sandbox: boolean) => ({ storeId: c.storeId, storePassword: c.storePassword, sandbox });

export const sslcommerzAdapter: GatewayAdapter = {
  init: (c, p, sandbox) => sslcommerzInit(creds(c, sandbox), p),
  async verify(c, params, ctx) {
    const valId = params.val_id;
    if (!valId) return { ok: false, transactionId: ctx.transactionId, amount: 0, gatewayRef: null, raw: params };
    const v = await sslcommerzValidate(creds(c, ctx.sandbox), valId);
    return { ...v, ok: v.ok && v.transactionId === ctx.transactionId };
  },
};
