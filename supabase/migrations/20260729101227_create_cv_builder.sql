create table public.cv_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    slug text not null unique,
    content jsonb not null default '{}'::jsonb,
    publication_status text not null default 'draft',
    published_url text,
    github_repository text,
    last_published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cv_profiles_slug_format check (
        slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
    ),
    constraint cv_profiles_content_object check (jsonb_typeof(content) = 'object'),
    constraint cv_profiles_publication_status check (
        publication_status in ('draft', 'publishing', 'published', 'failed')
    )
);

alter table public.cv_profiles enable row level security;

revoke all on table public.cv_profiles from anon, authenticated;
grant select, delete on table public.cv_profiles to authenticated;
grant insert (user_id, slug, content, updated_at) on table public.cv_profiles to authenticated;
grant update (user_id, slug, content, updated_at) on table public.cv_profiles to authenticated;

create policy "Users can read their own CV"
on public.cv_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own CV"
on public.cv_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own CV"
on public.cv_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own CV"
on public.cv_profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'cv-photos',
    'cv-photos',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their own CV photos"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own CV photos"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can replace their own CV photos"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own CV photos"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'cv-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
