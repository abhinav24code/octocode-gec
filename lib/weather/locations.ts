/**
 * PlanSafe India — Agricultural Locations Registry
 * Pre-configured agricultural locations with geographic and district metadata,
 * focused on Chhattisgarh and regional agricultural hubs.
 */

import { WeatherLocation } from "@/types";

export const CHHATTISGARH_LOCATIONS: WeatherLocation[] = [
  {
    name: "Raipur (Sejbahar / GEC Farmlands)",
    village: "Sejbahar",
    district: "Raipur",
    state: "Chhattisgarh",
    latitude: 21.1626,
    longitude: 81.659,
  },
  {
    name: "Raipur (Arang Agricultural Block)",
    village: "Arang",
    district: "Raipur",
    state: "Chhattisgarh",
    latitude: 21.1945,
    longitude: 81.9682,
  },
  {
    name: "Raipur (Dharsiwa / Mandir Hasaud)",
    village: "Mandir Hasaud",
    district: "Raipur",
    state: "Chhattisgarh",
    latitude: 21.2514,
    longitude: 81.6296,
  },
  {
    name: "Bilaspur (Bilha Paddy Belt)",
    village: "Bilha",
    district: "Bilaspur",
    state: "Chhattisgarh",
    latitude: 22.0797,
    longitude: 82.1409,
  },
  {
    name: "Bastar (Jagdalpur Tribal Farmlands)",
    village: "Tokapal",
    district: "Bastar",
    state: "Chhattisgarh",
    latitude: 19.0744,
    longitude: 82.0081,
  },
  {
    name: "Durg (Patan Vegetable Belt)",
    village: "Patan",
    district: "Durg",
    state: "Chhattisgarh",
    latitude: 21.0505,
    longitude: 81.5369,
  },
  {
    name: "Rajnandgaon (Dongargarh Rainfed Belt)",
    village: "Dongargarh",
    district: "Rajnandgaon",
    state: "Chhattisgarh",
    latitude: 21.1915,
    longitude: 80.7605,
  },
  {
    name: "Surguja (Ambikapur Highland Farms)",
    village: "Lundra",
    district: "Surguja",
    state: "Chhattisgarh",
    latitude: 23.1186,
    longitude: 83.1979,
  },
  {
    name: "Dhamtari (Kurud Canal Irrigation Hub)",
    village: "Kurud",
    district: "Dhamtari",
    state: "Chhattisgarh",
    latitude: 20.8256,
    longitude: 81.7144,
  },
  {
    name: "Mahasamund (Pithora Pulses Belt)",
    village: "Pithora",
    district: "Mahasamund",
    state: "Chhattisgarh",
    latitude: 21.2598,
    longitude: 82.5222,
  },
  {
    name: "Kabirdham (Kawardha Sugarcane Zone)",
    village: "Bodla",
    district: "Kabirdham",
    state: "Chhattisgarh",
    latitude: 22.0167,
    longitude: 81.25,
  },
];

export const DEFAULT_LOCATION: WeatherLocation = CHHATTISGARH_LOCATIONS[0];

/**
 * Returns all configured agricultural locations for dropdown selection.
 */
export function getAvailableLocations(): WeatherLocation[] {
  return CHHATTISGARH_LOCATIONS;
}

/**
 * Resolves a location from a search query, matching name, village, or district.
 * Defaults to Raipur (Arang) if no match is found.
 */
export function resolveLocation(query?: string | null): WeatherLocation {
  if (!query || query.trim() === "") {
    return DEFAULT_LOCATION;
  }

  const normalized = query.trim().toLowerCase();

  const match = CHHATTISGARH_LOCATIONS.find((loc) => {
    return (
      loc.name.toLowerCase().includes(normalized) ||
      loc.village.toLowerCase().includes(normalized) ||
      loc.district.toLowerCase().includes(normalized)
    );
  });

  return match ?? {
    name: query.trim(),
    village: query.trim(),
    district: "Chhattisgarh",
    state: "Chhattisgarh",
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
  };
}

/**
 * Finds the nearest configured location based on Euclidean distance.
 */
export function findNearestLocation(lat: number, lon: number): WeatherLocation {
  let nearest = CHHATTISGARH_LOCATIONS[0];
  let minDistance = Number.POSITIVE_INFINITY;

  for (const loc of CHHATTISGARH_LOCATIONS) {
    const dLat = loc.latitude - lat;
    const dLon = loc.longitude - lon;
    const distanceSq = dLat * dLat + dLon * dLon;

    if (distanceSq < minDistance) {
      minDistance = distanceSq;
      nearest = loc;
    }
  }

  return nearest;
}
