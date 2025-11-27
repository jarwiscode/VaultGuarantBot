import { Pool } from "pg";
import { config } from "./config";

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function initDb() {
  await pool.query(`
    create table if not exists users (
      id serial primary key,
      telegram_id bigint not null unique,
      username text,
      first_name text,
      last_name text,
      language varchar(2) default 'ru',
      loyalty_points integer not null default 0,
      is_admin boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists wallets (
      id serial primary key,
      user_id integer not null references users(id),
      currency varchar(16) not null default 'USDT',
      available_balance numeric(20,8) not null default 0,
      locked_balance numeric(20,8) not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(user_id, currency)
    );

    do $$
    begin
      if not exists (select 1 from pg_type where typname = 'deal_status') then
        create type deal_status as enum (
          'pending',
          'accepted',
          'rejected',
          'funded',
          'completed',
          'cancelled',
          'dispute'
        );
      end if;
    end$$;

    create table if not exists deals (
      id serial primary key,
      code varchar(16) not null unique,
      buyer_id integer not null references users(id),
      seller_id integer not null references users(id),
      initiator_id integer not null references users(id),
      amount numeric(20,8) not null,
      currency varchar(16) not null default 'USDT',
      status deal_status not null default 'pending',
      title text,
      description text,
      commission_percent numeric(5,2) not null default 1.0,
      commission_amount numeric(20,8) not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      dispute_reason text,
      dispute_resolved_by integer references users(id),
      dispute_resolution text
    );

    create table if not exists transactions (
      id serial primary key,
      wallet_id integer not null references wallets(id),
      deal_id integer references deals(id),
      type varchar(32) not null,
      amount numeric(20,8) not null,
      balance_after numeric(20,8) not null,
      meta jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists loyalty_rewards (
      id serial primary key,
      user_id integer not null references users(id),
      deal_id integer references deals(id),
      points integer not null,
      reason varchar(32) not null,
      created_at timestamptz not null default now()
    );

    create table if not exists loyalty_redemptions (
      id serial primary key,
      user_id integer not null references users(id),
      points_used integer not null,
      perk_type varchar(32) not null,
      perk_payload jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists app_config (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    );
  `);
}

