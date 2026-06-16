alter table shelter_details
  add column if not exists city               text,
  add column if not exists state              text,
  add column if not exists org_type           text,
  add column if not exists accepts_volunteers boolean default false,
  add column if not exists fosters_needed     boolean default false,
  add column if not exists services_offered   jsonb default '[]',
  add column if not exists public_listing     boolean default false,
  add column if not exists instagram_url      text,
  add column if not exists facebook_url       text,
  add column if not exists tiktok_url         text,
  add column if not exists linkedin_url       text,
  add column if not exists sponsors           jsonb default '[]';
