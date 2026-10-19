# Referral program & affiliate links

**Status:** ✅ Done (2026-10-20)

## Referral (users earn by inviting others)
- Each user has `referralCode`; link `/register?ref=CODE` (any `?ref=` URL sets cookie `nk_ref` for 30 days).
- When a referred user's payment becomes PAID (not ADMIN-granted), `creditReferral()` creates a
  `ReferralEarning` = `referralPercent`% (platform setting, default 20%) → status APPROVED. Refund → REJECTED.
- User requests payout (bKash/Nagad/Rocket/bank) when balance ≥ `referralMinPayout` (default ৳500);
  approved earnings are attached to the `Payout`. Admin marks PAID / REJECTED in `/admin/payouts`.
- Files: `src/server/services/referral.service.ts`, `/api/referrals`, `/api/referrals/payout`,
  `src/features/billing/components/referrals-view.tsx`, admin `PayoutsAdminView`.

## Affiliate links (users promote other products)
- **AFFILIATE block**: link with disclosure label (default "Affiliate link"), optional coupon code and network; `rel="sponsored"`.
- **Affiliate products** in the shop (`ProductType.AFFILIATE`) → "Buy on partner site" button to `affiliateUrl`.
- Clicks tracked like any link (analytics + `Block.clicks`).

## Known issues / TODO
- Referral earnings are auto-approved; add a holding period if refunds become common.
