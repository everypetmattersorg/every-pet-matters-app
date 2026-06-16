-- One-time backfill: existing users shouldn't be asked to accept terms
-- retroactively. Only new signups (terms_accepted defaults to false) will
-- see the gate going forward.
update profiles set terms_accepted = true where terms_accepted is distinct from true;
