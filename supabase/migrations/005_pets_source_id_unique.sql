-- Unique index on source_id so ShelterLuv sync can upsert without creating duplicates.
-- Partial index (where source_id is not null) means existing rows without a source_id are unaffected.
create unique index if not exists pets_source_id_unique on pets (source_id) where source_id is not null;
