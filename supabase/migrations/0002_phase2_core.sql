-- Caloria Fácil AI — Phase 2: profiles, preferences, goals, foods, meals, weight, entitlements.
--
-- Security model
--   * Every table has Row Level Security enabled.
--   * Policies only target the `authenticated` role and always compare against auth.uid(),
--     so each user can only read and write their own rows.
--   * Columns that must never be changed by the client (ids, email, calculated values,
--     entitlements) are protected with column-level grants, triggers or the absence of policies.
--   * Pro entitlements can only be written by the service role (future payment webhook).

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------------------------
-- profiles (created in 0001) — align with Phase 2 shape
-- ---------------------------------------------------------------------------------------------
alter table public.profiles rename column locale to language;
alter table public.profiles
  add column if not exists email text,
  add column if not exists country text,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  add constraint profiles_language_check check (language in ('en-US', 'pt-BR', 'es')),
  add constraint profiles_country_check check (country is null or country ~ '^[A-Z]{2}$'),
  add constraint profiles_display_name_check
    check (display_name is null or char_length(display_name) between 1 and 80);

update public.profiles p set email = u.email from auth.users u where u.id = p.id;

-- ---------------------------------------------------------------------------------------------
-- user_preferences
-- ---------------------------------------------------------------------------------------------
create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  unit_system text not null default 'metric' check (unit_system in ('metric', 'imperial')),
  notification_preferences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(notification_preferences) = 'object'),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- health_profiles — answers from the onboarding questionnaire (sensitive: owner-only access)
-- ---------------------------------------------------------------------------------------------
create table public.health_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  goal text check (goal in ('lose', 'maintain', 'gain')),
  sex text check (sex in ('female', 'male')),
  birth_year integer check (birth_year between 1900 and 2100),
  height_cm numeric(5, 1) check (height_cm between 50 and 272),
  activity_level text
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- nutrition_goals
-- ---------------------------------------------------------------------------------------------
create table public.nutrition_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- 1200 kcal is the floor commonly used to avoid dangerously restrictive targets.
  daily_calorie_target integer not null check (daily_calorie_target between 1200 and 10000),
  protein_target numeric(6, 1) check (protein_target between 0 and 1000),
  carb_target numeric(6, 1) check (carb_target between 0 and 2000),
  fat_target numeric(6, 1) check (fat_target between 0 and 1000),
  source text not null default 'manual' check (source in ('estimate', 'manual')),
  updated_at timestamptz not null default now()
);

-- Carry over Phase 1 columns, then drop them from profiles.
insert into public.user_preferences (user_id, unit_system)
  select id, unit_system from public.profiles
  on conflict (user_id) do nothing;
insert into public.nutrition_goals (user_id, daily_calorie_target)
  select id, daily_calorie_goal from public.profiles
  where daily_calorie_goal between 1200 and 10000
  on conflict (user_id) do nothing;
alter table public.profiles drop column unit_system, drop column daily_calorie_goal;

-- ---------------------------------------------------------------------------------------------
-- foods — shared catalogue (USDA / Open Food Facts imports) + private user-created foods
-- Nutrient columns are nullable on purpose: unknown values are stored as NULL, never guessed.
-- ---------------------------------------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  brand text check (brand is null or char_length(brand) <= 120),
  barcode text check (barcode is null or barcode ~ '^[0-9]{6,14}$'),
  calories_per_100g numeric(6, 1) not null check (calories_per_100g between 0 and 900),
  protein_per_100g numeric(5, 1) check (protein_per_100g between 0 and 100),
  carbs_per_100g numeric(5, 1) check (carbs_per_100g between 0 and 100),
  fat_per_100g numeric(5, 1) check (fat_per_100g between 0 and 100),
  source text not null default 'user' check (source in ('user', 'usda', 'open_food_facts')),
  source_id text,
  created_by uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- User foods are private to their creator; catalogue foods have no owner.
  constraint foods_owner_matches_source check ((source = 'user') = (created_by is not null)),
  constraint foods_macros_fit_100g
    check (coalesce(protein_per_100g, 0) + coalesce(carbs_per_100g, 0) + coalesce(fat_per_100g, 0) <= 100.5)
);

create unique index foods_source_source_id_key on public.foods (source, source_id)
  where source_id is not null;
create index foods_barcode_idx on public.foods (barcode) where barcode is not null;
create index foods_created_by_idx on public.foods (created_by) where created_by is not null;
create index foods_name_trgm_idx on public.foods using gin (name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------------------------
-- meal_entries / meal_items
-- ---------------------------------------------------------------------------------------------
create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  consumed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index meal_entries_user_consumed_idx on public.meal_entries (user_id, consumed_at desc);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_entry_id uuid not null references public.meal_entries (id) on delete cascade,
  -- A food used in a diary cannot be deleted on its own. Checked at commit (deferred) so that
  -- account deletion, which cascades through foods and meals in one statement, succeeds.
  food_id uuid not null references public.foods (id) deferrable initially deferred,
  quantity_grams numeric(7, 1) not null check (quantity_grams > 0 and quantity_grams <= 5000),
  -- Filled by trigger from the food and quantity; clients cannot write them.
  calculated_calories numeric(8, 1) not null default 0,
  calculated_protein numeric(7, 1),
  calculated_carbs numeric(7, 1),
  calculated_fat numeric(7, 1),
  created_at timestamptz not null default now()
);
create index meal_items_entry_idx on public.meal_items (meal_entry_id);
create index meal_items_food_idx on public.meal_items (food_id);

-- value_per_100g × grams / 100, rounded to one decimal. NULL stays NULL (unknown, not zero).
create or replace function public.nutrient_for_quantity(per_100g numeric, grams numeric)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case when per_100g is null or grams is null then null
              else round(per_100g * grams / 100.0, 1) end;
$$;

-- Runs as the calling user, so a food that is not visible to them (another user's private
-- food) is "not found" and the insert fails.
create or replace function public.meal_items_calculate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  f record;
begin
  select calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
    into f from public.foods where id = new.food_id;
  if not found then
    raise exception 'food % not found', new.food_id using errcode = 'foreign_key_violation';
  end if;
  new.calculated_calories := public.nutrient_for_quantity(f.calories_per_100g, new.quantity_grams);
  new.calculated_protein := public.nutrient_for_quantity(f.protein_per_100g, new.quantity_grams);
  new.calculated_carbs := public.nutrient_for_quantity(f.carbs_per_100g, new.quantity_grams);
  new.calculated_fat := public.nutrient_for_quantity(f.fat_per_100g, new.quantity_grams);
  return new;
end;
$$;

create trigger meal_items_calculate
  before insert or update on public.meal_items
  for each row execute function public.meal_items_calculate();

-- ---------------------------------------------------------------------------------------------
-- favourite meals
-- ---------------------------------------------------------------------------------------------
create table public.favorite_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz not null default now()
);
create index favorite_meals_user_idx on public.favorite_meals (user_id);

create table public.favorite_meal_items (
  id uuid primary key default gen_random_uuid(),
  favorite_meal_id uuid not null references public.favorite_meals (id) on delete cascade,
  food_id uuid not null references public.foods (id) deferrable initially deferred,
  quantity_grams numeric(7, 1) not null check (quantity_grams > 0 and quantity_grams <= 5000)
);
create index favorite_meal_items_favorite_idx on public.favorite_meal_items (favorite_meal_id);
create index favorite_meal_items_food_idx on public.favorite_meal_items (food_id);

-- ---------------------------------------------------------------------------------------------
-- weight_logs
-- ---------------------------------------------------------------------------------------------
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weight_kg numeric(5, 2) not null check (weight_kg between 20 and 500),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index weight_logs_user_recorded_idx on public.weight_logs (user_id, recorded_at desc);

-- ---------------------------------------------------------------------------------------------
-- user_entitlements — written ONLY by the service role (store/RevenueCat webhook, Phase 3).
-- Clients can read their own rows but there are no insert/update/delete policies.
-- ---------------------------------------------------------------------------------------------
create table public.user_entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement text not null check (entitlement in ('pro')),
  expires_at timestamptz,
  source text not null check (source in ('app_store', 'play_store', 'revenuecat', 'manual_grant')),
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement)
);

create or replace function public.has_pro_access()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_entitlements
    where user_id = (select auth.uid())
      and entitlement = 'pro'
      and (expires_at is null or expires_at > now())
  );
$$;

-- ---------------------------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------------------------
create trigger user_preferences_touch_updated_at before update on public.user_preferences
  for each row execute function public.touch_updated_at();
create trigger health_profiles_touch_updated_at before update on public.health_profiles
  for each row execute function public.touch_updated_at();
create trigger nutrition_goals_touch_updated_at before update on public.nutrition_goals
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Sign-up / email change hooks on auth.users
-- ---------------------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_language text := new.raw_user_meta_data ->> 'language';
begin
  insert into public.profiles (id, display_name, email, language)
  values (
    new.id,
    nullif(left(btrim(new.raw_user_meta_data ->> 'display_name'), 80), ''),
    new.email,
    case when requested_language in ('en-US', 'pt-BR', 'es') then requested_language else 'en-US' end
  );
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute procedure public.handle_user_email_change();

-- ---------------------------------------------------------------------------------------------
-- Account deletion: removes the auth user; every personal row cascades.
-- ---------------------------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------------------------
alter table public.user_preferences enable row level security;
alter table public.health_profiles enable row level security;
alter table public.nutrition_goals enable row level security;
alter table public.foods enable row level security;
alter table public.meal_entries enable row level security;
alter table public.meal_items enable row level security;
alter table public.favorite_meals enable row level security;
alter table public.favorite_meal_items enable row level security;
alter table public.weight_logs enable row level security;
alter table public.user_entitlements enable row level security;

-- profiles: read/update own row; only some columns are client-writable.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, language, country, onboarding_completed_at)
  on public.profiles to authenticated;

-- Owner-only tables keyed by user_id.
create policy user_preferences_own on public.user_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy health_profiles_own on public.health_profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy nutrition_goals_own on public.nutrition_goals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy weight_logs_own on public.weight_logs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy favorite_meals_own on public.favorite_meals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy favorite_meal_items_own on public.favorite_meal_items for all to authenticated
  using (exists (select 1 from public.favorite_meals f
                 where f.id = favorite_meal_id and f.user_id = (select auth.uid())))
  with check (exists (select 1 from public.favorite_meals f
                      where f.id = favorite_meal_id and f.user_id = (select auth.uid())));

-- foods: everyone signed in reads the catalogue; user foods are private to their creator.
create policy foods_select on public.foods for select to authenticated
  using (created_by is null or created_by = (select auth.uid()));
create policy foods_insert_own on public.foods for insert to authenticated
  with check (source = 'user' and created_by = (select auth.uid()));
create policy foods_update_own on public.foods for update to authenticated
  using (created_by = (select auth.uid()))
  with check (source = 'user' and created_by = (select auth.uid()));
create policy foods_delete_own on public.foods for delete to authenticated
  using (created_by = (select auth.uid()));

-- meal_entries: Free plan sees the last 7 days; Pro (server-validated entitlement) sees all.
create policy meal_entries_select on public.meal_entries for select to authenticated
  using (user_id = (select auth.uid())
         and (consumed_at >= now() - interval '7 days' or (select public.has_pro_access())));
create policy meal_entries_insert on public.meal_entries for insert to authenticated
  with check (user_id = (select auth.uid())
              and consumed_at <= now() + interval '1 day'
              and (consumed_at >= now() - interval '7 days' or (select public.has_pro_access())));
create policy meal_entries_update on public.meal_entries for update to authenticated
  using (user_id = (select auth.uid())
         and (consumed_at >= now() - interval '7 days' or (select public.has_pro_access())))
  with check (user_id = (select auth.uid())
              and consumed_at <= now() + interval '1 day'
              and (consumed_at >= now() - interval '7 days' or (select public.has_pro_access())));
create policy meal_entries_delete on public.meal_entries for delete to authenticated
  using (user_id = (select auth.uid())
         and (consumed_at >= now() - interval '7 days' or (select public.has_pro_access())));

-- meal_items: allowed when the parent entry is visible to (and owned by) the user.
create policy meal_items_own on public.meal_items for all to authenticated
  using (exists (select 1 from public.meal_entries e
                 where e.id = meal_entry_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.meal_entries e
                      where e.id = meal_entry_id and e.user_id = (select auth.uid())));
-- Calculated columns are owned by the trigger.
revoke insert, update on public.meal_items from anon, authenticated;
grant insert (meal_entry_id, food_id, quantity_grams) on public.meal_items to authenticated;
grant update (quantity_grams) on public.meal_items to authenticated;

-- entitlements: read-only for the owner.
create policy user_entitlements_select_own on public.user_entitlements for select to authenticated
  using (user_id = (select auth.uid()));
revoke insert, update, delete on public.user_entitlements from anon, authenticated;

-- anon never needs these tables.
revoke all on public.user_preferences, public.health_profiles, public.nutrition_goals,
  public.foods, public.meal_entries, public.meal_items, public.favorite_meals,
  public.favorite_meal_items, public.weight_logs, public.user_entitlements from anon;
