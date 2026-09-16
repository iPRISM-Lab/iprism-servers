alter table public.weather_datasets
add column cities jsonb;

update public.weather_datasets
set cities = jsonb_build_array(city)
where cities is null;

alter table public.weather_datasets
alter column cities set not null;

alter table public.weather_datasets
add constraint weather_datasets_cities_nonempty_array check (
    case
        when jsonb_typeof(cities) = 'array' then jsonb_array_length(cities) > 0
        else false
    end
);

grant insert (cities) on table public.weather_datasets to authenticated;

drop policy if exists "Authenticated users can read weather dataset metadata"
on public.weather_datasets;

drop policy if exists "Users can read their own weather dataset metadata"
on public.weather_datasets;

create policy "Users can read their own weather dataset metadata"
on public.weather_datasets
for select
to authenticated
using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
);

comment on column public.weather_datasets.cities is
    'Ordered locations included in the generated CSV; city remains the first location for backwards compatibility.';
