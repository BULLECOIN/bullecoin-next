# BULLE V45 launch countdown

Official launch time: Monday, August 10, 2026 at 6:00 PM in Monterrey (UTC-6).

UTC value used by the website: `2026-08-11T00:00:00Z`.

## Vercel variables before launch

```text
NEXT_PUBLIC_LAUNCH_MODE=countdown
NEXT_PUBLIC_LAUNCH_AT_UTC=2026-08-11T00:00:00Z
NEXT_PUBLIC_BULLE_MIGRATION_STATUS=prelaunch
BULLE_MIGRATION_STATUS=prelaunch
REWARD_PAYOUTS_ENABLED=false
```

Redeploy after saving them. The countdown does not block News, Bull Hub, Tokenomics, wallet connection, or Bear Smash. It automatically disappears at zero and changes to LAUNCH UPDATE IN PROGRESS until V2 is activated; it never labels the old CA as V2.

## Remove the countdown early

Set `NEXT_PUBLIC_LAUNCH_MODE=live` and redeploy.

## Activate V2

Do not change to V2 until the new public CA is confirmed. Then replace the public and server mint variables following `RUN-V44-MIGRATION-READY.md`. Keep rewards disabled until the V2 payout wallet is funded and a low-value redemption test succeeds.
