alter table public.reward_claims drop constraint if exists reward_claims_status_check;
alter table public.reward_claims add constraint reward_claims_status_check check(status in ('pending','processing','approved','paid','failed','rejected'));
create index if not exists reward_claims_tx_idx on public.reward_claims(tx_signature) where tx_signature is not null;
