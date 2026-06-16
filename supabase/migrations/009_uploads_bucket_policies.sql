-- Allow public read access to the uploads bucket
create policy "Public read access for uploads"
on storage.objects for select
using (bucket_id = 'uploads');

-- Allow authenticated users to upload files
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'uploads');

-- Allow authenticated users to update/delete their own uploads
create policy "Authenticated users can update uploads"
on storage.objects for update
to authenticated
using (bucket_id = 'uploads');

create policy "Authenticated users can delete uploads"
on storage.objects for delete
to authenticated
using (bucket_id = 'uploads');
