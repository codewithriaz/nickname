# Payments

**Status:** ✅ Done (2026-10-20) — gateway APIs written from docs; **test with sandbox credentials before going live**.

## Country-based gateways (2026-10-20)
Seller picks **country + currency** in Shop → Payments; only gateways available in that country (and supporting the
currency) can be enabled. Registry: `src/config/payment-gateways.ts` (isomorphic). Adapters: `src/server/payments/adapters/*`.

| Gateway | Countries | Currencies | Seller credentials | Flow |
|---|---|---|---|---|
| bKash | 🇧🇩 BD | BDT | app key/secret, username, password | Tokenized checkout → execute |
| Nagad | 🇧🇩 BD | BDT | merchant ID (+number), merchant private key, Nagad public key | RSA-encrypted initialize → complete → verify ⚠️ verify with Nagad docs |
| SSLCommerz | 🇧🇩 BD | BDT, USD, EUR… | store id/password | hosted page → validation API |
| Razorpay | 🇮🇳 IN | INR, USD… | key id/secret | Payment Links → fetch link status |
| PayPal | 🌍 all | USD, EUR, GBP, CAD, AUD, SGD, MYR (not BDT) | client id/secret | Orders v2 → capture |
| Stripe | 🌍 all | any listed | secret key | Checkout Session → retrieve session |
| 2Checkout | 🌍 all | USD, EUR, GBP… | merchant code, API secret, buy-link secret | ConvertPlus buy-link → REST order lookup ⚠️ beta |
| Cash on Delivery | all | any | – | physical products only |
| Manual | per country: BD bKash/Nagad/Rocket · IN UPI · all: bank transfer | any | account numbers | customer enters TrxID/UTR, seller verifies |

Rules: online gateways need the `onlinePayments` plan feature; credentials are AES-256-GCM encrypted per gateway
(`Store.gatewaySecrets` = `{ gatewayKey: { field } }`, legacy flat format auto-migrated on read); empty fields keep the stored value.

## Flow (shop orders)
1. Checkout sends `paymentMethod: ONLINE` + `gateway`. `placeOrder` re-checks availability (`storeGatewayAvailable`), creates the order
   with `transactionId` (`ORD…`) and `Order.gateway`, then `ADAPTERS[key].init()` → redirect URL.
   If init fails the order is cancelled and stock restored.
2. Every gateway returns to **`/api/payments/gateway/{key}/{transactionId}`** (GET or POST; adapters add `status=success|cancel`).
3. `settleOrderGateway` → `adapter.verify()` calls the gateway API (never trusts query params) → checks transaction id, currency,
   amount ≥ total → `completeOrderPayment` (idempotent).
4. Legacy routes `/api/payments/sslcommerz/*` and `/api/payments/bkash/callback` remain for **subscription billing** (platform env credentials)
   and delegate `kind=order` to the generic flow.

## Adding a gateway
1. Add metadata to `GATEWAYS` in `src/config/payment-gateways.ts` (countries, currencies, credential fields, docs URL).
2. Implement `GatewayAdapter { init, verify }` in `src/server/payments/adapters/<key>.ts` and register it in `adapters/index.ts`.
3. Done — settings UI, checkout, footer badges and callbacks pick it up automatically.

## Known issues / TODO
- Only Stripe was hit live in testing (real API reached; fake key correctly rejected → order cancelled). Test every gateway with sandbox credentials before go-live.
- Gateways charge in the shop currency — no FX conversion (e.g. PayPal can't be used with BDT).
- bKash endpoint paths/versions should be re-checked against the latest bKash developer docs at go-live.
- Refunds are recorded manually (no gateway refund API call).
- Platform customer phone for SSLCommerz billing uses a placeholder (users don't store phone numbers yet).
