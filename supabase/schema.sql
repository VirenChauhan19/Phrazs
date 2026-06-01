-- Phrazs Supabase schema
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.

-- 1) Profiles: one row per user, auto-created when they sign up.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by their owner" on public.profiles;
create policy "Profiles are viewable by their owner"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row from the signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Bookings: each row belongs to the user who booked it.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  listing_id text,
  property text,
  host text,
  start_ts text,
  end_ts text,
  date text,
  end_date text,
  days int default 1,
  hours int default 0,
  crew int default 1,
  total numeric default 0,
  status text default 'Confirmed',
  payment_status text default 'Paid',
  schedule jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Users can read their own bookings" on public.bookings;
create policy "Users can read their own bookings"
  on public.bookings for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own bookings" on public.bookings;
create policy "Users can create their own bookings"
  on public.bookings for insert with check (auth.uid() = user_id);
