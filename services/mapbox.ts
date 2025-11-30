
import { Coordinates, NavigationRoute } from '../types';
import { MAPBOX_ACCESS_TOKEN } from '../constants';

const MAPBOX_TOKEN = MAPBOX_ACCESS_TOKEN;

export const getDirections = async (start: Coordinates, end: Coordinates): Promise<NavigationRoute | null> => {
  if (!MAPBOX_TOKEN) {
    console.error("Mapbox Token missing");
    return null;
  }

  try {
    // Request annotations=maxspeed to get speed limit data
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?steps=true&geometries=geojson&annotations=maxspeed&access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();

    // Use Optional Chaining for safety against undefined 'routes[0]'
    const route = data?.routes?.[0];

    if (route) {
      // Safety check: Ensure legs exist before accessing index 0
      const leg = route.legs?.[0];
      
      if (!leg) {
        console.warn("Route found but no legs returned", route);
        return null;
      }

      const steps = leg.steps;
      if (!steps || !Array.isArray(steps)) {
         console.warn("Route leg found but no steps returned");
         return null;
      }

      // Parse Maxspeed Annotations
      const maxspeeds = leg.annotation?.maxspeed; // Array of { speed: number, unit: string } or unknown objects
      
      let annotationCursor = 0;

      const mappedSteps = steps.map((step: any) => {
        const resultStep = {
          instruction: step.maneuver?.instruction || "Follow route",
          distance: step.distance || 0,
          duration: step.duration || 0,
          maneuver: step.maneuver || { location: [0,0], type: 'arrive' },
          speedLimit: undefined as number | undefined,
          speedLimitUnit: undefined as string | undefined
        };

        // Map annotations to this step
        if (maxspeeds && Array.isArray(maxspeeds)) {
           const stepGeom = step.geometry;
           const coordCount = stepGeom?.coordinates?.length || 0;
           
           if (coordCount > 0 && maxspeeds.length > annotationCursor) {
             for (let k = 0; k < coordCount; k++) {
               const speedData = maxspeeds[annotationCursor + k];
               if (speedData && typeof speedData === 'object' && 'speed' in speedData) {
                 resultStep.speedLimit = speedData.speed;
                 resultStep.speedLimitUnit = speedData.unit;
                 break; // Found a speed limit for this step, stop searching
               }
             }
             annotationCursor += Math.max(0, coordCount - 1); 
           }
        }

        return resultStep;
      });

      return {
        geometry: route.geometry,
        duration: route.duration,
        distance: route.distance,
        steps: mappedSteps
      };
    }
    return null;
  } catch (error) {
    console.error("Mapbox API Error:", error);
    return null;
  }
};

export const geocodeAddress = async (address: string, proximity?: Coordinates): Promise<Coordinates | null> => {
  if (!MAPBOX_TOKEN) return null;

  try {
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    
    // Bias results towards user location if provided
    if (proximity) {
      url += `&proximity=${proximity.lng},${proximity.lat}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    // Use Optional Chaining for safety against undefined 'features[0]'
    const feature = data?.features?.[0];

    if (feature) {
      if (feature.center && Array.isArray(feature.center) && feature.center.length >= 2) {
        const [lng, lat] = feature.center;
        return { lat, lng };
      }
    }
    return null;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
};
