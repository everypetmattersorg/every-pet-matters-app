-- If a shelter's name casing changed between syncs, the upsert key
-- (source, source_id) no longer matched old rows, creating duplicate
-- pets under each casing variant. This cleans that up for all shelters.

-- Step 1: delete stale mis-cased rows where a correctly-cased duplicate exists
delete from pets p
using shelter_connections sc
where lower(p.source) = lower(sc.shelter_name)
  and p.source <> sc.shelter_name
  and exists (
    select 1 from pets p2
    where p2.source = sc.shelter_name
      and p2.source_id = p.source_id
  );

-- Step 2: fix casing on any remaining mis-cased rows with no duplicate
update pets p
set source = sc.shelter_name,
    rescue_name = sc.shelter_name
from shelter_connections sc
where lower(p.source) = lower(sc.shelter_name)
  and p.source <> sc.shelter_name;
