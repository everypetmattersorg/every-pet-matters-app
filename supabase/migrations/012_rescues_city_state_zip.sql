alter table rescues
  add column if not exists city  text,
  add column if not exists state text,
  add column if not exists zip   text;
