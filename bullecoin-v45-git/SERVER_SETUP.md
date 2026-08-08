# BULLE v8 — Global Leaderboard + Server Validation

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/runner.sql`.
3. Install dependencies:

```bash
npm install @supabase/supabase-js tweetnacl bs58
```

4. Add to `.env.local` and Vercel Environment Variables:

```text
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
```

Never expose the service-role key with `NEXT_PUBLIC_`.

5. Replace `app`, `components`, `lib`, `public`, and `tsconfig.json`.
6. Run `rm -rf .next && npm run build && npm run dev`.

Security included: wallet signature, expiring nonce, one-time run token, deterministic server replay, duration/score/collision validation, 30 runs per wallet/hour, weekly global leaderboard. Keep manual review of the Top 5 before real payouts.

Manual Bear Smash rewards: run `supabase/rewards.sql`. Set `SOLANA_RPC_URL` in Vercel for reliable mainnet balance checks; public Solana RPC is the fallback. Payouts remain manual. Never store the reward wallet seed phrase or private key in the site.

V40 automatic rewards use the separate limited payout wallet documented in `RUN-V40-AUTOMATIC-REWARDS.txt`. Run `supabase/rewards-v40.sql`, configure the payout signer as a Vercel Sensitive variable, and deploy first with `REWARD_PAYOUTS_ENABLED=false`.
