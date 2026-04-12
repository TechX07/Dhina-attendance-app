/**
 * Location-based attendance restriction config.
 *
 * IMPORTANT:
 * Replace LATITUDE and LONGITUDE with exact coordinates from your Google Maps place.
 * Keep RADIUS_METERS slightly larger (for GPS variance), e.g. 80-150 meters.
 */

export const OFFICE_LOCATION = {
    name: 'DHINA AUTOMOBILES',
    latitude: 10.767535411876464,
    longitude: 78.69382378721149,
    mapsLink: 'https://share.google/wJmlgkbrcIR0tssFF',
};

export const LOCATION_RADIUS_METERS = 120;

// Keep TRUE to enforce location check before marking attendance.
export const ENABLE_LOCATION_RESTRICTION = true;

// Set TRUE to bypass geofence on localhost during development.
export const ALLOW_LOCALHOST_LOCATION_BYPASS = true;
