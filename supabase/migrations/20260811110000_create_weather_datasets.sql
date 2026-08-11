create table public.weather_datasets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    creator_name text not null,
    creator_email text,
    name text not null,
    city jsonb not null,
    temporal_resolution text not null,
    variable_ids text[] not null,
    variable_labels text[] not null,
    start_date date not null,
    end_date date not null,
    generated_at timestamptz not null default now(),
    row_count integer not null,
    column_count integer not null,
    file_name text not null,
    storage_status text not null default 'metadata_only',
    request_url text,
    api_generation_time_ms double precision,
    response_timezone text,
    units jsonb not null default '{}'::jsonb,
    constraint weather_datasets_name_length check (char_length(name) between 1 and 90),
    constraint weather_datasets_city_object check (jsonb_typeof(city) = 'object'),
    constraint weather_datasets_resolution check (temporal_resolution in ('hourly', 'daily')),
    constraint weather_datasets_variables_present check (cardinality(variable_ids) > 0),
    constraint weather_datasets_date_order check (start_date <= end_date),
    constraint weather_datasets_counts check (row_count >= 0 and column_count >= 7),
    constraint weather_datasets_storage_status check (storage_status in ('metadata_only', 'stored', 'missing', 'failed')),
    constraint weather_datasets_units_object check (jsonb_typeof(units) = 'object')
);

create index weather_datasets_generated_at_idx
on public.weather_datasets (generated_at desc);

create index weather_datasets_user_id_idx
on public.weather_datasets (user_id);

alter table public.weather_datasets enable row level security;

revoke all on table public.weather_datasets from anon, authenticated;
grant select on table public.weather_datasets to authenticated;
grant insert (
    id,
    user_id,
    creator_name,
    creator_email,
    name,
    city,
    temporal_resolution,
    variable_ids,
    variable_labels,
    start_date,
    end_date,
    generated_at,
    row_count,
    column_count,
    file_name,
    storage_status,
    request_url,
    api_generation_time_ms,
    response_timezone,
    units
) on table public.weather_datasets to authenticated;

create policy "Authenticated users can read weather dataset metadata"
on public.weather_datasets
for select
to authenticated
using (true);

create policy "Users can create their own weather dataset metadata"
on public.weather_datasets
for insert
to authenticated
with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
);

comment on table public.weather_datasets is
    'Metadata for Open-Meteo CSV requests. File storage is connected separately.';
