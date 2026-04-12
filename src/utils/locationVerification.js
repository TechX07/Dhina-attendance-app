function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

// Returns distance in meters between two coordinates.
export function distanceInMeters(fromLat, fromLng, toLat, toLng) {
    const earthRadius = 6371000;
    const dLat = toRadians(toLat - fromLat);
    const dLng = toRadians(toLng - fromLng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(fromLat)) *
            Math.cos(toRadians(toLat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

export async function getCurrentCoordinates(options = {}) {
    if (!('geolocation' in navigator)) {
        throw new Error('Geolocation is not supported on this device/browser.');
    }

    const defaults = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
    };

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    reject(new Error('Location permission denied. Please allow location access.'));
                    return;
                }

                if (error.code === error.POSITION_UNAVAILABLE) {
                    reject(new Error('Location unavailable. Please enable GPS/location services.'));
                    return;
                }

                if (error.code === error.TIMEOUT) {
                    reject(new Error('Location request timed out. Try again in open sky/network.'));
                    return;
                }

                reject(new Error('Unable to fetch your current location.'));
            },
            { ...defaults, ...options }
        );
    });
}

export async function verifyLocationInRadius({ targetLatitude, targetLongitude, radiusMeters }) {
    if (typeof targetLatitude !== 'number' || typeof targetLongitude !== 'number') {
        throw new Error('Office location coordinates are not configured correctly.');
    }

    const current = await getCurrentCoordinates();
    const distance = distanceInMeters(
        current.latitude,
        current.longitude,
        targetLatitude,
        targetLongitude
    );

    return {
        isWithinRadius: distance <= radiusMeters,
        distance,
        current,
    };
}
