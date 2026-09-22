-- Enable RLS and add policies for profiles table
alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- Allow public read of profiles (needed for displaying names etc)
create policy "Profiles are publicly readable"
  on profiles for select using (true);
