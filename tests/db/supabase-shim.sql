-- Minimal stand-in for the parts of Supabase that the migrations rely on, so they can be
-- tested in plain Postgres (PGlite). NOT used in production.
create schema if not exists auth;
create schema if not exists extensions;

create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

-- Supabase reads the user id from the JWT; here it comes from a session setting.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public, auth, extensions to anon, authenticated, service_role;

-- Supabase grants table privileges to API roles by default; RLS does the filtering.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
