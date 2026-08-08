# BULLECOIN PRELAUNCH HUB

## Current countdown configuration

Use these Vercel variables while the official token is waiting for launch:

```env
NEXT_PUBLIC_LAUNCH_MODE=countdown
NEXT_PUBLIC_LAUNCH_AT_UTC=2026-08-11T00:00:00Z
NEXT_PUBLIC_BULLE_MIGRATION_STATUS=prelaunch
BULLE_MIGRATION_STATUS=prelaunch
REWARD_PAYOUTS_ENABLED=false
```

This keeps the website, Bear Smash and the Solana/Jupiter market explorer available, while hiding the official BULLE contract, price data and buy actions.

## At launch

After the new token exists, replace the placeholders with the new official values:

```env
NEXT_PUBLIC_LAUNCH_MODE=live
NEXT_PUBLIC_BULLE_MIGRATION_STATUS=live
BULLE_MIGRATION_STATUS=live
NEXT_PUBLIC_BULLE_TOKEN_ADDRESS=NEW_OFFICIAL_CA
BULLE_TOKEN_MINT=NEW_OFFICIAL_CA
NEXT_PUBLIC_BULLE_PUMP_URL=NEW_OFFICIAL_PUMP_URL
REWARD_PAYOUTS_ENABLED=false
```

Redeploy after saving the variables. Verify the new CA, Bull Hub chart and Jupiter swap target before announcing the launch. Keep automatic rewards disabled until the new reward treasury has been funded and tested.

## Local verification

```bash
npm install
npm run build
```

