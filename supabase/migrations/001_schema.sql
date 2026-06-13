-- Every Pet Matters — Supabase schema
-- Run this in the Supabase SQL editor after creating your project.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Trigger function to keep updated_date current
create or replace function set_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

-- Helper macro: add standard columns + trigger to a table
-- (call after each CREATE TABLE)


-- ─────────────────────────────────────────────
-- PROFILES  (extends Supabase auth.users)
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  email         text,
  full_name     text,
  role          text default 'user' check (role in ('admin','user')),
  terms_accepted boolean default false,
  profile_complete boolean default false,
  onboarding_complete boolean default false,
  org_type      text,
  display_name  text,
  bio           text,
  avatar_url    text,
  phone         text,
  city          text,
  state         text,
  website       text,
  created_date  timestamptz default now(),
  updated_date  timestamptz default now()
);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_date();

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────
-- ADOPTABLE PETS
-- ─────────────────────────────────────────────
create table if not exists adoptable_pets (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  pet_type                 text check (pet_type in ('dog','cat','bird','rabbit','other')),
  breed                    text,
  age_years                numeric,
  age_months               numeric,
  gender                   text check (gender in ('male','female','unknown')),
  weight_lbs               numeric,
  color                    text,
  description              text,
  photo_url                text,
  extra_photos             jsonb default '[]',
  rescue_name              text not null,
  rescue_email             text not null,
  rescue_phone             text,
  rescue_website           text,
  rescue_city              text,
  rescue_state             text,
  foster_url               text,
  good_with_kids           boolean,
  good_with_dogs           boolean,
  good_with_cats           boolean,
  energy_level             text check (energy_level in ('low','medium','high')),
  special_needs            boolean default false,
  special_needs_description text,
  adoption_fee             numeric,
  status                   text default 'available' check (status in ('available','pending','adopted')),
  is_urgent                boolean default false,
  urgency_reason           text,
  e_list_date              date,
  created_by               uuid references auth.users,
  created_date             timestamptz default now(),
  updated_date             timestamptz default now()
);
create trigger adoptable_pets_updated before update on adoptable_pets
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- PETS  (synced from external sources)
-- ─────────────────────────────────────────────
create table if not exists pets (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  species             text,
  breed               text,
  age                 text,
  gender              text,
  size                text,
  weight              numeric,
  bio                 text,
  description         text,
  photo_url           text,
  photo_urls          jsonb default '[]',
  photo_focal_points  jsonb default '[]',
  location            text,
  contact_name        text,
  contact_phone       text,
  contact_email       text,
  contact             text,
  source              text not null,
  source_id           text not null,
  url                 text,
  outreach_status     text,
  adoption_status     text check (adoption_status in ('Available','Adopted','Transferred')),
  _lat                numeric,
  _lng                numeric,
  vaccinated          boolean,
  spayed_neutered     boolean,
  dewormed            boolean,
  transfer_needed     boolean,
  rescue_needed       boolean,
  urgent              boolean,
  stipend_available   boolean,
  hidden_from_public  boolean,
  kid_friendly        text check (kid_friendly in ('yes','no','unsure')),
  dog_friendly        text check (dog_friendly in ('yes','no','unsure')),
  cat_friendly        text check (cat_friendly in ('yes','no','unsure')),
  pet_type            text,
  energy_level        text check (energy_level in ('low','medium','high')),
  special_needs       boolean,
  rescue_name         text,
  social_media_graphics jsonb,
  created_by          uuid references auth.users,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now(),
  unique (source, source_id)
);
create trigger pets_updated before update on pets
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- LOST & FOUND PETS
-- ─────────────────────────────────────────────
create table if not exists lost_found_pets (
  id                    uuid primary key default gen_random_uuid(),
  name                  text,
  status                text not null check (status in ('lost','found')),
  species               text not null,
  breed                 text,
  color                 text,
  age                   text,
  gender                text check (gender in ('male','female','unknown')),
  size                  text check (size in ('small','medium','large')),
  description           text,
  photo_urls            jsonb default '[]',
  last_seen_location    text,
  latitude              numeric,
  longitude             numeric,
  last_seen_date        date,
  reporter_name         text not null,
  reporter_email        text not null,
  reporter_phone        text,
  special_characteristics text,
  reward_offered        boolean default false,
  reward_amount         numeric,
  is_resolved           boolean default false,
  resolution_notes      text,
  social_media_graphic  text,
  social_media_caption  text,
  created_by            uuid references auth.users,
  created_date          timestamptz default now(),
  updated_date          timestamptz default now()
);
create trigger lost_found_pets_updated before update on lost_found_pets
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- OWNED PETS
-- ─────────────────────────────────────────────
create table if not exists owned_pets (
  id                  uuid primary key default gen_random_uuid(),
  owner_email         text not null,
  name                text not null,
  pet_type            text check (pet_type in ('dog','cat','bird','rabbit','other')),
  breed               text,
  age_years           numeric,
  age_months          numeric,
  gender              text check (gender in ('male','female','unknown')),
  color               text,
  weight_lbs          numeric,
  bio                 text,
  photo_url           text,
  extra_photos        jsonb default '[]',
  medical_history     text,
  vaccinations        text,
  is_microchipped     boolean,
  microchip_id        text,
  spayed_neutered     boolean,
  allergies           text,
  medications         text,
  behavioral_notes    text,
  good_with_kids      boolean,
  good_with_dogs      boolean,
  good_with_cats      boolean,
  energy_level        text check (energy_level in ('low','medium','high')),
  favorite_toys       text,
  favorite_activities text,
  feeding_schedule    text,
  food_brand          text,
  looking_for_sitter  boolean default false,
  looking_for_trainer boolean default false,
  share_profile       boolean default false,
  vet_name            text,
  vet_phone           text,
  emergency_contact   text,
  created_by          uuid references auth.users,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now()
);
create trigger owned_pets_updated before update on owned_pets
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- ADOPTION APPLICATIONS
-- ─────────────────────────────────────────────
create table if not exists adoption_applications (
  id                   uuid primary key default gen_random_uuid(),
  pet_id               text not null,
  pet_name             text not null,
  rescue_email         text not null,
  applicant_name       text not null,
  applicant_email      text not null,
  applicant_phone      text not null,
  living_situation     text check (living_situation in ('apartment','house','farm_rural')),
  address              text not null,
  own_or_rent          text check (own_or_rent in ('own','rent')),
  landlord_allows_pets boolean,
  other_pets           jsonb default '[]',
  children_ages        jsonb default '[]',
  work_schedule        text,
  pet_experience       text,
  vet_references       jsonb default '[]',
  personal_references  jsonb default '[]',
  adoption_expectations text,
  commitment           text,
  status               text default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  notes                text,
  created_by           uuid references auth.users,
  created_date         timestamptz default now(),
  updated_date         timestamptz default now()
);
create trigger adoption_applications_updated before update on adoption_applications
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- ADOPTION FOLLOW-UPS
-- ─────────────────────────────────────────────
create table if not exists adoption_follow_ups (
  id                       uuid primary key default gen_random_uuid(),
  adoption_application_id  text not null,
  adopter_email            text not null,
  pet_name                 text not null,
  rescue_email             text not null,
  adoption_date            date not null,
  task_type                text check (task_type in ('check_in_call','post_adoption_survey','wellness_check','follow_up_email')),
  scheduled_date           date not null,
  status                   text default 'pending' check (status in ('pending','completed','cancelled')),
  notes                    text,
  completed_date           timestamptz,
  created_by               uuid references auth.users,
  created_date             timestamptz default now(),
  updated_date             timestamptz default now()
);
create trigger adoption_follow_ups_updated before update on adoption_follow_ups
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- ADOPTED PET UPDATES
-- ─────────────────────────────────────────────
create table if not exists adopted_pet_updates (
  id               uuid primary key default gen_random_uuid(),
  adopted_pet_id   text not null,
  adopter_email    text not null,
  rescue_email     text not null,
  pet_name         text not null,
  update_type      text check (update_type in ('milestone','health','behavior','story','photo')),
  title            text not null,
  description      text,
  photo_url        text,
  share_with_rescue boolean default true,
  public           boolean default false,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
create trigger adopted_pet_updates_updated before update on adopted_pet_updates
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- FOSTER APPLICATIONS
-- ─────────────────────────────────────────────
create table if not exists foster_applications (
  id                     uuid primary key default gen_random_uuid(),
  rescue_email           text not null,
  rescue_name            text,
  pet_id                 text,
  pet_name               text,
  applicant_email        text not null,
  applicant_name         text not null,
  applicant_phone        text,
  home_type              text check (home_type in ('house','apartment','condo','other')),
  has_yard               boolean default false,
  has_other_pets         boolean default false,
  other_pets_description text,
  has_children           boolean default false,
  children_ages          text,
  experience_level       text check (experience_level in ('none','some','experienced')),
  can_foster_special_needs boolean default false,
  preferred_pet_types    jsonb default '[]',
  availability_start     date,
  max_duration_weeks     numeric,
  motivation             text,
  status                 text default 'pending' check (status in ('pending','reviewing','approved','declined')),
  rescue_notes           text,
  messages               jsonb default '[]',
  created_by             uuid references auth.users,
  created_date           timestamptz default now(),
  updated_date           timestamptz default now()
);
create trigger foster_applications_updated before update on foster_applications
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- FOSTER TO ADOPT PETS
-- ─────────────────────────────────────────────
create table if not exists foster_to_adopt_pets (
  id                      uuid primary key default gen_random_uuid(),
  pet_id                  text not null,
  pet_name                text not null,
  rescue_email            text not null,
  foster_email            text not null,
  foster_start_date       date not null,
  foster_end_date         date,
  status                  text default 'fostering' check (status in ('fostering','ready_for_adoption','adopted','returned')),
  adoption_application_id text,
  notes                   text,
  is_emergency_foster     boolean default false,
  created_by              uuid references auth.users,
  created_date            timestamptz default now(),
  updated_date            timestamptz default now()
);
create trigger foster_to_adopt_pets_updated before update on foster_to_adopt_pets
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- RESCUES / SHELTERS
-- ─────────────────────────────────────────────
create table if not exists rescues (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique,
  org_type            text default 'rescue' check (org_type in ('rescue','shelter')),
  name                text not null,
  phone               text,
  website             text,
  logo_url            text,
  banner_url          text,
  about               text,
  mission_statement   text,
  services_offered    jsonb default '[]',
  gallery_photos      jsonb default '[]',
  gallery_videos      jsonb default '[]',
  facebook_url        text,
  instagram_url       text,
  twitter_url         text,
  youtube_url         text,
  latitude            numeric,
  longitude           numeric,
  address             text,
  accepts_volunteers  boolean default false,
  volunteer_info      text,
  fosters_needed      boolean default false,
  sponsors            jsonb default '[]',
  foster_network_size numeric,
  transport_available boolean default false,
  shelter_capacity    numeric,
  current_occupancy   numeric,
  intake_types        jsonb default '[]',
  open_hours          text,
  created_by          uuid references auth.users,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now()
);
create trigger rescues_updated before update on rescues
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- RESCUE EVENTS
-- ─────────────────────────────────────────────
create table if not exists rescue_events (
  id                   uuid primary key default gen_random_uuid(),
  rescue_email         text not null,
  title                text not null,
  description          text,
  event_date           date not null,
  event_time           text,
  location             text,
  latitude             numeric,
  longitude            numeric,
  event_type           text check (event_type in ('adoption_event','volunteer_day','fundraiser','education','other')),
  tagged_organizations jsonb default '[]',
  created_by           uuid references auth.users,
  created_date         timestamptz default now(),
  updated_date         timestamptz default now()
);
create trigger rescue_events_updated before update on rescue_events
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- RESCUE REVIEWS
-- ─────────────────────────────────────────────
create table if not exists rescue_reviews (
  id               uuid primary key default gen_random_uuid(),
  rescue_email     text not null,
  reviewer_name    text not null,
  reviewer_email   text not null,
  rating           numeric not null check (rating between 1 and 5),
  title            text,
  comment          text,
  experience_type  text check (experience_type in ('adoption','volunteering','donation','visit','other')),
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
create trigger rescue_reviews_updated before update on rescue_reviews
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- RESCUE API INTEGRATIONS
-- ─────────────────────────────────────────────
create table if not exists rescue_api_integrations (
  id                       uuid primary key default gen_random_uuid(),
  rescue_email             text not null,
  api_provider             text check (api_provider in ('petfinder')),
  api_key                  text not null,
  api_secret               text not null,
  is_active                boolean default true,
  sync_frequency           text default 'on_demand' check (sync_frequency in ('on_demand','hourly','daily')),
  last_sync                timestamptz,
  last_sync_error          text,
  petfinder_organization_id text,
  sync_pets                boolean default true,
  sync_applications        boolean default true,
  created_by               uuid references auth.users,
  created_date             timestamptz default now(),
  updated_date             timestamptz default now()
);
create trigger rescue_api_integrations_updated before update on rescue_api_integrations
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- SHELTER CONNECTIONS
-- ─────────────────────────────────────────────
create table if not exists shelter_connections (
  id                           uuid primary key default gen_random_uuid(),
  shelter_name                 text not null,
  contact_name                 text,
  contact_email                text not null,
  contact_phone                text,
  software_platform            text not null,
  api_key                      text,
  api_secret                   text,
  organization_id              text,
  status                       text,
  last_sync                    text,
  pets_synced                  numeric,
  notes                        text,
  shelterluv_adoptable_statuses jsonb default '["adoption available","available foster"]',
  created_by                   uuid references auth.users,
  created_date                 timestamptz default now(),
  updated_date                 timestamptz default now()
);
create trigger shelter_connections_updated before update on shelter_connections
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- SHELTER DETAILS
-- ─────────────────────────────────────────────
create table if not exists shelter_details (
  id             uuid primary key default gen_random_uuid(),
  shelter_name   text not null,
  website        text,
  phone          text,
  email          text,
  address        text,
  mission        text,
  description    text,
  hours          text,
  logo_url       text,
  banner_url     text,
  animals_accepted text,
  created_by     uuid references auth.users,
  created_date   timestamptz default now(),
  updated_date   timestamptz default now()
);
create trigger shelter_details_updated before update on shelter_details
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- SYNC LOGS
-- ─────────────────────────────────────────────
create table if not exists sync_logs (
  id                   uuid primary key default gen_random_uuid(),
  rescue_email         text not null,
  api_provider         text,
  sync_type            text check (sync_type in ('pets','applications','bidirectional')),
  status               text check (status in ('success','error','partial')),
  pets_synced          numeric default 0,
  applications_synced  numeric default 0,
  error_message        text,
  duration_seconds     numeric,
  details              jsonb,
  created_by           uuid references auth.users,
  created_date         timestamptz default now(),
  updated_date         timestamptz default now()
);
create trigger sync_logs_updated before update on sync_logs
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- VOLUNTEER OPPORTUNITIES
-- ─────────────────────────────────────────────
create table if not exists volunteer_opportunities (
  id              uuid primary key default gen_random_uuid(),
  rescue_email    text not null,
  rescue_name     text not null,
  title           text not null,
  description     text not null,
  category        text check (category in ('animal_care','event_planning','fundraising','social_media','administrative','transportation','foster_care','training','other')),
  location        text not null,
  time_commitment text check (time_commitment in ('flexible','part_time','full_time','one_time_event')),
  start_date      date not null,
  end_date        date,
  skills_required jsonb default '[]',
  spots_available numeric,
  status          text default 'open' check (status in ('open','filled','closed')),
  contact_email   text,
  contact_phone   text,
  created_by      uuid references auth.users,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);
create trigger volunteer_opportunities_updated before update on volunteer_opportunities
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- VOLUNTEER APPLICATIONS
-- ─────────────────────────────────────────────
create table if not exists volunteer_applications (
  id               uuid primary key default gen_random_uuid(),
  opportunity_id   text not null,
  volunteer_email  text not null,
  volunteer_name   text not null,
  volunteer_phone  text,
  rescue_email     text not null,
  opportunity_title text not null,
  cover_letter     text,
  status           text default 'pending' check (status in ('pending','approved','rejected','withdrawn','completed')),
  availability     text,
  response_message text,
  responded_at     timestamptz,
  hours_completed  numeric default 0,
  date_completed   date,
  notes            text,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
create trigger volunteer_applications_updated before update on volunteer_applications
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- VOLUNTEER INTERESTS
-- ─────────────────────────────────────────────
create table if not exists volunteer_interests (
  id               uuid primary key default gen_random_uuid(),
  rescue_email     text not null,
  volunteer_name   text not null,
  volunteer_email  text not null,
  message          text,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
create trigger volunteer_interests_updated before update on volunteer_interests
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- DONATIONS
-- ─────────────────────────────────────────────
create table if not exists donations (
  id                    uuid primary key default gen_random_uuid(),
  donor_name            text not null,
  donor_email           text not null,
  rescue_email          text,
  donation_goal_id      text,
  amount                numeric not null,
  donation_type         text default 'one_time' check (donation_type in ('one_time','monthly','annual')),
  donation_target       text default 'general_fund' check (donation_target in ('general_fund','specific_campaign')),
  status                text default 'pending' check (status in ('pending','completed','failed','cancelled')),
  stripe_payment_id     text,
  stripe_subscription_id text,
  message               text,
  is_anonymous          boolean default false,
  dedication_type       text default 'none' check (dedication_type in ('none','in_honor_of','in_memory_of')),
  dedication_name       text,
  dedication_message    text,
  recipient_email       text,
  completed_date        timestamptz,
  created_by            uuid references auth.users,
  created_date          timestamptz default now(),
  updated_date          timestamptz default now()
);
create trigger donations_updated before update on donations
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- DONATION GOALS
-- ─────────────────────────────────────────────
create table if not exists donation_goals (
  id             uuid primary key default gen_random_uuid(),
  rescue_email   text not null,
  title          text not null,
  description    text,
  target_amount  numeric not null,
  current_amount numeric default 0,
  deadline       date,
  is_active      boolean default true,
  image_url      text,
  created_by     uuid references auth.users,
  created_date   timestamptz default now(),
  updated_date   timestamptz default now()
);
create trigger donation_goals_updated before update on donation_goals
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────────
create table if not exists posts (
  id                   uuid primary key default gen_random_uuid(),
  author_email         text not null,
  author_name          text not null,
  content              text not null,
  photo_url            text,
  post_type            text default 'story' check (post_type in ('story','photo','event')),
  event_title          text,
  event_date           date,
  event_time           text,
  event_location       text,
  rsvp_emails          jsonb default '[]',
  likes                jsonb default '[]',
  pet_name             text,
  pet_profile_id       text,
  pet_type             text,
  tagged_organizations jsonb default '[]',
  created_by           uuid references auth.users,
  created_date         timestamptz default now(),
  updated_date         timestamptz default now()
);
create trigger posts_updated before update on posts
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────
create table if not exists comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           text not null,
  parent_comment_id text,
  author_email      text not null,
  author_name       text not null,
  content           text not null,
  mentioned_emails  jsonb default '[]',
  created_by        uuid references auth.users,
  created_date      timestamptz default now(),
  updated_date      timestamptz default now()
);
create trigger comments_updated before update on comments
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- SERVICES
-- ─────────────────────────────────────────────
create table if not exists services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text check (category in ('veterinarian','groomer','trainer','pet_sitter','pet_store','pet_friendly_business','other')),
  description      text,
  address          text not null,
  city             text,
  state            text,
  zip              text,
  phone            text,
  email            text,
  website          text,
  photo_url        text,
  hours            text,
  accepts_bookings boolean default false,
  booking_url      text,
  pet_types_served jsonb default '[]',
  added_by_email   text,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
create trigger services_updated before update on services
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- SERVICE REVIEWS
-- ─────────────────────────────────────────────
create table if not exists service_reviews (
  id               uuid primary key default gen_random_uuid(),
  service_id       text not null,
  reviewer_email   text not null,
  reviewer_name    text not null,
  rating           numeric not null check (rating between 1 and 5),
  comment          text,
  would_recommend  boolean default true,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
create trigger service_reviews_updated before update on service_reviews
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- RESOURCES
-- ─────────────────────────────────────────────
create table if not exists resources (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  category           text check (category in ('article','organization','social_group')),
  content            text,
  summary            text,
  tags               jsonb default '[]',
  photo_url          text,
  author_name        text,
  location           text default 'everywhere' check (location in ('everywhere','local')),
  local_city         text,
  local_state        text,
  org_name           text,
  org_address        text,
  org_city           text,
  org_state          text,
  org_phone          text,
  org_website        text,
  org_services       jsonb default '[]',
  latitude           numeric,
  longitude          numeric,
  group_platform     text check (group_platform in ('facebook','nextdoor','reddit','discord','slack','other')),
  group_url          text,
  group_member_count numeric,
  is_published       boolean default true,
  status             text default 'pending' check (status in ('pending','approved','denied')),
  submitted_by_email text,
  submitted_by_name  text,
  denial_reason      text,
  approved_by_email  text,
  approved_at        timestamptz,
  created_by         uuid references auth.users,
  created_date       timestamptz default now(),
  updated_date       timestamptz default now()
);
create trigger resources_updated before update on resources
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- ALERTS
-- ─────────────────────────────────────────────
create table if not exists alerts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  pet_type      text default 'any' check (pet_type in ('any','dog','cat','bird','rabbit','other')),
  status_filter text default 'lost' check (status_filter in ('lost','found_no_issues','found_injured','trapping_help')),
  breed         text,
  location_name text,
  latitude      numeric,
  longitude     numeric,
  radius_miles  numeric default 25,
  is_active     boolean default true,
  photo_urls    jsonb default '[]',
  created_by    uuid references auth.users,
  created_date  timestamptz default now(),
  updated_date  timestamptz default now()
);
create trigger alerts_updated before update on alerts
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
create table if not exists notifications (
  id                  uuid primary key default gen_random_uuid(),
  user_email          text not null,
  type                text check (type in ('application','appointment','vaccination','medication','event','system')),
  title               text not null,
  message             text not null,
  related_entity_type text,
  related_entity_id   text,
  is_read             boolean default false,
  action_url          text,
  scheduled_for       timestamptz,
  sent_at             timestamptz,
  created_by          uuid references auth.users,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now()
);
create trigger notifications_updated before update on notifications
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- NOTIFICATION PREFERENCES
-- ─────────────────────────────────────────────
create table if not exists notification_preferences (
  id                       uuid primary key default gen_random_uuid(),
  user_email               text not null,
  email_on_applications    boolean default true,
  email_on_appointments    boolean default true,
  email_on_medication      boolean default true,
  email_on_events          boolean default true,
  in_app_notifications     boolean default true,
  notification_frequency   text default 'immediate' check (notification_frequency in ('immediate','daily','weekly')),
  quiet_hours_enabled      boolean default false,
  quiet_hours_start        text,
  quiet_hours_end          text,
  created_by               uuid references auth.users,
  created_date             timestamptz default now(),
  updated_date             timestamptz default now()
);
create trigger notification_preferences_updated before update on notification_preferences
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- FAVORITES
-- ─────────────────────────────────────────────
create table if not exists favorites (
  id         uuid primary key default gen_random_uuid(),
  user_email text not null,
  pet_id     text not null,
  pet_type   text check (pet_type in ('lost_found','adoptable')),
  created_by uuid references auth.users,
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  unique (user_email, pet_id)
);
create trigger favorites_updated before update on favorites
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- EVENT RSVPs
-- ─────────────────────────────────────────────
create table if not exists event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   text not null,
  user_email text not null,
  status     text default 'interested' check (status in ('attending','interested','not_attending')),
  guests     numeric default 1,
  created_by uuid references auth.users,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);
create trigger event_rsvps_updated before update on event_rsvps
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- EVENT REMINDERS
-- ─────────────────────────────────────────────
create table if not exists event_reminders (
  id            uuid primary key default gen_random_uuid(),
  event_id      text not null,
  user_email    text not null,
  reminder_type text default 'day_before' check (reminder_type in ('day_before','hour_before','at_time')),
  created_by    uuid references auth.users,
  created_date  timestamptz default now(),
  updated_date  timestamptz default now()
);
create trigger event_reminders_updated before update on event_reminders
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- PREFERENCES
-- ─────────────────────────────────────────────
create table if not exists preferences (
  id                    uuid primary key default gen_random_uuid(),
  user_email            text not null unique,
  preferred_pet_types   jsonb default '[]',
  preferred_energy_level text check (preferred_energy_level in ('low','medium','high')),
  living_situation      text check (living_situation in ('apartment','house','farm_rural')),
  has_kids              boolean,
  has_other_dogs        boolean,
  has_other_cats        boolean,
  willing_special_needs boolean default false,
  experience_level      text check (experience_level in ('first_time','moderate','experienced')),
  budget                numeric,
  pet_preferences       jsonb,
  created_by            uuid references auth.users,
  created_date          timestamptz default now(),
  updated_date          timestamptz default now()
);
create trigger preferences_updated before update on preferences
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- CLOAKED EMAILS
-- ─────────────────────────────────────────────
create table if not exists cloaked_emails (
  id            uuid primary key default gen_random_uuid(),
  user_email    text not null,
  cloaked_email text not null unique,
  email_count   numeric default 0,
  is_active     boolean default true,
  created_by    uuid references auth.users,
  created_date  timestamptz default now(),
  updated_date  timestamptz default now()
);
create trigger cloaked_emails_updated before update on cloaked_emails
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- INVITES
-- ─────────────────────────────────────────────
create table if not exists invites (
  id             uuid primary key default gen_random_uuid(),
  inviter_email  text not null,
  invitee_email  text not null,
  invitee_name   text,
  signup_status  text default 'pending' check (signup_status in ('pending','accepted')),
  signup_date    timestamptz,
  created_by     uuid references auth.users,
  created_date   timestamptz default now(),
  updated_date   timestamptz default now()
);
create trigger invites_updated before update on invites
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- ORGANIZATION TAGS
-- ─────────────────────────────────────────────
create table if not exists organization_tags (
  id                uuid primary key default gen_random_uuid(),
  post_id           text not null,
  content_type      text check (content_type in ('post','event')),
  tagged_by_email   text not null,
  tagged_by_name    text,
  organization_email text not null,
  organization_name text,
  organization_type text check (organization_type in ('rescue','shelter','service')),
  status            text default 'pending' check (status in ('pending','approved','rejected')),
  approved_at       timestamptz,
  approved_by_email text,
  created_by        uuid references auth.users,
  created_date      timestamptz default now(),
  updated_date      timestamptz default now()
);
create trigger organization_tags_updated before update on organization_tags
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- PHOTO MATCH SEARCHES
-- ─────────────────────────────────────────────
create table if not exists photo_match_searches (
  id              uuid primary key default gen_random_uuid(),
  user_email      text not null,
  photo_url       text not null,
  pet_description text,
  species         text,
  breed_guess     text,
  color           text,
  match_count     numeric,
  created_by      uuid references auth.users,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);
create trigger photo_match_searches_updated before update on photo_match_searches
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- PARTNERSHIP NOTIFICATIONS
-- ─────────────────────────────────────────────
create table if not exists partnership_notifications (
  id               uuid primary key default gen_random_uuid(),
  partnership_id   text not null,
  recipient_email  text not null,
  sender_name      text not null,
  event_type       text check (event_type in ('request_sent','request_accepted','request_declined','partnership_active','animals_transferred','partnership_completed')),
  message          text not null,
  read             boolean default false,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
create trigger partnership_notifications_updated before update on partnership_notifications
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- PAGE CONTENT TABLES (CMS)
-- ─────────────────────────────────────────────
create table if not exists home_page_content (
  id                          uuid primary key default gen_random_uuid(),
  hero_badge_text             text,
  hero_headline_line1         text,
  hero_headline_line2         text,
  hero_subtext                text,
  hero_primary_button_text    text,
  hero_secondary_button_text  text,
  hero_image_url              text,
  adoption_section_title      text,
  adoption_section_subtitle   text,
  lost_found_section_title    text,
  lost_found_section_subtitle text,
  community_section_title     text,
  community_section_subtitle  text,
  services_section_title      text,
  services_section_subtitle   text,
  created_by                  uuid references auth.users,
  created_date                timestamptz default now(),
  updated_date                timestamptz default now()
);
create trigger home_page_content_updated before update on home_page_content
  for each row execute function set_updated_date();

create table if not exists about_page_content (
  id                  uuid primary key default gen_random_uuid(),
  hero_badge_text     text,
  hero_subtext        text,
  mission_paragraph_1 text,
  mission_paragraph_2 text,
  mission_pillars     jsonb default '[]',
  team_members        jsonb default '[]',
  values              jsonb default '[]',
  contact_email       text,
  partner_email       text,
  location            text,
  created_by          uuid references auth.users,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now()
);
create trigger about_page_content_updated before update on about_page_content
  for each row execute function set_updated_date();

create table if not exists adopt_page_content (
  id                uuid primary key default gen_random_uuid(),
  hero_badge_text   text,
  hero_headline     text,
  hero_subtext      text,
  empty_state_title text,
  created_by        uuid references auth.users,
  created_date      timestamptz default now(),
  updated_date      timestamptz default now()
);
create trigger adopt_page_content_updated before update on adopt_page_content
  for each row execute function set_updated_date();

create table if not exists lost_found_page_content (
  id                          uuid primary key default gen_random_uuid(),
  hero_badge_text             text,
  hero_headline               text,
  hero_subtext                text,
  report_lost_button_text     text,
  report_found_button_text    text,
  photo_match_upload_title    text,
  photo_match_upload_hint     text,
  photo_match_no_results_text text,
  alert_cta_text              text,
  created_by                  uuid references auth.users,
  created_date                timestamptz default now(),
  updated_date                timestamptz default now()
);
create trigger lost_found_page_content_updated before update on lost_found_page_content
  for each row execute function set_updated_date();

create table if not exists volunteer_page_content (
  id                   uuid primary key default gen_random_uuid(),
  hero_badge_text      text,
  hero_headline        text,
  hero_subtext         text,
  empty_state_title    text,
  empty_state_subtitle text,
  created_by           uuid references auth.users,
  created_date         timestamptz default now(),
  updated_date         timestamptz default now()
);
create trigger volunteer_page_content_updated before update on volunteer_page_content
  for each row execute function set_updated_date();

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────
-- Run these in the Supabase dashboard Storage section,
-- or uncomment if your Supabase plan supports SQL bucket creation:
--
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true)
-- on conflict do nothing;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (basic — enable per-table as needed)
-- ─────────────────────────────────────────────
-- For now all tables are open (matching Base44's default).
-- Uncomment and customize these policies as you harden the app.
--
-- alter table adoptable_pets enable row level security;
-- create policy "public read" on adoptable_pets for select using (true);
-- create policy "auth insert" on adoptable_pets for insert with check (auth.uid() is not null);
-- create policy "owner update" on adoptable_pets for update using (created_by = auth.uid());
