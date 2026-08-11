const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const LOCAL_LIBRARY_KEY = 'iprism-weather-dataset-library-v1';
const MIN_ARCHIVE_DATE = '1940-01-01';
const MAX_LIBRARY_ITEMS = 100;

const variable = (id, label, group, unit, description) => ({
    id,
    label,
    group,
    unit,
    description
});

export const WEATHER_VARIABLES = {
    hourly: [
        variable('temperature_2m', 'Temperature (2 m)', 'Temperature & humidity', '°C', 'Air temperature two metres above ground.'),
        variable('relative_humidity_2m', 'Relative humidity (2 m)', 'Temperature & humidity', '%', 'Relative humidity two metres above ground.'),
        variable('dew_point_2m', 'Dew point (2 m)', 'Temperature & humidity', '°C', 'Temperature at which moisture condenses.'),
        variable('apparent_temperature', 'Apparent temperature', 'Temperature & humidity', '°C', 'Feels-like temperature using humidity, wind, and radiation.'),
        variable('wet_bulb_temperature_2m', 'Wet-bulb temperature (2 m)', 'Temperature & humidity', '°C', 'Lowest temperature reached through evaporative cooling.'),
        variable('vapour_pressure_deficit', 'Vapour pressure deficit', 'Temperature & humidity', 'kPa', 'Difference between saturated and actual vapour pressure.'),
        variable('total_column_integrated_water_vapour', 'Integrated water vapour', 'Temperature & humidity', 'kg/m²', 'Water vapour integrated through the atmospheric column.'),

        variable('precipitation', 'Precipitation', 'Precipitation & snow', 'mm', 'Total rain and snowfall water equivalent in the preceding hour.'),
        variable('rain', 'Rain', 'Precipitation & snow', 'mm', 'Large-scale rain in the preceding hour.'),
        variable('snowfall', 'Snowfall', 'Precipitation & snow', 'cm', 'Snowfall depth in the preceding hour.'),
        variable('snow_depth', 'Snow depth', 'Precipitation & snow', 'm', 'Snow depth on the ground.'),
        variable('weather_code', 'Weather code', 'Precipitation & snow', 'WMO code', 'Numeric WMO weather condition code.'),
        variable('sunshine_duration', 'Sunshine duration', 'Precipitation & snow', 's', 'Seconds of sunshine during the preceding hour.'),
        variable('is_day', 'Is day', 'Precipitation & snow', '0 / 1', 'One during daylight and zero at night.'),

        variable('wind_speed_10m', 'Wind speed (10 m)', 'Wind', 'km/h', 'Wind speed ten metres above ground.'),
        variable('wind_speed_100m', 'Wind speed (100 m)', 'Wind', 'km/h', 'Wind speed one hundred metres above ground.'),
        variable('wind_direction_10m', 'Wind direction (10 m)', 'Wind', '°', 'Wind direction ten metres above ground.'),
        variable('wind_direction_100m', 'Wind direction (100 m)', 'Wind', '°', 'Wind direction one hundred metres above ground.'),
        variable('wind_gusts_10m', 'Wind gusts (10 m)', 'Wind', 'km/h', 'Maximum gust during the preceding hour.'),

        variable('pressure_msl', 'Sea-level pressure', 'Pressure & clouds', 'hPa', 'Atmospheric pressure reduced to mean sea level.'),
        variable('surface_pressure', 'Surface pressure', 'Pressure & clouds', 'hPa', 'Atmospheric pressure at the surface.'),
        variable('cloud_cover', 'Cloud cover', 'Pressure & clouds', '%', 'Total cloud cover.'),
        variable('cloud_cover_low', 'Low cloud cover', 'Pressure & clouds', '%', 'Cloud cover below approximately three kilometres.'),
        variable('cloud_cover_mid', 'Mid cloud cover', 'Pressure & clouds', '%', 'Cloud cover from approximately three to eight kilometres.'),
        variable('cloud_cover_high', 'High cloud cover', 'Pressure & clouds', '%', 'Cloud cover above approximately eight kilometres.'),
        variable('boundary_layer_height', 'Boundary-layer height', 'Pressure & clouds', 'm', 'Height of the planetary boundary layer.'),

        variable('soil_temperature_0_to_7cm', 'Soil temperature (0–7 cm)', 'Soil', '°C', 'Average soil temperature from zero to seven centimetres.'),
        variable('soil_temperature_7_to_28cm', 'Soil temperature (7–28 cm)', 'Soil', '°C', 'Average soil temperature from seven to twenty-eight centimetres.'),
        variable('soil_temperature_28_to_100cm', 'Soil temperature (28–100 cm)', 'Soil', '°C', 'Average soil temperature from twenty-eight to one hundred centimetres.'),
        variable('soil_temperature_100_to_255cm', 'Soil temperature (100–255 cm)', 'Soil', '°C', 'Average soil temperature from one hundred to two hundred fifty-five centimetres.'),
        variable('soil_moisture_0_to_7cm', 'Soil moisture (0–7 cm)', 'Soil', 'm³/m³', 'Volumetric soil water content from zero to seven centimetres.'),
        variable('soil_moisture_7_to_28cm', 'Soil moisture (7–28 cm)', 'Soil', 'm³/m³', 'Volumetric soil water content from seven to twenty-eight centimetres.'),
        variable('soil_moisture_28_to_100cm', 'Soil moisture (28–100 cm)', 'Soil', 'm³/m³', 'Volumetric soil water content from twenty-eight to one hundred centimetres.'),
        variable('soil_moisture_100_to_255cm', 'Soil moisture (100–255 cm)', 'Soil', 'm³/m³', 'Volumetric soil water content from one hundred to two hundred fifty-five centimetres.'),

        variable('shortwave_radiation', 'Shortwave radiation (GHI)', 'Solar & evapotranspiration', 'W/m²', 'Global horizontal solar radiation averaged over the preceding hour.'),
        variable('direct_radiation', 'Direct radiation', 'Solar & evapotranspiration', 'W/m²', 'Direct horizontal solar radiation averaged over the preceding hour.'),
        variable('diffuse_radiation', 'Diffuse radiation (DHI)', 'Solar & evapotranspiration', 'W/m²', 'Diffuse horizontal solar radiation averaged over the preceding hour.'),
        variable('direct_normal_irradiance', 'Direct normal irradiance (DNI)', 'Solar & evapotranspiration', 'W/m²', 'Direct solar radiation normal to the sun.'),
        variable('global_tilted_irradiance', 'Global tilted irradiance (GTI)', 'Solar & evapotranspiration', 'W/m²', 'Solar radiation on a tilted plane using Open-Meteo defaults.'),
        variable('terrestrial_radiation', 'Terrestrial radiation', 'Solar & evapotranspiration', 'W/m²', 'Theoretical top-of-atmosphere solar radiation.'),
        variable('shortwave_radiation_instant', 'Shortwave radiation — instant', 'Solar & evapotranspiration', 'W/m²', 'Global horizontal solar radiation at the indicated time.'),
        variable('direct_radiation_instant', 'Direct radiation — instant', 'Solar & evapotranspiration', 'W/m²', 'Direct horizontal solar radiation at the indicated time.'),
        variable('diffuse_radiation_instant', 'Diffuse radiation — instant', 'Solar & evapotranspiration', 'W/m²', 'Diffuse horizontal solar radiation at the indicated time.'),
        variable('direct_normal_irradiance_instant', 'DNI — instant', 'Solar & evapotranspiration', 'W/m²', 'Direct normal irradiance at the indicated time.'),
        variable('global_tilted_irradiance_instant', 'GTI — instant', 'Solar & evapotranspiration', 'W/m²', 'Global tilted irradiance at the indicated time.'),
        variable('terrestrial_radiation_instant', 'Terrestrial radiation — instant', 'Solar & evapotranspiration', 'W/m²', 'Top-of-atmosphere solar radiation at the indicated time.'),
        variable('et0_fao_evapotranspiration', 'Reference evapotranspiration (ET₀)', 'Solar & evapotranspiration', 'mm', 'FAO-56 reference evapotranspiration for the preceding hour.')
    ],
    daily: [
        variable('weather_code', 'Weather code', 'Conditions & daylight', 'WMO code', 'Most severe WMO weather condition during the day.'),
        variable('sunrise', 'Sunrise', 'Conditions & daylight', 'ISO 8601', 'Local sunrise time.'),
        variable('sunset', 'Sunset', 'Conditions & daylight', 'ISO 8601', 'Local sunset time.'),
        variable('daylight_duration', 'Daylight duration', 'Conditions & daylight', 's', 'Seconds of daylight during the day.'),
        variable('sunshine_duration', 'Sunshine duration', 'Conditions & daylight', 's', 'Seconds of sunshine during the day.'),

        variable('temperature_2m_mean', 'Mean temperature (2 m)', 'Temperature & humidity', '°C', 'Daily mean air temperature.'),
        variable('temperature_2m_max', 'Maximum temperature (2 m)', 'Temperature & humidity', '°C', 'Daily maximum air temperature.'),
        variable('temperature_2m_min', 'Minimum temperature (2 m)', 'Temperature & humidity', '°C', 'Daily minimum air temperature.'),
        variable('apparent_temperature_mean', 'Mean apparent temperature', 'Temperature & humidity', '°C', 'Daily mean feels-like temperature.'),
        variable('apparent_temperature_max', 'Maximum apparent temperature', 'Temperature & humidity', '°C', 'Daily maximum feels-like temperature.'),
        variable('apparent_temperature_min', 'Minimum apparent temperature', 'Temperature & humidity', '°C', 'Daily minimum feels-like temperature.'),
        variable('dew_point_2m_mean', 'Mean dew point (2 m)', 'Temperature & humidity', '°C', 'Daily mean dew-point temperature.'),
        variable('dew_point_2m_max', 'Maximum dew point (2 m)', 'Temperature & humidity', '°C', 'Daily maximum dew-point temperature.'),
        variable('dew_point_2m_min', 'Minimum dew point (2 m)', 'Temperature & humidity', '°C', 'Daily minimum dew-point temperature.'),
        variable('wet_bulb_temperature_2m_mean', 'Mean wet-bulb temperature', 'Temperature & humidity', '°C', 'Daily mean wet-bulb temperature.'),
        variable('wet_bulb_temperature_2m_max', 'Maximum wet-bulb temperature', 'Temperature & humidity', '°C', 'Daily maximum wet-bulb temperature.'),
        variable('wet_bulb_temperature_2m_min', 'Minimum wet-bulb temperature', 'Temperature & humidity', '°C', 'Daily minimum wet-bulb temperature.'),
        variable('relative_humidity_2m_mean', 'Mean relative humidity', 'Temperature & humidity', '%', 'Daily mean relative humidity.'),
        variable('relative_humidity_2m_max', 'Maximum relative humidity', 'Temperature & humidity', '%', 'Daily maximum relative humidity.'),
        variable('relative_humidity_2m_min', 'Minimum relative humidity', 'Temperature & humidity', '%', 'Daily minimum relative humidity.'),
        variable('vapour_pressure_deficit_max', 'Maximum vapour pressure deficit', 'Temperature & humidity', 'kPa', 'Daily maximum vapour pressure deficit.'),

        variable('precipitation_sum', 'Precipitation sum', 'Precipitation & snow', 'mm', 'Daily precipitation total.'),
        variable('rain_sum', 'Rain sum', 'Precipitation & snow', 'mm', 'Daily rain total.'),
        variable('snowfall_sum', 'Snowfall sum', 'Precipitation & snow', 'cm', 'Daily snowfall total.'),
        variable('snowfall_water_equivalent_sum', 'Snowfall water equivalent', 'Precipitation & snow', 'mm', 'Daily snowfall water-equivalent total.'),
        variable('precipitation_hours', 'Precipitation hours', 'Precipitation & snow', 'h', 'Hours with precipitation during the day.'),

        variable('wind_speed_10m_mean', 'Mean wind speed (10 m)', 'Wind', 'km/h', 'Daily mean wind speed.'),
        variable('wind_speed_10m_max', 'Maximum wind speed (10 m)', 'Wind', 'km/h', 'Daily maximum wind speed.'),
        variable('wind_speed_10m_min', 'Minimum wind speed (10 m)', 'Wind', 'km/h', 'Daily minimum wind speed.'),
        variable('wind_gusts_10m_mean', 'Mean wind gusts (10 m)', 'Wind', 'km/h', 'Daily mean wind-gust speed.'),
        variable('wind_gusts_10m_max', 'Maximum wind gusts (10 m)', 'Wind', 'km/h', 'Daily maximum wind-gust speed.'),
        variable('wind_gusts_10m_min', 'Minimum wind gusts (10 m)', 'Wind', 'km/h', 'Daily minimum wind-gust speed.'),
        variable('wind_direction_10m_dominant', 'Dominant wind direction', 'Wind', '°', 'Daily dominant wind direction.'),

        variable('pressure_msl_mean', 'Mean sea-level pressure', 'Pressure & clouds', 'hPa', 'Daily mean sea-level pressure.'),
        variable('pressure_msl_max', 'Maximum sea-level pressure', 'Pressure & clouds', 'hPa', 'Daily maximum sea-level pressure.'),
        variable('pressure_msl_min', 'Minimum sea-level pressure', 'Pressure & clouds', 'hPa', 'Daily minimum sea-level pressure.'),
        variable('surface_pressure_mean', 'Mean surface pressure', 'Pressure & clouds', 'hPa', 'Daily mean surface pressure.'),
        variable('surface_pressure_max', 'Maximum surface pressure', 'Pressure & clouds', 'hPa', 'Daily maximum surface pressure.'),
        variable('surface_pressure_min', 'Minimum surface pressure', 'Pressure & clouds', 'hPa', 'Daily minimum surface pressure.'),
        variable('cloud_cover_mean', 'Mean cloud cover', 'Pressure & clouds', '%', 'Daily mean cloud cover.'),
        variable('cloud_cover_max', 'Maximum cloud cover', 'Pressure & clouds', '%', 'Daily maximum cloud cover.'),
        variable('cloud_cover_min', 'Minimum cloud cover', 'Pressure & clouds', '%', 'Daily minimum cloud cover.'),

        variable('shortwave_radiation_sum', 'Shortwave radiation sum', 'Solar, soil & agriculture', 'MJ/m²', 'Daily solar radiation sum.'),
        variable('et0_fao_evapotranspiration', 'Reference evapotranspiration (ET₀)', 'Solar, soil & agriculture', 'mm', 'Daily FAO-56 reference evapotranspiration.'),
        variable('et0_fao_evapotranspiration_sum', 'Reference evapotranspiration sum', 'Solar, soil & agriculture', 'mm', 'Daily sum of reference evapotranspiration.'),
        variable('soil_moisture_0_to_100cm_mean', 'Mean soil moisture (0–100 cm)', 'Solar, soil & agriculture', 'm³/m³', 'Daily mean soil moisture across the upper metre.'),
        variable('soil_moisture_0_to_7cm_mean', 'Mean soil moisture (0–7 cm)', 'Solar, soil & agriculture', 'm³/m³', 'Daily mean soil moisture from zero to seven centimetres.'),
        variable('soil_moisture_7_to_28cm_mean', 'Mean soil moisture (7–28 cm)', 'Solar, soil & agriculture', 'm³/m³', 'Daily mean soil moisture from seven to twenty-eight centimetres.'),
        variable('soil_moisture_28_to_100cm_mean', 'Mean soil moisture (28–100 cm)', 'Solar, soil & agriculture', 'm³/m³', 'Daily mean soil moisture from twenty-eight to one hundred centimetres.'),
        variable('soil_temperature_0_to_100cm_mean', 'Mean soil temperature (0–100 cm)', 'Solar, soil & agriculture', '°C', 'Daily mean soil temperature across the upper metre.'),
        variable('soil_temperature_0_to_7cm_mean', 'Mean soil temperature (0–7 cm)', 'Solar, soil & agriculture', '°C', 'Daily mean soil temperature from zero to seven centimetres.'),
        variable('soil_temperature_7_to_28cm_mean', 'Mean soil temperature (7–28 cm)', 'Solar, soil & agriculture', '°C', 'Daily mean soil temperature from seven to twenty-eight centimetres.'),
        variable('soil_temperature_28_to_100cm_mean', 'Mean soil temperature (28–100 cm)', 'Solar, soil & agriculture', '°C', 'Daily mean soil temperature from twenty-eight to one hundred centimetres.')
    ]
};

const DEFAULT_SELECTIONS = {
    hourly: new Set(['temperature_2m', 'relative_humidity_2m', 'precipitation', 'weather_code', 'wind_speed_10m']),
    daily: new Set(['temperature_2m_mean', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'weather_code'])
};

let mountedContainer = null;
let mountedOptions = null;
let uiState = null;
let geocodingTimer = null;
let geocodingController = null;

export function getWeatherVariables(frequency) {
    return WEATHER_VARIABLES[frequency] || [];
}

export function buildOpenMeteoArchiveUrl(draft) {
    const frequency = draft.frequency === 'daily' ? 'daily' : 'hourly';
    const params = new URLSearchParams({
        latitude: String(draft.city.latitude),
        longitude: String(draft.city.longitude),
        start_date: draft.startDate,
        end_date: draft.endDate,
        [frequency]: draft.variableIds.join(','),
        timezone: 'auto',
        temperature_unit: draft.temperatureUnit || 'celsius',
        wind_speed_unit: draft.windSpeedUnit || 'kmh',
        precipitation_unit: draft.precipitationUnit || 'mm'
    });

    return `${OPEN_METEO_ARCHIVE_URL}?${params.toString()}`;
}

export function estimateDatasetRows(startDate, endDate, frequency = 'hourly') {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end || end < start) {
        return 0;
    }

    const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    return dayCount * (frequency === 'daily' ? 1 : 24);
}

export function validateDatasetDraft(draft, today = formatDate(new Date())) {
    if (!draft.city || !Number.isFinite(Number(draft.city.latitude)) || !Number.isFinite(Number(draft.city.longitude))) {
        return 'Choose a city from the search results.';
    }
    if (!draft.startDate || !draft.endDate) {
        return 'Choose a start and end date.';
    }
    if (draft.startDate < MIN_ARCHIVE_DATE) {
        return `Historical data starts on ${MIN_ARCHIVE_DATE}.`;
    }
    if (draft.endDate > today) {
        return 'The Historical Weather API only supports dates up to today.';
    }
    if (draft.startDate > draft.endDate) {
        return 'The start date must be before the end date.';
    }
    if (!draft.variableIds?.length) {
        return 'Select at least one weather column.';
    }
    return '';
}

export function weatherResponseToCsv(payload, draft) {
    const frequency = draft.frequency === 'daily' ? 'daily' : 'hourly';
    const values = payload?.[frequency];
    if (!values?.time?.length) {
        throw new Error(`Open-Meteo returned no ${frequency} rows for this request.`);
    }

    const baseColumns = ['time', 'city', 'country', 'latitude', 'longitude', 'elevation', 'timezone'];
    const headers = [...baseColumns, ...draft.variableIds];
    const rows = values.time.map((time, index) => {
        const base = [
            time,
            draft.city.name,
            draft.city.country || '',
            payload.latitude ?? draft.city.latitude,
            payload.longitude ?? draft.city.longitude,
            payload.elevation ?? draft.city.elevation ?? '',
            payload.timezone || draft.city.timezone || 'GMT'
        ];
        const weatherValues = draft.variableIds.map((id) => values[id]?.[index] ?? '');
        return [...base, ...weatherValues].map(csvCell).join(',');
    });

    return `${headers.map(csvCell).join(',')}\n${rows.join('\n')}\n`;
}

export function mountWeatherDataset(container, options = {}) {
    unmountWeatherDataset();
    mountedContainer = container;
    mountedOptions = options;
    uiState = createInitialState();
    renderWeatherDataset();

    container.addEventListener('click', handleWeatherClick);
    container.addEventListener('input', handleWeatherInput);
    container.addEventListener('change', handleWeatherChange);
    container.addEventListener('keydown', handleWeatherKeydown);
    void loadLibrary();
}

export function unmountWeatherDataset() {
    if (geocodingTimer) {
        window.clearTimeout(geocodingTimer);
        geocodingTimer = null;
    }
    geocodingController?.abort();
    geocodingController = null;

    if (mountedContainer) {
        mountedContainer.removeEventListener('click', handleWeatherClick);
        mountedContainer.removeEventListener('input', handleWeatherInput);
        mountedContainer.removeEventListener('change', handleWeatherChange);
        mountedContainer.removeEventListener('keydown', handleWeatherKeydown);
    }

    mountedContainer = null;
    mountedOptions = null;
    uiState = null;
}

function createInitialState() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(yesterday);
    start.setDate(start.getDate() - 29);

    return {
        city: null,
        cityQuery: '',
        cityResults: [],
        citySearchStatus: 'idle',
        citySelectedIndex: -1,
        startDate: formatDate(start),
        endDate: formatDate(yesterday),
        frequency: 'hourly',
        selectedByFrequency: {
            hourly: new Set(DEFAULT_SELECTIONS.hourly),
            daily: new Set(DEFAULT_SELECTIONS.daily)
        },
        columnQuery: '',
        temperatureUnit: 'celsius',
        windSpeedUnit: 'kmh',
        precipitationUnit: 'mm',
        datasetName: '',
        generationStatus: 'idle',
        generationMessage: '',
        libraryStatus: 'loading',
        libraryMessage: '',
        libraryItems: []
    };
}

function renderWeatherDataset() {
    if (!mountedContainer || !uiState) {
        return;
    }

    const selected = uiState.selectedByFrequency[uiState.frequency];
    const estimatedRows = estimateDatasetRows(uiState.startDate, uiState.endDate, uiState.frequency);
    const estimatedCells = estimatedRows * (selected.size + 7);
    const user = mountedOptions?.session?.user || {};
    const creator = getCreatorName(user);
    const today = formatDate(new Date());
    const generationIsBusy = uiState.generationStatus === 'loading';
    const validationMessage = validateDatasetDraft(getDraft(), today);

    mountedContainer.innerHTML = `
        <section class="weather-page" aria-labelledby="weather-page-title">
            <header class="weather-page-header">
                <div>
                    <div class="weather-eyebrow-row">
                        <p class="weather-eyebrow">Research data workspace</p>
                        <span class="weather-source-badge"><span></span> Open-Meteo Historical</span>
                    </div>
                    <h1 id="weather-page-title">Weather Dataset Maker</h1>
                    <p>Turn historical weather observations into a clean CSV, then keep the request details visible to the whole lab.</p>
                </div>
                <a class="weather-doc-link" href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener noreferrer">API documentation ↗</a>
            </header>

            <div class="weather-builder-grid">
                <section class="weather-panel glass weather-location-panel" aria-labelledby="weather-location-title">
                    <div class="weather-panel-heading">
                        <span class="weather-step">1</span>
                        <div>
                            <h2 id="weather-location-title">Choose a city</h2>
                            <p>Search any city or postal code worldwide.</p>
                        </div>
                    </div>
                    <div class="weather-city-search ${uiState.cityResults.length || uiState.citySearchStatus !== 'idle' ? 'is-open' : ''}">
                        <span class="weather-field-icon" aria-hidden="true">⌕</span>
                        <input id="weather-city-search" type="search" value="${escapeHtml(uiState.cityQuery)}" placeholder="Search for Athens, Berlin, 10001…" autocomplete="off" aria-label="Search for a city" aria-controls="weather-city-results" aria-expanded="${uiState.cityResults.length > 0}">
                        ${uiState.cityQuery ? '<button type="button" class="weather-input-clear" data-weather-action="clear-city" aria-label="Clear city">×</button>' : ''}
                        ${renderCityResults()}
                    </div>
                    ${renderSelectedCity()}
                </section>

                <section class="weather-panel glass weather-window-panel" aria-labelledby="weather-window-title">
                    <div class="weather-panel-heading">
                        <span class="weather-step">2</span>
                        <div>
                            <h2 id="weather-window-title">Set the time window</h2>
                            <p>Historical coverage begins in 1940.</p>
                        </div>
                    </div>
                    <div class="weather-date-grid">
                        <label class="weather-field">
                            <span>Start date</span>
                            <input type="date" data-weather-field="start-date" min="${MIN_ARCHIVE_DATE}" max="${today}" value="${uiState.startDate}">
                        </label>
                        <span class="weather-date-arrow" aria-hidden="true">→</span>
                        <label class="weather-field">
                            <span>End date</span>
                            <input type="date" data-weather-field="end-date" min="${MIN_ARCHIVE_DATE}" max="${today}" value="${uiState.endDate}">
                        </label>
                    </div>
                    <div class="weather-presets" aria-label="Date range presets">
                        <span>Quick range</span>
                        <button type="button" data-weather-days="7">7 days</button>
                        <button type="button" data-weather-days="30">30 days</button>
                        <button type="button" data-weather-days="365">1 year</button>
                    </div>
                </section>
            </div>

            <section class="weather-panel glass weather-columns-panel" aria-labelledby="weather-columns-title">
                <div class="weather-columns-toolbar">
                    <div class="weather-panel-heading weather-panel-heading-inline">
                        <span class="weather-step">3</span>
                        <div>
                            <h2 id="weather-columns-title">Choose dataset columns</h2>
                            <p>Every standard field exposed by Open-Meteo's Best Match historical model.</p>
                        </div>
                    </div>
                    <div class="weather-frequency-switch" aria-label="Dataset frequency">
                        <button type="button" data-weather-frequency="hourly" class="${uiState.frequency === 'hourly' ? 'active' : ''}" aria-pressed="${uiState.frequency === 'hourly'}">Hourly</button>
                        <button type="button" data-weather-frequency="daily" class="${uiState.frequency === 'daily' ? 'active' : ''}" aria-pressed="${uiState.frequency === 'daily'}">Daily</button>
                    </div>
                </div>
                <div class="weather-column-actions">
                    <label class="weather-column-search">
                        <span aria-hidden="true">⌕</span>
                        <input type="search" data-weather-field="column-query" value="${escapeHtml(uiState.columnQuery)}" placeholder="Find a column…" aria-label="Find a weather column">
                    </label>
                    <div class="weather-selection-actions">
                        <span><strong>${selected.size}</strong> selected</span>
                        <button type="button" data-weather-action="select-visible">Select visible</button>
                        <button type="button" data-weather-action="clear-columns">Clear</button>
                    </div>
                </div>
                <div class="weather-variable-groups">
                    ${renderVariableGroups()}
                </div>
            </section>

            <section class="weather-generate-bar glass" aria-label="Dataset generation summary">
                <div class="weather-generate-stats">
                    <div><span>Estimated rows</span><strong>${formatNumber(estimatedRows)}</strong></div>
                    <div><span>Weather columns</span><strong>${selected.size}</strong></div>
                    <div><span>Created by</span><strong>${escapeHtml(creator)}</strong></div>
                </div>
                <div class="weather-generation-controls">
                    <label class="weather-name-field">
                        <span>Dataset name <em>optional</em></span>
                        <input type="text" data-weather-field="dataset-name" maxlength="90" value="${escapeHtml(uiState.datasetName)}" placeholder="e.g. Athens summer climate">
                    </label>
                    <details class="weather-unit-settings">
                        <summary>Units</summary>
                        <div class="weather-unit-popover glass">
                            ${renderUnitSelect('temperature-unit', 'Temperature', uiState.temperatureUnit, [['celsius', 'Celsius (°C)'], ['fahrenheit', 'Fahrenheit (°F)']])}
                            ${renderUnitSelect('wind-speed-unit', 'Wind speed', uiState.windSpeedUnit, [['kmh', 'km/h'], ['ms', 'm/s'], ['mph', 'mph'], ['kn', 'knots']])}
                            ${renderUnitSelect('precipitation-unit', 'Precipitation', uiState.precipitationUnit, [['mm', 'Millimetres'], ['inch', 'Inches']])}
                        </div>
                    </details>
                    <button class="weather-generate-button" type="button" data-weather-action="generate" ${generationIsBusy || validationMessage ? 'disabled' : ''}>
                        <span>${generationIsBusy ? 'Generating…' : 'Generate CSV'}</span>
                        <span aria-hidden="true">↓</span>
                    </button>
                </div>
                <div class="weather-generation-feedback ${uiState.generationStatus}" role="status" aria-live="polite">
                    ${escapeHtml(uiState.generationMessage || validationMessage || (estimatedCells > 1500000 ? 'Large request: generation may take a little longer.' : 'The CSV downloads to your device; metadata is added to the library.'))}
                </div>
            </section>

            <section class="weather-library" aria-labelledby="weather-library-title">
                <div class="weather-library-header">
                    <div>
                        <p class="weather-eyebrow">Shared history</p>
                        <h2 id="weather-library-title">Dataset library</h2>
                        <p>Request metadata is ready now. Server-hosted file retrieval will connect here later.</p>
                    </div>
                    <button class="weather-refresh-button" type="button" data-weather-action="refresh-library" ${uiState.libraryStatus === 'loading' ? 'disabled' : ''}>↻ Refresh</button>
                </div>
                ${renderLibrary()}
            </section>
        </section>
    `;
}

function renderCityResults() {
    if (uiState.citySearchStatus === 'idle') {
        return '<div id="weather-city-results" class="weather-city-results" role="listbox"></div>';
    }
    if (uiState.citySearchStatus === 'loading') {
        return '<div id="weather-city-results" class="weather-city-results weather-city-message" role="listbox"><span class="weather-mini-spinner"></span> Searching places…</div>';
    }
    if (uiState.citySearchStatus === 'error') {
        return `<div id="weather-city-results" class="weather-city-results weather-city-message weather-error" role="listbox">${escapeHtml(uiState.generationMessage || 'City search is unavailable.')}</div>`;
    }
    if (!uiState.cityResults.length) {
        return '<div id="weather-city-results" class="weather-city-results weather-city-message" role="listbox">No matching cities found.</div>';
    }

    return `
        <div id="weather-city-results" class="weather-city-results" role="listbox">
            ${uiState.cityResults.map((city, index) => `
                <button type="button" role="option" aria-selected="${index === uiState.citySelectedIndex}" class="weather-city-result ${index === uiState.citySelectedIndex ? 'active' : ''}" data-weather-city-index="${index}">
                    <span class="weather-city-pin" aria-hidden="true">⌖</span>
                    <span>
                        <strong>${escapeHtml(city.name)}</strong>
                        <small>${escapeHtml(formatCityContext(city))}</small>
                    </span>
                    <span class="weather-city-coordinates">${Number(city.latitude).toFixed(2)}, ${Number(city.longitude).toFixed(2)}</span>
                </button>
            `).join('')}
        </div>
    `;
}

function renderSelectedCity() {
    if (!uiState.city) {
        return `
            <div class="weather-location-empty">
                <span aria-hidden="true">◎</span>
                <p>Your selected city and coordinates will appear here.</p>
            </div>
        `;
    }

    return `
        <div class="weather-selected-city">
            <div class="weather-selected-city-icon" aria-hidden="true">⌖</div>
            <div>
                <span>Selected location</span>
                <strong>${escapeHtml(uiState.city.name)}</strong>
                <small>${escapeHtml(formatCityContext(uiState.city))}</small>
            </div>
            <div class="weather-selected-city-meta">
                <span>${Number(uiState.city.latitude).toFixed(4)}°</span>
                <span>${Number(uiState.city.longitude).toFixed(4)}°</span>
                ${Number.isFinite(Number(uiState.city.elevation)) ? `<span>${Math.round(Number(uiState.city.elevation))} m</span>` : ''}
            </div>
        </div>
    `;
}

function renderVariableGroups() {
    const query = uiState.columnQuery.trim().toLowerCase();
    const selected = uiState.selectedByFrequency[uiState.frequency];
    const variables = getWeatherVariables(uiState.frequency).filter((item) => {
        if (!query) {
            return true;
        }
        return `${item.label} ${item.id} ${item.group} ${item.description}`.toLowerCase().includes(query);
    });

    if (!variables.length) {
        return '<div class="weather-columns-empty">No columns match that search.</div>';
    }

    const groups = groupBy(variables, (item) => item.group);
    return Array.from(groups.entries()).map(([group, items]) => `
        <fieldset class="weather-variable-group">
            <legend>${escapeHtml(group)} <span>${items.length}</span></legend>
            <div class="weather-variable-grid">
                ${items.map((item) => `
                    <label class="weather-variable-card ${selected.has(item.id) ? 'selected' : ''}">
                        <input type="checkbox" data-weather-variable="${escapeHtml(item.id)}" ${selected.has(item.id) ? 'checked' : ''}>
                        <span class="weather-variable-check" aria-hidden="true">✓</span>
                        <span class="weather-variable-copy">
                            <strong>${escapeHtml(item.label)}</strong>
                            <small>${escapeHtml(item.description)}</small>
                        </span>
                        <span class="weather-variable-unit">${escapeHtml(item.unit)}</span>
                    </label>
                `).join('')}
            </div>
        </fieldset>
    `).join('');
}

function renderUnitSelect(field, label, currentValue, options) {
    return `
        <label>
            <span>${escapeHtml(label)}</span>
            <select data-weather-field="${escapeHtml(field)}">
                ${options.map(([value, text]) => `<option value="${escapeHtml(value)}" ${currentValue === value ? 'selected' : ''}>${escapeHtml(text)}</option>`).join('')}
            </select>
        </label>
    `;
}

function renderLibrary() {
    if (uiState.libraryStatus === 'loading') {
        return `
            <div class="weather-library-state glass">
                <span class="weather-library-loader"></span>
                <h3>Loading dataset history</h3>
                <p>Checking shared metadata and this browser's recent creations.</p>
            </div>
        `;
    }
    if (!uiState.libraryItems.length) {
        return `
            <div class="weather-library-state glass">
                <span class="weather-library-empty-icon" aria-hidden="true">▤</span>
                <h3>No datasets yet</h3>
                <p>Create the first weather dataset and its details will appear here.</p>
            </div>
        `;
    }

    return `
        ${uiState.libraryMessage ? `<div class="weather-library-notice">${escapeHtml(uiState.libraryMessage)}</div>` : ''}
        <div class="weather-library-list">
            ${uiState.libraryItems.map((item) => renderLibraryItem(item)).join('')}
        </div>
    `;
}

function renderLibraryItem(item) {
    const variables = Array.isArray(item.variable_labels) ? item.variable_labels : [];
    const visibleVariables = variables.slice(0, 4);
    const extraCount = Math.max(0, variables.length - visibleVariables.length);
    const city = normalizeStoredCity(item.city);
    const generatedAt = formatDateTime(item.generated_at);
    const sourceLabel = item.storage_status === 'stored' ? 'Stored file' : 'Metadata only';

    return `
        <article class="weather-library-card glass">
            <div class="weather-library-card-main">
                <div class="weather-file-icon" aria-hidden="true"><span>CSV</span></div>
                <div class="weather-library-card-copy">
                    <div class="weather-library-title-row">
                        <h3>${escapeHtml(item.name || item.file_name || 'Weather dataset')}</h3>
                        <span class="weather-storage-badge">${sourceLabel}</span>
                    </div>
                    <p class="weather-library-location">⌖ ${escapeHtml(city.name || 'Unknown city')}${city.country ? `, ${escapeHtml(city.country)}` : ''}</p>
                    <div class="weather-library-tags">
                        <span>${item.temporal_resolution === 'daily' ? 'Daily' : 'Hourly'}</span>
                        <span>${escapeHtml(item.start_date || '')} → ${escapeHtml(item.end_date || '')}</span>
                        <span>${formatNumber(item.row_count || 0)} rows</span>
                    </div>
                    <div class="weather-library-variables">
                        ${visibleVariables.map((label) => `<span>${escapeHtml(label)}</span>`).join('')}
                        ${extraCount ? `<span>+${extraCount} more</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="weather-library-card-side">
                <div class="weather-creator">
                    <span class="weather-creator-avatar">${escapeHtml(initials(item.creator_name || item.creator_email || 'User'))}</span>
                    <span><small>Created by</small><strong>${escapeHtml(item.creator_name || item.creator_email || 'iPRISM user')}</strong></span>
                </div>
                <time datetime="${escapeHtml(item.generated_at || '')}">${escapeHtml(generatedAt)}</time>
                ${item.request_url ? `<button type="button" class="weather-recreate-button" data-weather-recreate="${escapeHtml(item.id)}">Recreate CSV ↓</button>` : '<span class="weather-file-pending">File retrieval coming later</span>'}
            </div>
            <details class="weather-library-details">
                <summary>Dataset details</summary>
                <div>
                    <p><strong>Columns:</strong> ${escapeHtml(variables.join(', ') || 'Not recorded')}</p>
                    <p><strong>File name:</strong> ${escapeHtml(item.file_name || 'Not recorded')}</p>
                    <p><strong>Coordinates:</strong> ${Number(city.latitude || 0).toFixed(4)}, ${Number(city.longitude || 0).toFixed(4)}</p>
                </div>
            </details>
        </article>
    `;
}

async function handleWeatherClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !uiState) {
        return;
    }

    const cityResult = target.closest('[data-weather-city-index]');
    if (cityResult instanceof HTMLElement) {
        event.preventDefault();
        selectCity(Number(cityResult.dataset.weatherCityIndex));
        return;
    }

    const frequencyButton = target.closest('[data-weather-frequency]');
    if (frequencyButton instanceof HTMLElement) {
        event.preventDefault();
        uiState.frequency = frequencyButton.dataset.weatherFrequency === 'daily' ? 'daily' : 'hourly';
        uiState.columnQuery = '';
        renderWeatherDataset();
        return;
    }

    const preset = target.closest('[data-weather-days]');
    if (preset instanceof HTMLElement) {
        event.preventDefault();
        applyDatePreset(Number(preset.dataset.weatherDays));
        return;
    }

    const recreate = target.closest('[data-weather-recreate]');
    if (recreate instanceof HTMLElement) {
        event.preventDefault();
        const item = uiState.libraryItems.find((entry) => entry.id === recreate.dataset.weatherRecreate);
        if (item) {
            await recreateDataset(item);
        }
        return;
    }

    const actionNode = target.closest('[data-weather-action]');
    if (!(actionNode instanceof HTMLElement)) {
        return;
    }

    event.preventDefault();
    switch (actionNode.dataset.weatherAction) {
        case 'clear-city':
            uiState.city = null;
            uiState.cityQuery = '';
            uiState.cityResults = [];
            uiState.citySearchStatus = 'idle';
            renderWeatherDataset();
            document.querySelector('#weather-city-search')?.focus();
            break;
        case 'select-visible':
            getVisibleVariables().forEach((item) => uiState.selectedByFrequency[uiState.frequency].add(item.id));
            renderWeatherDataset();
            break;
        case 'clear-columns':
            uiState.selectedByFrequency[uiState.frequency].clear();
            renderWeatherDataset();
            break;
        case 'generate':
            await generateDataset();
            break;
        case 'refresh-library':
            await loadLibrary();
            break;
        default:
            break;
    }
}

function handleWeatherInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !uiState) {
        return;
    }

    if (target.id === 'weather-city-search') {
        uiState.cityQuery = target.value;
        uiState.city = null;
        scheduleCitySearch(target.value);
        return;
    }

    if (target.dataset.weatherField === 'column-query') {
        uiState.columnQuery = target.value;
        preserveFocusAndRender('[data-weather-field="column-query"]', target.selectionStart);
        return;
    }

    if (target.dataset.weatherField === 'dataset-name') {
        uiState.datasetName = target.value;
    }
}

function handleWeatherChange(event) {
    const target = event.target;
    if (!uiState) {
        return;
    }

    if (target instanceof HTMLInputElement && target.dataset.weatherVariable) {
        const selected = uiState.selectedByFrequency[uiState.frequency];
        if (target.checked) {
            selected.add(target.dataset.weatherVariable);
        } else {
            selected.delete(target.dataset.weatherVariable);
        }
        renderWeatherDataset();
        return;
    }

    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
        return;
    }

    const field = target.dataset.weatherField;
    if (field === 'start-date') uiState.startDate = target.value;
    if (field === 'end-date') uiState.endDate = target.value;
    if (field === 'temperature-unit') uiState.temperatureUnit = target.value;
    if (field === 'wind-speed-unit') uiState.windSpeedUnit = target.value;
    if (field === 'precipitation-unit') uiState.precipitationUnit = target.value;
    renderWeatherDataset();
}

function handleWeatherKeydown(event) {
    if (!uiState || event.target?.id !== 'weather-city-search' || !uiState.cityResults.length) {
        return;
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        uiState.citySelectedIndex = (uiState.citySelectedIndex + 1) % uiState.cityResults.length;
        renderWeatherDataset();
        document.querySelector('#weather-city-search')?.focus();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        uiState.citySelectedIndex = (uiState.citySelectedIndex - 1 + uiState.cityResults.length) % uiState.cityResults.length;
        renderWeatherDataset();
        document.querySelector('#weather-city-search')?.focus();
    } else if (event.key === 'Enter' && uiState.citySelectedIndex >= 0) {
        event.preventDefault();
        selectCity(uiState.citySelectedIndex);
    } else if (event.key === 'Escape') {
        uiState.cityResults = [];
        uiState.citySearchStatus = 'idle';
        renderWeatherDataset();
        document.querySelector('#weather-city-search')?.focus();
    }
}

function scheduleCitySearch(query) {
    if (geocodingTimer) {
        window.clearTimeout(geocodingTimer);
    }
    geocodingController?.abort();

    const trimmed = query.trim();
    if (trimmed.length < 2) {
        uiState.cityResults = [];
        uiState.citySearchStatus = 'idle';
        uiState.citySelectedIndex = -1;
        renderWeatherDataset();
        document.querySelector('#weather-city-search')?.focus();
        return;
    }

    uiState.citySearchStatus = 'loading';
    renderWeatherDataset();
    document.querySelector('#weather-city-search')?.focus();
    geocodingTimer = window.setTimeout(() => void searchCities(trimmed), 320);
}

async function searchCities(query) {
    geocodingController = new AbortController();
    const params = new URLSearchParams({
        name: query,
        count: '7',
        language: document.documentElement.lang || 'en',
        format: 'json'
    });

    try {
        const response = await fetch(`${OPEN_METEO_GEOCODING_URL}?${params}`, {
            signal: geocodingController.signal
        });
        if (!response.ok) {
            throw new Error(`City search failed (${response.status}).`);
        }
        const payload = await response.json();
        if (!uiState || uiState.cityQuery.trim() !== query) {
            return;
        }
        uiState.cityResults = payload.results || [];
        uiState.citySelectedIndex = uiState.cityResults.length ? 0 : -1;
        uiState.citySearchStatus = 'ready';
        renderWeatherDataset();
        document.querySelector('#weather-city-search')?.focus();
    } catch (error) {
        if (error?.name === 'AbortError' || !uiState) {
            return;
        }
        uiState.cityResults = [];
        uiState.citySearchStatus = 'error';
        uiState.generationMessage = error instanceof Error ? error.message : 'City search is unavailable.';
        renderWeatherDataset();
    }
}

function selectCity(index) {
    const city = uiState.cityResults[index];
    if (!city) {
        return;
    }

    uiState.city = {
        id: city.id,
        name: city.name,
        country: city.country || city.country_code || '',
        countryCode: city.country_code || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude,
        elevation: city.elevation,
        timezone: city.timezone || ''
    };
    uiState.cityQuery = city.name;
    uiState.cityResults = [];
    uiState.citySearchStatus = 'idle';
    uiState.citySelectedIndex = -1;
    renderWeatherDataset();
}

function applyDatePreset(days) {
    if (!Number.isInteger(days) || days < 1) {
        return;
    }
    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    uiState.startDate = formatDate(start);
    uiState.endDate = formatDate(end);
    renderWeatherDataset();
}

async function generateDataset() {
    const draft = getDraft();
    const validationMessage = validateDatasetDraft(draft);
    if (validationMessage) {
        uiState.generationStatus = 'error';
        uiState.generationMessage = validationMessage;
        renderWeatherDataset();
        return;
    }

    uiState.generationStatus = 'loading';
    uiState.generationMessage = `Requesting ${formatNumber(estimateDatasetRows(draft.startDate, draft.endDate, draft.frequency))} rows from Open-Meteo…`;
    renderWeatherDataset();

    const requestUrl = buildOpenMeteoArchiveUrl(draft);
    try {
        const response = await fetch(requestUrl);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.error) {
            throw new Error(payload.reason || `Open-Meteo request failed (${response.status}).`);
        }

        const csv = weatherResponseToCsv(payload, draft);
        const rowCount = payload[draft.frequency]?.time?.length || 0;
        const metadata = createMetadataRecord(draft, payload, requestUrl, rowCount);
        downloadTextFile(csv, metadata.file_name, 'text/csv;charset=utf-8');
        const persistence = await saveMetadata(metadata);

        uiState.generationStatus = 'success';
        uiState.generationMessage = persistence === 'remote'
            ? `${metadata.file_name} downloaded and its metadata was added to the shared library.`
            : `${metadata.file_name} downloaded. Metadata is saved in this browser until the database migration is applied.`;
        uiState.datasetName = '';
        await loadLibrary({ preserveGenerationMessage: true });
    } catch (error) {
        uiState.generationStatus = 'error';
        uiState.generationMessage = error instanceof Error ? error.message : 'The dataset could not be generated.';
        renderWeatherDataset();
    }
}

async function recreateDataset(item) {
    if (!item.request_url) {
        return;
    }
    uiState.generationStatus = 'loading';
    uiState.generationMessage = `Recreating ${item.file_name || 'dataset'} from Open-Meteo…`;
    renderWeatherDataset();

    try {
        const response = await fetch(item.request_url);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.error) {
            throw new Error(payload.reason || `Open-Meteo request failed (${response.status}).`);
        }
        const city = normalizeStoredCity(item.city);
        const draft = {
            city,
            frequency: item.temporal_resolution,
            variableIds: item.variable_ids || [],
            startDate: item.start_date,
            endDate: item.end_date
        };
        const csv = weatherResponseToCsv(payload, draft);
        downloadTextFile(csv, item.file_name || `${slugify(city.name || 'weather')}.csv`, 'text/csv;charset=utf-8');
        uiState.generationStatus = 'success';
        uiState.generationMessage = `${item.file_name || 'Dataset'} was recreated and downloaded.`;
    } catch (error) {
        uiState.generationStatus = 'error';
        uiState.generationMessage = error instanceof Error ? error.message : 'The dataset could not be recreated.';
    }
    renderWeatherDataset();
}

function createMetadataRecord(draft, payload, requestUrl, rowCount) {
    const user = mountedOptions?.session?.user || {};
    const generatedAt = new Date().toISOString();
    const variableCatalog = getWeatherVariables(draft.frequency);
    const variableLabels = draft.variableIds.map((id) => variableCatalog.find((item) => item.id === id)?.label || id);
    const baseName = uiState.datasetName.trim() || `${draft.city.name} ${draft.frequency} weather`;
    const fileName = `${slugify(baseName)}_${draft.startDate}_${draft.endDate}.csv`;

    return {
        id: crypto.randomUUID(),
        user_id: user.id || null,
        creator_name: getCreatorName(user),
        creator_email: user.email || null,
        name: baseName,
        city: draft.city,
        temporal_resolution: draft.frequency,
        variable_ids: draft.variableIds,
        variable_labels: variableLabels,
        start_date: draft.startDate,
        end_date: draft.endDate,
        generated_at: generatedAt,
        row_count: rowCount,
        column_count: draft.variableIds.length + 7,
        file_name: fileName,
        storage_status: 'metadata_only',
        request_url: requestUrl,
        api_generation_time_ms: payload.generationtime_ms ?? null,
        response_timezone: payload.timezone || null,
        units: payload[`${draft.frequency}_units`] || {}
    };
}

async function saveMetadata(metadata) {
    saveLocalMetadata(metadata);
    const supabase = mountedOptions?.supabase;
    if (!supabase || !metadata.user_id) {
        return 'local';
    }

    const { error } = await supabase.from('weather_datasets').insert(metadata);
    if (error) {
        console.warn('Weather metadata was saved locally because Supabase insert failed:', error.message);
        return 'local';
    }
    return 'remote';
}

async function loadLibrary(options = {}) {
    if (!uiState) {
        return;
    }
    uiState.libraryStatus = 'loading';
    uiState.libraryMessage = '';
    renderWeatherDataset();

    const localItems = readLocalMetadata();
    let remoteItems = [];
    const supabase = mountedOptions?.supabase;
    const hasAuthenticatedUser = Boolean(mountedOptions?.session?.user?.id);
    if (supabase && hasAuthenticatedUser) {
        const { data, error } = await supabase
            .from('weather_datasets')
            .select('*')
            .order('generated_at', { ascending: false })
            .limit(MAX_LIBRARY_ITEMS);
        if (error) {
            uiState.libraryMessage = 'Showing this browser’s metadata. Apply the weather_datasets migration to enable the shared library.';
        } else {
            remoteItems = data || [];
        }
    } else {
        uiState.libraryMessage = localItems.length ? 'Showing metadata saved in this browser.' : '';
    }

    uiState.libraryItems = mergeLibraryItems(remoteItems, localItems).slice(0, MAX_LIBRARY_ITEMS);
    uiState.libraryStatus = 'ready';
    if (!options.preserveGenerationMessage && uiState.generationStatus !== 'loading') {
        uiState.generationStatus = 'idle';
        uiState.generationMessage = '';
    }
    renderWeatherDataset();
}

function saveLocalMetadata(metadata) {
    try {
        const items = readLocalMetadata().filter((item) => item.id !== metadata.id);
        items.unshift(metadata);
        localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(items.slice(0, MAX_LIBRARY_ITEMS)));
    } catch (error) {
        console.warn('Weather metadata could not be saved locally:', error);
    }
}

function readLocalMetadata() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LOCAL_LIBRARY_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function mergeLibraryItems(remoteItems, localItems) {
    const byId = new Map();
    [...localItems, ...remoteItems].forEach((item) => {
        if (item?.id) byId.set(item.id, item);
    });
    return Array.from(byId.values()).sort((a, b) => String(b.generated_at || '').localeCompare(String(a.generated_at || '')));
}

function getDraft() {
    return {
        city: uiState.city,
        frequency: uiState.frequency,
        variableIds: Array.from(uiState.selectedByFrequency[uiState.frequency]),
        startDate: uiState.startDate,
        endDate: uiState.endDate,
        temperatureUnit: uiState.temperatureUnit,
        windSpeedUnit: uiState.windSpeedUnit,
        precipitationUnit: uiState.precipitationUnit
    };
}

function getVisibleVariables() {
    const query = uiState.columnQuery.trim().toLowerCase();
    return getWeatherVariables(uiState.frequency).filter((item) => !query
        || `${item.label} ${item.id} ${item.group} ${item.description}`.toLowerCase().includes(query));
}

function preserveFocusAndRender(selector, selectionStart) {
    renderWeatherDataset();
    const input = document.querySelector(selector);
    if (input instanceof HTMLInputElement) {
        input.focus();
        if (Number.isInteger(selectionStart)) input.setSelectionRange(selectionStart, selectionStart);
    }
}

function downloadTextFile(content, fileName, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function normalizeStoredCity(city) {
    if (city && typeof city === 'object') return city;
    if (typeof city === 'string') {
        try {
            return JSON.parse(city);
        } catch {
            return { name: city };
        }
    }
    return {};
}

function formatCityContext(city) {
    return [city.admin1, city.country].filter(Boolean).join(', ') || city.country_code || 'Location';
}

function getCreatorName(user) {
    return user?.user_metadata?.full_name
        || user?.user_metadata?.user_name
        || user?.email
        || 'Authenticated user';
}

function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function formatNumber(value) {
    return new Intl.NumberFormat().format(Number(value) || 0);
}

function groupBy(items, keyFn) {
    const groups = new Map();
    items.forEach((item) => {
        const key = keyFn(item);
        groups.set(key, [...(groups.get(key) || []), item]);
    });
    return groups;
}

function csvCell(value) {
    const string = value == null ? '' : String(value);
    if (/[",\n\r]/.test(string)) {
        return `"${string.replace(/"/g, '""')}"`;
    }
    return string;
}

function slugify(value) {
    return String(value || 'weather-dataset')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72) || 'weather-dataset';
}

function initials(value) {
    return String(value)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'U';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
