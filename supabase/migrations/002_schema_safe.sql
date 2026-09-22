-- Every Pet Matters — safe re-runnable schema
-- Run this in the Supabase SQL editor. Safe to run even if some tables already exist.

create extension if not exists "pgcrypto";

create or replace function set_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

-- PROFILES
create table if not exists profiles (
  id                  uuid primary key references auth.users on delete cascade,
  email               text,
  full_name           text,
  role                text default 'user' check (role in ('admin','user')),
  terms_accepted      boolean default false,
  profile_complete    boolean default false,
  onboarding_complete boolean default false,
  org_type            text,
  display_name        text,
  bio                 text,
  avatar_url          text,
  phone               text,
  city                text,
  state               text,
  website             text,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now()
);
drop trigger if exists profiles_updated on profiles;
create trigger profiles_updated before update on profiles for each row execute function set_updated_date();

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ADOPTABLE PETS
create table if not exists adoptable_pets (
  id                        uuid primary key default gen_random_uuid(),
  name                      text,
  pet_type                  text,
  breed                     text,
  age_years                 numeric,
  age_months                numeric,
  gender                    text,
  weight_lbs                numeric,
  color                     text,
  description               text,
  photo_url                 text,
  extra_photos              jsonb default '[]',
  rescue_name               text,
  rescue_email              text,
  rescue_phone              text,
  rescue_website            text,
  rescue_city               text,
  rescue_state              text,
  foster_url                text,
  good_with_kids            boolean,
  good_with_dogs            boolean,
  good_with_cats            boolean,
  energy_level              text,
  special_needs             boolean default false,
  special_needs_description text,
  adoption_fee              numeric,
  status                    text default 'available',
  is_urgent                 boolean default false,
  urgency_reason            text,
  e_list_date               date,
  created_by                uuid references auth.users,
  created_date              timestamptz default now(),
  updated_date              timestamptz default now()
);
drop trigger if exists adoptable_pets_updated on adoptable_pets;
create trigger adoptable_pets_updated before update on adoptable_pets for each row execute function set_updated_date();

-- PETS (synced from external sources)
create table if not exists pets (
  id                  uuid primary key default gen_random_uuid(),
  name                text,
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
  source              text,
  source_id           text,
  url                 text,
  outreach_status     text,
  adoption_status     text,
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
  kid_friendly        text,
  dog_friendly        text,
  cat_friendly        text,
  pet_type            text,
  energy_level        text,
  special_needs       boolean,
  rescue_name         text,
  social_media_graphics jsonb,
  created_by          uuid references auth.users,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now()
);
drop trigger if exists pets_updated on pets;
create trigger pets_updated before update on pets for each row execute function set_updated_date();

-- LOST & FOUND PETS
create table if not exists lost_found_pets (
  id                      uuid primary key default gen_random_uuid(),
  name                    text,
  status                  text,
  species                 text,
  breed                   text,
  color                   text,
  age                     text,
  gender                  text,
  size                    text,
  description             text,
  photo_urls              jsonb default '[]',
  last_seen_location      text,
  latitude                numeric,
  longitude               numeric,
  last_seen_date          date,
  reporter_name           text,
  reporter_email          text,
  reporter_phone          text,
  special_characteristics text,
  reward_offered          boolean default false,
  reward_amount           numeric,
  is_resolved             boolean default false,
  resolution_notes        text,
  social_media_graphic    text,
  social_media_caption    text,
  created_by              uuid references auth.users,
  created_date            timestamptz default now(),
  updated_date            timestamptz default now()
);
drop trigger if exists lost_found_pets_updated on lost_found_pets;
create trigger lost_found_pets_updated before update on lost_found_pets for each row execute function set_updated_date();

-- OWNED PETS
create table if not exists owned_pets (
  id                  uuid primary key default gen_random_uuid(),
  owner_email         text,
  name                text,
  pet_type            text,
  breed               text,
  age_years           numeric,
  age_months          numeric,
  gender              text,
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
  energy_level        text,
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
drop trigger if exists owned_pets_updated on owned_pets;
create trigger owned_pets_updated before update on owned_pets for each row execute function set_updated_date();

-- ADOPTION APPLICATIONS
create table if not exists adoption_applications (
  id                    uuid primary key default gen_random_uuid(),
  pet_id                text,
  pet_name              text,
  rescue_email          text,
  applicant_name        text,
  applicant_email       text,
  applicant_phone       text,
  living_situation      text,
  address               text,
  own_or_rent           text,
  landlord_allows_pets  boolean,
  other_pets            jsonb default '[]',
  children_ages         jsonb default '[]',
  work_schedule         text,
  pet_experience        text,
  vet_references        jsonb default '[]',
  personal_references   jsonb default '[]',
  adoption_expectations text,
  commitment            text,
  status                text default 'pending',
  notes                 text,
  created_by            uuid references auth.users,
  created_date          timestamptz default now(),
  updated_date          timestamptz default now()
);
drop trigger if exists adoption_applications_updated on adoption_applications;
create trigger adoption_applications_updated before update on adoption_applications for each row execute function set_updated_date();

-- ADOPTION FOLLOW-UPS
create table if not exists adoption_follow_ups (
  id                       uuid primary key default gen_random_uuid(),
  adoption_application_id  text,
  adopter_email            text,
  pet_name                 text,
  rescue_email             text,
  adoption_date            date,
  task_type                text,
  scheduled_date           date,
  status                   text default 'pending',
  notes                    text,
  completed_date           timestamptz,
  created_by               uuid references auth.users,
  created_date             timestamptz default now(),
  updated_date             timestamptz default now()
);
drop trigger if exists adoption_follow_ups_updated on adoption_follow_ups;
create trigger adoption_follow_ups_updated before update on adoption_follow_ups for each row execute function set_updated_date();

-- ADOPTED PET UPDATES
create table if not exists adopted_pet_updates (
  id                uuid primary key default gen_random_uuid(),
  adopted_pet_id    text,
  adopter_email     text,
  rescue_email      text,
  pet_name          text,
  update_type       text,
  title             text,
  description       text,
  photo_url         text,
  share_with_rescue boolean default true,
  public            boolean default false,
  created_by        uuid references auth.users,
  created_date      timestamptz default now(),
  updated_date      timestamptz default now()
);
drop trigger if exists adopted_pet_updates_updated on adopted_pet_updates;
create trigger adopted_pet_updates_updated before update on adopted_pet_updates for each row execute function set_updated_date();

-- FOSTER APPLICATIONS
create table if not exists foster_applications (
  id                       uuid primary key default gen_random_uuid(),
  rescue_email             text,
  rescue_name              text,
  pet_id                   text,
  pet_name                 text,
  applicant_email          text,
  applicant_name           text,
  applicant_phone          text,
  home_type                text,
  has_yard                 boolean default false,
  has_other_pets           boolean default false,
  other_pets_description   text,
  has_children             boolean default false,
  children_ages            text,
  experience_level         text,
  can_foster_special_needs boolean default false,
  preferred_pet_types      jsonb default '[]',
  availability_start       date,
  max_duration_weeks       numeric,
  motivation               text,
  status                   text default 'pending',
  rescue_notes             text,
  messages                 jsonb default '[]',
  created_by               uuid references auth.users,
  created_date             timestamptz default now(),
  updated_date             timestamptz default now()
);
drop trigger if exists foster_applications_updated on foster_applications;
create trigger foster_applications_updated before update on foster_applications for each row execute function set_updated_date();

-- FOSTER TO ADOPT PETS
create table if not exists foster_to_adopt_pets (
  id                      uuid primary key default gen_random_uuid(),
  pet_id                  text,
  pet_name                text,
  rescue_email            text,
  foster_email            text,
  foster_start_date       date,
  foster_end_date         date,
  status                  text default 'fostering',
  adoption_application_id text,
  notes                   text,
  is_emergency_foster     boolean default false,
  created_by              uuid references auth.users,
  created_date            timestamptz default now(),
  updated_date            timestamptz default now()
);
drop trigger if exists foster_to_adopt_pets_updated on foster_to_adopt_pets;
create trigger foster_to_adopt_pets_updated before update on foster_to_adopt_pets for each row execute function set_updated_date();

-- RESCUES
create table if not exists rescues (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  org_type            text default 'rescue',
  name                text,
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
drop trigger if exists rescues_updated on rescues;
create trigger rescues_updated before update on rescues for each row execute function set_updated_date();

-- RESCUE EVENTS
create table if not exists rescue_events (
  id                   uuid primary key default gen_random_uuid(),
  rescue_email         text,
  title                text,
  description          text,
  event_date           date,
  event_time           text,
  location             text,
  latitude             numeric,
  longitude            numeric,
  event_type           text,
  tagged_organizations jsonb default '[]',
  created_by           uuid references auth.users,
  created_date         timestamptz default now(),
  updated_date         timestamptz default now()
);
drop trigger if exists rescue_events_updated on rescue_events;
create trigger rescue_events_updated before update on rescue_events for each row execute function set_updated_date();

-- RESCUE REVIEWS
create table if not exists rescue_reviews (
  id              uuid primary key default gen_random_uuid(),
  rescue_email    text,
  reviewer_name   text,
  reviewer_email  text,
  rating          numeric,
  title           text,
  comment         text,
  experience_type text,
  created_by      uuid references auth.users,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);
drop trigger if exists rescue_reviews_updated on rescue_reviews;
create trigger rescue_reviews_updated before update on rescue_reviews for each row execute function set_updated_date();

-- RESCUE API INTEGRATIONS
create table if not exists rescue_api_integrations (
  id                        uuid primary key default gen_random_uuid(),
  rescue_email              text,
  api_provider              text,
  api_key                   text,
  api_secret                text,
  is_active                 boolean default true,
  sync_frequency            text default 'on_demand',
  last_sync                 timestamptz,
  last_sync_error           text,
  petfinder_organization_id text,
  sync_pets                 boolean default true,
  sync_applications         boolean default true,
  created_by                uuid references auth.users,
  created_date              timestamptz default now(),
  updated_date              timestamptz default now()
);
drop trigger if exists rescue_api_integrations_updated on rescue_api_integrations;
create trigger rescue_api_integrations_updated before update on rescue_api_integrations for each row execute function set_updated_date();

-- SHELTER CONNECTIONS
create table if not exists shelter_connections (
  id                            uuid primary key default gen_random_uuid(),
  shelter_name                  text,
  contact_name                  text,
  contact_email                 text,
  contact_phone                 text,
  software_platform             text,
  api_key                       text,
  api_secret                    text,
  organization_id               text,
  status                        text,
  last_sync                     text,
  pets_synced                   numeric,
  notes                         text,
  shelterluv_adoptable_statuses jsonb default '[]',
  created_by                    uuid references auth.users,
  created_date                  timestamptz default now(),
  updated_date                  timestamptz default now()
);
drop trigger if exists shelter_connections_updated on shelter_connections;
create trigger shelter_connections_updated before update on shelter_connections for each row execute function set_updated_date();

-- SHELTER DETAILS
create table if not exists shelter_details (
  id               uuid primary key default gen_random_uuid(),
  shelter_name     text,
  website          text,
  phone            text,
  email            text,
  address          text,
  mission          text,
  description      text,
  hours            text,
  logo_url         text,
  banner_url       text,
  animals_accepted text,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
drop trigger if exists shelter_details_updated on shelter_details;
create trigger shelter_details_updated before update on shelter_details for each row execute function set_updated_date();

-- SYNC LOGS
create table if not exists sync_logs (
  id                  uuid primary key default gen_random_uuid(),
  rescue_email        text,
  api_provider        text,
  sync_type           text,
  status              text,
  pets_synced         numeric default 0,
  applications_synced numeric default 0,
  error_message       text,
  duration_seconds    numeric,
  details             jsonb,
  created_by          uuid references auth.users,
  created_date        timestamptz default now(),
  updated_date        timestamptz default now()
);
drop trigger if exists sync_logs_updated on sync_logs;
create trigger sync_logs_updated before update on sync_logs for each row execute function set_updated_date();

-- VOLUNTEER OPPORTUNITIES
create table if not exists volunteer_opportunities (
  id              uuid primary key default gen_random_uuid(),
  rescue_email    text,
  rescue_name     text,
  title           text,
  description     text,
  category        text,
  location        text,
  time_commitment text,
  start_date      date,
  end_date        date,
  skills_required jsonb default '[]',
  spots_available numeric,
  status          text default 'open',
  contact_email   text,
  contact_phone   text,
  created_by      uuid references auth.users,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);
drop trigger if exists volunteer_opportunities_updated on volunteer_opportunities;
create trigger volunteer_opportunities_updated before update on volunteer_opportunities for each row execute function set_updated_date();

-- VOLUNTEER APPLICATIONS
create table if not exists volunteer_applications (
  id                uuid primary key default gen_random_uuid(),
  opportunity_id    text,
  volunteer_email   text,
  volunteer_name    text,
  volunteer_phone   text,
  rescue_email      text,
  opportunity_title text,
  cover_letter      text,
  status            text default 'pending',
  availability      text,
  response_message  text,
  responded_at      timestamptz,
  hours_completed   numeric default 0,
  date_completed    date,
  notes             text,
  created_by        uuid references auth.users,
  created_date      timestamptz default now(),
  updated_date      timestamptz default now()
);
drop trigger if exists volunteer_applications_updated on volunteer_applications;
create trigger volunteer_applications_updated before update on volunteer_applications for each row execute function set_updated_date();

-- VOLUNTEER INTERESTS
create table if not exists volunteer_interests (
  id              uuid primary key default gen_random_uuid(),
  rescue_email    text,
  volunteer_name  text,
  volunteer_email text,
  message         text,
  created_by      uuid references auth.users,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);
drop trigger if exists volunteer_interests_updated on volunteer_interests;
create trigger volunteer_interests_updated before update on volunteer_interests for each row execute function set_updated_date();

-- DONATIONS
create table if not exists donations (
  id                     uuid primary key default gen_random_uuid(),
  donor_name             text,
  donor_email            text,
  rescue_email           text,
  donation_goal_id       text,
  amount                 numeric,
  donation_type          text default 'one_time',
  donation_target        text default 'general_fund',
  status                 text default 'pending',
  stripe_payment_id      text,
  stripe_subscription_id text,
  message                text,
  is_anonymous           boolean default false,
  dedication_type        text default 'none',
  dedication_name        text,
  dedication_message     text,
  recipient_email        text,
  completed_date         timestamptz,
  created_by             uuid references auth.users,
  created_date           timestamptz default now(),
  updated_date           timestamptz default now()
);
drop trigger if exists donations_updated on donations;
create trigger donations_updated before update on donations for each row execute function set_updated_date();

-- DONATION GOALS
create table if not exists donation_goals (
  id             uuid primary key default gen_random_uuid(),
  rescue_email   text,
  title          text,
  description    text,
  target_amount  numeric,
  current_amount numeric default 0,
  deadline       date,
  is_active      boolean default true,
  image_url      text,
  created_by     uuid references auth.users,
  created_date   timestamptz default now(),
  updated_date   timestamptz default now()
);
drop trigger if exists donation_goals_updated on donation_goals;
create trigger donation_goals_updated before update on donation_goals for each row execute function set_updated_date();

-- POSTS
create table if not exists posts (
  id                   uuid primary key default gen_random_uuid(),
  author_email         text,
  author_name          text,
  content              text,
  photo_url            text,
  post_type            text default 'story',
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
drop trigger if exists posts_updated on posts;
create trigger posts_updated before update on posts for each row execute function set_updated_date();

-- COMMENTS
create table if not exists comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           text,
  parent_comment_id text,
  author_email      text,
  author_name       text,
  content           text,
  mentioned_emails  jsonb default '[]',
  created_by        uuid references auth.users,
  created_date      timestamptz default now(),
  updated_date      timestamptz default now()
);
drop trigger if exists comments_updated on comments;
create trigger comments_updated before update on comments for each row execute function set_updated_date();

-- SERVICES
create table if not exists services (
  id               uuid primary key default gen_random_uuid(),
  name             text,
  category         text,
  description      text,
  address          text,
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
drop trigger if exists services_updated on services;
create trigger services_updated before update on services for each row execute function set_updated_date();

-- SERVICE REVIEWS
create table if not exists service_reviews (
  id              uuid primary key default gen_random_uuid(),
  service_id      text,
  reviewer_email  text,
  reviewer_name   text,
  rating          numeric,
  comment         text,
  would_recommend boolean default true,
  created_by      uuid references auth.users,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);
drop trigger if exists service_reviews_updated on service_reviews;
create trigger service_reviews_updated before update on service_reviews for each row execute function set_updated_date();

-- RESOURCES
create table if not exists resources (
  id                 uuid primary key default gen_random_uuid(),
  title              text,
  category           text,
  content            text,
  summary            text,
  tags               jsonb default '[]',
  photo_url          text,
  author_name        text,
  location           text default 'everywhere',
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
  group_platform     text,
  group_url          text,
  group_member_count numeric,
  is_published       boolean default true,
  status             text default 'pending',
  submitted_by_email text,
  submitted_by_name  text,
  denial_reason      text,
  approved_by_email  text,
  approved_at        timestamptz,
  created_by         uuid references auth.users,
  created_date       timestamptz default now(),
  updated_date       timestamptz default now()
);
drop trigger if exists resources_updated on resources;
create trigger resources_updated before update on resources for each row execute function set_updated_date();

-- ALERTS
create table if not exists alerts (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  email         text,
  pet_type      text default 'any',
  status_filter text default 'lost',
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
drop trigger if exists alerts_updated on alerts;
create trigger alerts_updated before update on alerts for each row execute function set_updated_date();

-- NOTIFICATIONS
create table if not exists notifications (
  id                  uuid primary key default gen_random_uuid(),
  user_email          text,
  type                text,
  title               text,
  message             text,
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
drop trigger if exists notifications_updated on notifications;
create trigger notifications_updated before update on notifications for each row execute function set_updated_date();

-- NOTIFICATION PREFERENCES
create table if not exists notification_preferences (
  id                     uuid primary key default gen_random_uuid(),
  user_email             text,
  email_on_applications  boolean default true,
  email_on_appointments  boolean default true,
  email_on_medication    boolean default true,
  email_on_events        boolean default true,
  in_app_notifications   boolean default true,
  notification_frequency text default 'immediate',
  quiet_hours_enabled    boolean default false,
  quiet_hours_start      text,
  quiet_hours_end        text,
  created_by             uuid references auth.users,
  created_date           timestamptz default now(),
  updated_date           timestamptz default now()
);
drop trigger if exists notification_preferences_updated on notification_preferences;
create trigger notification_preferences_updated before update on notification_preferences for each row execute function set_updated_date();

-- FAVORITES
create table if not exists favorites (
  id           uuid primary key default gen_random_uuid(),
  user_email   text,
  pet_id       text,
  pet_type     text,
  created_by   uuid references auth.users,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);
drop trigger if exists favorites_updated on favorites;
create trigger favorites_updated before update on favorites for each row execute function set_updated_date();

-- EVENT RSVPs
create table if not exists event_rsvps (
  id           uuid primary key default gen_random_uuid(),
  event_id     text,
  user_email   text,
  status       text default 'interested',
  guests       numeric default 1,
  created_by   uuid references auth.users,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);
drop trigger if exists event_rsvps_updated on event_rsvps;
create trigger event_rsvps_updated before update on event_rsvps for each row execute function set_updated_date();

-- EVENT REMINDERS
create table if not exists event_reminders (
  id            uuid primary key default gen_random_uuid(),
  event_id      text,
  user_email    text,
  reminder_type text default 'day_before',
  created_by    uuid references auth.users,
  created_date  timestamptz default now(),
  updated_date  timestamptz default now()
);
drop trigger if exists event_reminders_updated on event_reminders;
create trigger event_reminders_updated before update on event_reminders for each row execute function set_updated_date();

-- PREFERENCES
create table if not exists preferences (
  id                     uuid primary key default gen_random_uuid(),
  user_email             text unique,
  preferred_pet_types    jsonb default '[]',
  preferred_energy_level text,
  living_situation       text,
  has_kids               boolean,
  has_other_dogs         boolean,
  has_other_cats         boolean,
  willing_special_needs  boolean default false,
  experience_level       text,
  budget                 numeric,
  pet_preferences        jsonb,
  created_by             uuid references auth.users,
  created_date           timestamptz default now(),
  updated_date           timestamptz default now()
);
drop trigger if exists preferences_updated on preferences;
create trigger preferences_updated before update on preferences for each row execute function set_updated_date();

-- CLOAKED EMAILS
create table if not exists cloaked_emails (
  id            uuid primary key default gen_random_uuid(),
  user_email    text,
  cloaked_email text unique,
  email_count   numeric default 0,
  is_active     boolean default true,
  created_by    uuid references auth.users,
  created_date  timestamptz default now(),
  updated_date  timestamptz default now()
);
drop trigger if exists cloaked_emails_updated on cloaked_emails;
create trigger cloaked_emails_updated before update on cloaked_emails for each row execute function set_updated_date();

-- INVITES
create table if not exists invites (
  id             uuid primary key default gen_random_uuid(),
  inviter_email  text,
  invitee_email  text,
  invitee_name   text,
  signup_status  text default 'pending',
  signup_date    timestamptz,
  created_by     uuid references auth.users,
  created_date   timestamptz default now(),
  updated_date   timestamptz default now()
);
drop trigger if exists invites_updated on invites;
create trigger invites_updated before update on invites for each row execute function set_updated_date();

-- ORGANIZATION TAGS
create table if not exists organization_tags (
  id                 uuid primary key default gen_random_uuid(),
  post_id            text,
  content_type       text,
  tagged_by_email    text,
  tagged_by_name     text,
  organization_email text,
  organization_name  text,
  organization_type  text,
  status             text default 'pending',
  approved_at        timestamptz,
  approved_by_email  text,
  created_by         uuid references auth.users,
  created_date       timestamptz default now(),
  updated_date       timestamptz default now()
);
drop trigger if exists organization_tags_updated on organization_tags;
create trigger organization_tags_updated before update on organization_tags for each row execute function set_updated_date();

-- PHOTO MATCH SEARCHES
create table if not exists photo_match_searches (
  id              uuid primary key default gen_random_uuid(),
  user_email      text,
  photo_url       text,
  pet_description text,
  species         text,
  breed_guess     text,
  color           text,
  match_count     numeric,
  created_by      uuid references auth.users,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);
drop trigger if exists photo_match_searches_updated on photo_match_searches;
create trigger photo_match_searches_updated before update on photo_match_searches for each row execute function set_updated_date();

-- PARTNERSHIP NOTIFICATIONS
create table if not exists partnership_notifications (
  id               uuid primary key default gen_random_uuid(),
  partnership_id   text,
  recipient_email  text,
  sender_name      text,
  event_type       text,
  message          text,
  read             boolean default false,
  created_by       uuid references auth.users,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);
drop trigger if exists partnership_notifications_updated on partnership_notifications;
create trigger partnership_notifications_updated before update on partnership_notifications for each row execute function set_updated_date();

-- PAGE CONTENT TABLES
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
drop trigger if exists home_page_content_updated on home_page_content;
create trigger home_page_content_updated before update on home_page_content for each row execute function set_updated_date();

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
drop trigger if exists about_page_content_updated on about_page_content;
create trigger about_page_content_updated before update on about_page_content for each row execute function set_updated_date();

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
drop trigger if exists adopt_page_content_updated on adopt_page_content;
create trigger adopt_page_content_updated before update on adopt_page_content for each row execute function set_updated_date();

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
drop trigger if exists lost_found_page_content_updated on lost_found_page_content;
create trigger lost_found_page_content_updated before update on lost_found_page_content for each row execute function set_updated_date();

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
drop trigger if exists volunteer_page_content_updated on volunteer_page_content;
create trigger volunteer_page_content_updated before update on volunteer_page_content for each row execute function set_updated_date();
