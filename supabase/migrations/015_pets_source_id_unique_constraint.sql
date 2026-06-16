-- Ensure source_id alone is the stable upsert key for synced pets,
-- independent of shelter_name (which can change casing/text over time
-- and previously caused duplicate rows when used as part of the
-- upsert conflict key).
create unique index if not exists pets_source_id_unique on pets (source_id) where source_id is not null;
