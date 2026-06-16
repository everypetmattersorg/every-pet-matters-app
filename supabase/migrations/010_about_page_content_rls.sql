alter table about_page_content enable row level security;

create policy "Public read access for about_page_content"
on about_page_content for select
using (true);

create policy "Authenticated users can insert about_page_content"
on about_page_content for insert
to authenticated
with check (true);

create policy "Authenticated users can update about_page_content"
on about_page_content for update
to authenticated
using (true);
