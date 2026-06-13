update shelter_connections
set shelterluv_adoptable_statuses = '["adoption available","available foster"]'
where shelterluv_adoptable_statuses @> '["stray in foster"]'::jsonb;
