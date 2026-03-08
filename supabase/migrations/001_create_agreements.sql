-- agreements テーブル
create table agreements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'revoked', 'withdrawn')),
  content_hash text not null,
  creator_id uuid not null references auth.users(id),
  creator_email text not null,
  target_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- agreement_logs テーブル
create table agreement_logs (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references agreements(id) on delete cascade,
  action_type text not null check (action_type in ('accept', 'reject', 'revoke', 'withdraw')),
  recorded_at timestamptz not null default now(),
  user_agent text,
  actor_id uuid not null references auth.users(id)
);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger agreements_updated_at
  before update on agreements
  for each row
  execute function update_updated_at();

-- RLS有効化
alter table agreements enable row level security;
alter table agreement_logs enable row level security;

-- agreements: SELECT は全員許可（UUIDが秘密鍵）
create policy "agreements_select" on agreements
  for select using (true);

-- agreements: INSERT は認証ユーザーのみ（自分がcreator）
create policy "agreements_insert" on agreements
  for insert with check (auth.uid() = creator_id);

-- agreements: UPDATE は当事者のみ（creator または target_email一致、target_email が null なら認証ユーザー）
create policy "agreements_update" on agreements
  for update using (
    auth.uid() = creator_id
    or (select email from auth.users where id = auth.uid()) = target_email
    or (target_email is null and auth.uid() is not null)
  );

-- agreement_logs: INSERT のみ許可（認証ユーザー）
create policy "agreement_logs_insert" on agreement_logs
  for insert with check (auth.uid() = actor_id);

-- agreement_logs: SELECT は関連する agreement の当事者のみ
create policy "agreement_logs_select" on agreement_logs
  for select using (
    exists (
      select 1 from agreements
      where agreements.id = agreement_logs.agreement_id
    )
  );
