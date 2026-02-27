export interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const watchLocation = (callback: (location: Location) => void): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('Geolocation error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

export const stopWatchingLocation = (watchId: number) => {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

export const formatLocation = (location: Location): string => {
  return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
};

export const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'FleetVision/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const address = data.display_name || 'Unknown Location';
    const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown City';
    const area = data.address?.suburb || data.address?.neighbourhood || '';
    
    return area ? `${area}, ${city}` : city;
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Location unavailable';
  }
};
