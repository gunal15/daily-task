-- ============================================================
-- Daily Task Tracker - Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================

create extension if not exists pgcrypto;

-- App users use a simple username + 4 digit PIN flow.
create table if not exists app_users (
  id         uuid primary key default gen_random_uuid(),
  username   text not null unique,
  pin_hash   text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_sessions (
  token_hash text primary key,
  user_id    uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Tasks table
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references app_users(id) on delete cascade,
  title       text not null,
  description text,
  is_active   boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Task completions table (one row per task per day)
create table if not exists task_completions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references app_users(id) on delete cascade,
  task_id         uuid not null references tasks(id) on delete cascade,
  completion_date date not null,
  is_completed    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(task_id, completion_date)
);

-- If you already created the old single-user tables, these make them compatible.
alter table tasks
  add column if not exists user_id uuid references app_users(id) on delete cascade;

alter table task_completions
  add column if not exists user_id uuid references app_users(id) on delete cascade;

-- Indexes for common query patterns
create index if not exists idx_tasks_user_active
  on tasks(user_id, is_active, position, created_at);

create index if not exists idx_completions_user_date
  on task_completions(user_id, completion_date);

create index if not exists idx_completions_task_id
  on task_completions(task_id);

create index if not exists idx_completions_task_date
  on task_completions(task_id, completion_date);

-- Lock direct browser access to tables. The app uses the RPC functions below.
alter table app_users enable row level security;
alter table app_sessions enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;

create or replace function normalize_username(p_username text)
returns text
language sql
immutable
as $$
  select lower(trim(p_username));
$$;

create or replace function session_user_id(p_session_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  select user_id
    into v_user_id
    from app_sessions
   where token_hash = encode(digest(coalesce(p_session_token, ''), 'sha256'), 'hex');

  if v_user_id is null then
    raise exception 'Invalid session';
  end if;

  return v_user_id;
end;
$$;

create or replace function app_register(p_username text, p_pin text)
returns table(user_id uuid, username text, session_token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_username text := normalize_username(p_username);
  v_token text := gen_random_uuid()::text || '-' || gen_random_uuid()::text;
begin
  if length(v_username) < 3 then
    raise exception 'Username must be at least 3 characters';
  end if;

  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must be exactly 4 digits';
  end if;

  insert into app_users (username, pin_hash)
  values (v_username, crypt(p_pin, gen_salt('bf')))
  returning id, app_users.username into user_id, username;

  insert into app_sessions (token_hash, user_id)
  values (encode(digest(v_token, 'sha256'), 'hex'), user_id);

  session_token := v_token;
  return next;
exception
  when unique_violation then
    raise exception 'Username already exists';
end;
$$;

create or replace function app_sign_in(p_username text, p_pin text)
returns table(user_id uuid, username text, session_token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user app_users%rowtype;
  v_token text := gen_random_uuid()::text || '-' || gen_random_uuid()::text;
begin
  select *
    into v_user
    from app_users
   where app_users.username = normalize_username(p_username);

  if v_user.id is null or v_user.pin_hash <> crypt(p_pin, v_user.pin_hash) then
    raise exception 'Invalid username or PIN';
  end if;

  insert into app_sessions (token_hash, user_id)
  values (encode(digest(v_token, 'sha256'), 'hex'), v_user.id);

  user_id := v_user.id;
  username := v_user.username;
  session_token := v_token;
  return next;
end;
$$;

create or replace function app_get_tasks(p_session_token text)
returns setof tasks
language sql
security definer
set search_path = public, extensions
as $$
  select *
    from tasks
   where user_id = session_user_id(p_session_token)
   order by position asc, created_at asc;
$$;

create or replace function app_get_active_tasks(p_session_token text)
returns setof tasks
language sql
security definer
set search_path = public, extensions
as $$
  select *
    from tasks
   where user_id = session_user_id(p_session_token)
     and is_active = true
   order by position asc, created_at asc;
$$;

create or replace function app_create_task(
  p_session_token text,
  p_title text,
  p_description text,
  p_position integer
)
returns tasks
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_task tasks;
begin
  insert into tasks (user_id, title, description, position, is_active)
  values (session_user_id(p_session_token), trim(p_title), p_description, p_position, true)
  returning * into v_task;

  return v_task;
end;
$$;

create or replace function app_update_task(
  p_session_token text,
  p_task_id uuid,
  p_updates jsonb
)
returns tasks
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := session_user_id(p_session_token);
  v_task tasks;
begin
  update tasks
     set title = case when p_updates ? 'title' then trim(p_updates->>'title') else title end,
         description = case when p_updates ? 'description' then p_updates->>'description' else description end,
         position = case when p_updates ? 'position' then (p_updates->>'position')::integer else position end,
         is_active = case when p_updates ? 'is_active' then (p_updates->>'is_active')::boolean else is_active end,
         updated_at = now()
   where id = p_task_id
     and user_id = v_user_id
   returning * into v_task;

  if v_task.id is null then
    raise exception 'Task not found';
  end if;

  return v_task;
end;
$$;

create or replace function app_delete_task(p_session_token text, p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from tasks
   where id = p_task_id
     and user_id = session_user_id(p_session_token);
end;
$$;

create or replace function app_get_completions_for_date(p_session_token text, p_date date)
returns setof task_completions
language sql
security definer
set search_path = public, extensions
as $$
  select *
    from task_completions
   where user_id = session_user_id(p_session_token)
     and completion_date = p_date;
$$;

create or replace function app_get_completions_for_dates(p_session_token text, p_dates date[])
returns setof task_completions
language sql
security definer
set search_path = public, extensions
as $$
  select *
    from task_completions
   where user_id = session_user_id(p_session_token)
     and completion_date = any(p_dates);
$$;

create or replace function app_upsert_completion(
  p_session_token text,
  p_task_id uuid,
  p_date date,
  p_is_completed boolean
)
returns task_completions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := session_user_id(p_session_token);
  v_completion task_completions;
begin
  if not exists (select 1 from tasks where id = p_task_id and user_id = v_user_id) then
    raise exception 'Task not found';
  end if;

  insert into task_completions (user_id, task_id, completion_date, is_completed, updated_at)
  values (v_user_id, p_task_id, p_date, p_is_completed, now())
  on conflict (task_id, completion_date)
  do update set is_completed = excluded.is_completed,
                updated_at = now()
  returning * into v_completion;

  return v_completion;
end;
$$;
