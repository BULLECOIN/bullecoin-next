# BULLE V44 — migration-ready release

This build centralizes the official mint for the home page, Bull Hub, Pump.fun link, market APIs, treasury readings, and reward payouts.

## Important safety rule

Do not publish V2 mode until the new token exists and its public CA has been verified. Never send a seed phrase or private key. The website does not need the creator wallet secret.

## Before launch

1. Preserve the final V1 holder snapshot, Solana slot, CSV hash, and exclusion policy.
2. Use the Stage 1 variables in `V44_PRELAUNCH_ENV.txt`.
3. Keep `REWARD_PAYOUTS_ENABLED=false`. Prelaunch mode also locks payouts in the server code.
4. Launch V2 from the intended creator wallet with the planned supply and decimals.
5. Record the new CA and official Pump.fun URL from the confirmed transaction.

## Activate V2

1. Replace `<NEW_CA>` in the Stage 2 values and add them to Vercel for Production, Preview, and Development as required.
2. Redeploy. Public `NEXT_PUBLIC_*` variables are embedded during the build, so saving variables alone is not enough.
3. Confirm the new CA in Home, Bull Hub, Tokenomics, `/api/launch-data`, `/api/token-data`, and the wallet transaction preview.
4. Fund the automatic payout wallet with V2 BULLE plus SOL for fees.
5. Run one low-value redemption test and confirm the V2 mint and recipient on Solscan.
6. Only then set `REWARD_PAYOUTS_ENABLED=true` and redeploy.

## 1:1 holder migration

The migration file should use the final V1 snapshot and preserve token units 1:1. If V1 and V2 decimals or supply differ, stop and recalculate before sending. Exclusions must be documented; do not remove a holder merely because the wallet belongs to a former collaborator if the tokens were legitimately owned.

## Rollback

Set both migration status variables to `prelaunch`, set `REWARD_PAYOUTS_ENABLED=false`, restore the V1 CA values, and redeploy. This immediately prevents automatic rewards while the issue is reviewed.
