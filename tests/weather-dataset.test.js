import test from 'node:test';
import assert from 'node:assert/strict';
import {
    WEATHER_VARIABLES,
    buildOpenMeteoArchiveUrl,
    estimateDatasetRows,
    validateDatasetDraft,
    weatherResponseToCsv
} from '../weather-dataset.js';

const city = {
    name: 'Athens',
    country: 'Greece',
    latitude: 37.9838,
    longitude: 23.7275,
    elevation: 70,
    timezone: 'Europe/Athens'
};

test('exposes a comprehensive, unique historical weather catalog', () => {
    assert.ok(WEATHER_VARIABLES.hourly.length >= 45);
    assert.ok(WEATHER_VARIABLES.daily.length >= 50);

    for (const variables of Object.values(WEATHER_VARIABLES)) {
        assert.equal(new Set(variables.map((item) => item.id)).size, variables.length);
        variables.forEach((item) => {
            assert.ok(item.label.length > 3);
            assert.ok(item.group.length > 3);
            assert.ok(item.description.endsWith('.'));
        });
    }
});

test('builds an archive request with city, dates, variables, timezone, and units', () => {
    const url = new URL(buildOpenMeteoArchiveUrl({
        city,
        frequency: 'hourly',
        variableIds: ['temperature_2m', 'relative_humidity_2m'],
        startDate: '2025-01-01',
        endDate: '2025-01-02',
        temperatureUnit: 'fahrenheit',
        windSpeedUnit: 'mph',
        precipitationUnit: 'inch'
    }));

    assert.equal(url.origin, 'https://archive-api.open-meteo.com');
    assert.equal(url.pathname, '/v1/archive');
    assert.equal(url.searchParams.get('latitude'), String(city.latitude));
    assert.equal(url.searchParams.get('hourly'), 'temperature_2m,relative_humidity_2m');
    assert.equal(url.searchParams.get('timezone'), 'auto');
    assert.equal(url.searchParams.get('temperature_unit'), 'fahrenheit');
    assert.equal(url.searchParams.get('wind_speed_unit'), 'mph');
    assert.equal(url.searchParams.get('precipitation_unit'), 'inch');
});

test('estimates inclusive hourly and daily row counts', () => {
    assert.equal(estimateDatasetRows('2025-01-01', '2025-01-02', 'hourly'), 48);
    assert.equal(estimateDatasetRows('2025-01-01', '2025-01-02', 'daily'), 2);
    assert.equal(estimateDatasetRows('2025-01-02', '2025-01-01', 'daily'), 0);
});

test('validates the required city, date order, archive limit, and columns', () => {
    const base = {
        city,
        startDate: '2025-01-01',
        endDate: '2025-01-02',
        variableIds: ['temperature_2m']
    };

    assert.equal(validateDatasetDraft(base, '2025-02-01'), '');
    assert.match(validateDatasetDraft({ ...base, city: null }, '2025-02-01'), /Choose a city/);
    assert.match(validateDatasetDraft({ ...base, startDate: '2025-01-03' }, '2025-02-01'), /start date/);
    assert.match(validateDatasetDraft({ ...base, endDate: '2025-02-02' }, '2025-02-01'), /up to today/);
    assert.match(validateDatasetDraft({ ...base, variableIds: [] }, '2025-02-01'), /at least one/);
});

test('converts Open-Meteo rows to a machine-friendly escaped CSV', () => {
    const csv = weatherResponseToCsv({
        latitude: 37.98,
        longitude: 23.72,
        elevation: 70,
        timezone: 'Europe/Athens',
        hourly: {
            time: ['2025-01-01T00:00', '2025-01-01T01:00'],
            temperature_2m: [12.3, 11.9],
            relative_humidity_2m: [71, 73]
        }
    }, {
        city: { ...city, name: 'Athens, Centre' },
        frequency: 'hourly',
        variableIds: ['temperature_2m', 'relative_humidity_2m']
    });

    const lines = csv.trim().split('\n');
    assert.equal(lines.length, 3);
    assert.equal(lines[0], 'time,city,country,latitude,longitude,elevation,timezone,temperature_2m,relative_humidity_2m');
    assert.match(lines[1], /"Athens, Centre"/);
    assert.match(lines[1], /,12.3,71$/);
    assert.match(lines[2], /,11.9,73$/);
});
