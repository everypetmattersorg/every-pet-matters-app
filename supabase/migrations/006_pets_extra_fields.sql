alter table pets
  add column if not exists color        text,
  add column if not exists age_years    int,
  add column if not exists age_months   int,
  add column if not exists house_trained boolean,
  add column if not exists notes        text,
  add column if not exists rescue_city  text,
  add column if not exists rescue_state text;
