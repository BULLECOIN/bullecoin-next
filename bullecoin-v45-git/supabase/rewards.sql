create table if not exists public.reward_claims(
 id uuid primary key default gen_random_uuid(),
 wallet text not null,
 username text not null,
 reward_points integer not null check(reward_points>0),
 reported_reward_points integer not null,
 requested_usd numeric(12,4) not null,
 requested_bulle numeric(30,9) not null,
 price_usd numeric(30,18) not null,
 pool_wallet text not null,
 total_points integer not null default 0,
 story_games integer not null default 0,
 story_best integer not null default 0,
 status text not null default 'pending' check(status in ('pending','approved','paid','rejected')),
 notes text,
 tx_signature text,
 claim_date date not null default current_date,
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 paid_at timestamptz,
 unique(wallet,claim_date)
);
create index if not exists reward_claims_status_idx on public.reward_claims(status,requested_at);
alter table public.reward_claims enable row level security;
