/**
 * PlanSafe India — Normalized Weather Data Contract
 * Shared across Backend (Member 1), UI (Member 2),
 * Rule Assessment (Member 3), and Scheduling Recovery (Member 4).
 */

export interface WeatherLocation {
  name: string;
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface WeatherPeriod {
  /** ISO 8601 start timestamp of the period, e.g. 2026-10-29T06:00:00+05:30 */
  startTime: string;
  /** ISO 8601 end timestamp of the period */
  endTime: string;
  /** Temperature metrics in Celsius */
  temperatureC: {
    min: number;
    max: number;
    current?: number;
  };
  /** Expected precipitation depth in millimeters (mm) */
  rainfallMm: number;
  /** Probability of precipitation (0 to 100%) */
  precipitationProbability: number;
  /** Sustained wind speed in km/h */
  windSpeedKmh: number;
  /** Peak wind gust in km/h (if reported by provider) */
  windGustKmh: number;
  /** Relative humidity percentage (0 to 100%) */
  relativeHumidityPercent: number;
  /** Standardized condition code: 'clear' | 'partly_cloudy' | 'overcast' | 'light_rain' | 'moderate_rain' | 'heavy_rain' | 'storm' */
  conditionCode: string;
  /** Human-readable weather condition in English */
  conditionText: string;
  /** Human-readable weather condition in Hindi */
  conditionTextHindi?: string;
}

export interface WeatherQuality {
  /** True when all core metrics (rainfall, wind, temp, humidity) were available */
  isComplete: boolean;
  /** List of any fields omitted by the provider or failed validation */
  missingFields: string[];
  /** True if deterministic fallback/simulated scenario data was used */
  isSimulated: boolean;
  /** Additional diagnostic notes regarding provider response */
  notes?: string[];
}

export interface NormalizedWeatherForecast {
  location: WeatherLocation;
  /** ISO 8601 timestamp when backend requested & normalized the data */
  fetchedAt: string;
  /** ISO 8601 model run or forecast issue timestamp from the meteorological service */
  forecastIssuedAt: string;
  /** Provider identifier */
  source: "OPEN_METEO_INDIA" | "IMD_DIRECT" | "SIMULATED_DEMO";
  /** Chronologically sorted forecast slices (hourly or 3-hour slices over 7 days) */
  periods: WeatherPeriod[];
  /** Data fidelity and completeness metadata */
  dataQuality: WeatherQuality;
}
