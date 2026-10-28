/**
 * PlanSafe India — Weather Normalization Engine
 * Converts raw provider payloads into the unified NormalizedWeatherForecast contract.
 */

import {
  NormalizedWeatherForecast,
  WeatherLocation,
  WeatherPeriod,
  WeatherQuality,
} from "@/types";
import { interpretWmoCode } from "./wmo-codes";

export interface RawOpenMeteoPayload {
  latitude: number;
  longitude: number;
  generationtime_ms?: number;
  utc_offset_seconds?: number;
  timezone?: string;
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    relative_humidity_2m: (number | null)[];
    precipitation: (number | null)[];
    precipitation_probability: (number | null)[];
    wind_speed_10m: (number | null)[];
    wind_gusts_10m: (number | null)[];
    weather_code: (number | null)[];
  };
}

/**
 * Normalizes an Open-Meteo API payload into the standard contract.
 */
export function normalizeOpenMeteoForecast(
  raw: RawOpenMeteoPayload,
  location: WeatherLocation
): NormalizedWeatherForecast {
  const missingFieldsSet = new Set<string>();
  const hourly = raw.hourly;
  const periods: WeatherPeriod[] = [];
  const fetchedAt = new Date().toISOString();

  const count = hourly.time?.length ?? 0;

  for (let i = 0; i < count; i++) {
    const timeStr = hourly.time[i];
    // Open-Meteo gives local time strings e.g. "2026-10-29T06:00"
    // We convert to ISO 8601 with Asia/Kolkata offset (+05:30)
    const startDate = new Date(`${timeStr}:00+05:30`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    const temp = hourly.temperature_2m?.[i];
    const precip = hourly.precipitation?.[i];
    const precipProb = hourly.precipitation_probability?.[i];
    const windSpeed = hourly.wind_speed_10m?.[i];
    const windGust = hourly.wind_gusts_10m?.[i];
    const humidity = hourly.relative_humidity_2m?.[i];
    const code = hourly.weather_code?.[i];

    if (temp === null || temp === undefined) missingFieldsSet.add("temperature");
    if (precip === null || precip === undefined) missingFieldsSet.add("rainfall");
    if (precipProb === null || precipProb === undefined) missingFieldsSet.add("precipitation_probability");
    if (windSpeed === null || windSpeed === undefined) missingFieldsSet.add("wind_speed");
    if (humidity === null || humidity === undefined) missingFieldsSet.add("humidity");

    const wmo = interpretWmoCode(code ?? 0);

    periods.push({
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      temperatureC: {
        min: temp ?? 25,
        max: temp ?? 25,
        current: temp ?? 25,
      },
      rainfallMm: precip !== null && precip !== undefined ? Number(precip.toFixed(1)) : 0,
      precipitationProbability: precipProb ?? 0,
      windSpeedKmh: windSpeed !== null && windSpeed !== undefined ? Number(windSpeed.toFixed(1)) : 0,
      windGustKmh: windGust !== null && windGust !== undefined ? Number(windGust.toFixed(1)) : (windSpeed ?? 0),
      relativeHumidityPercent: humidity ?? 60,
      conditionCode: wmo.code,
      conditionText: wmo.textEn,
      conditionTextHindi: wmo.textHi,
    });
  }

  const missingFields = Array.from(missingFieldsSet);

  const dataQuality: WeatherQuality = {
    isComplete: missingFields.length === 0,
    missingFields,
    isSimulated: false,
    notes: [
      `Hourly slices generated: ${periods.length}`,
      `Provider: Open-Meteo High-Resolution (Asia/Kolkata)`,
    ],
  };

  return {
    location,
    fetchedAt,
    forecastIssuedAt: fetchedAt,
    source: "OPEN_METEO_INDIA",
    periods,
    dataQuality,
  };
}

/**
 * Generates clearly labeled deterministic forecast scenarios for demos and offline testing.
 */
export function generateDeterministicForecast(
  location: WeatherLocation,
  scenario: "RAIN_CONFLICT_OCT29" | "CLEAR_WEEK" | "MISSING_DATA" = "RAIN_CONFLICT_OCT29"
): NormalizedWeatherForecast {
  const periods: WeatherPeriod[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  const totalHours = 7 * 24; // 7 days

  for (let i = 0; i < totalHours; i++) {
    const periodStart = new Date(now.getTime() + i * 3600 * 1000);
    const periodEnd = new Date(periodStart.getTime() + 3600 * 1000);
    const dayOffset = Math.floor(i / 24);
    const hourOfDay = periodStart.getHours();

    let rainfall = 0;
    let rainProb = 5;
    let windSpeed = 8.5;
    let windGust = 11.0;
    let humidity = 60;
    let wmoCode = 0;

    if (scenario === "RAIN_CONFLICT_OCT29") {
      // Day 1 (tomorrow morning): Heavy rainfall & high wind conflict
      if (dayOffset === 1 && hourOfDay >= 6 && hourOfDay <= 12) {
        rainfall = 14.2;
        rainProb = 90;
        windSpeed = 22.0;
        windGust = 28.5;
        humidity = 95;
        wmoCode = 65; // Heavy rain
      } else if (dayOffset === 1 && hourOfDay > 12 && hourOfDay <= 18) {
        rainfall = 6.4;
        rainProb = 75;
        windSpeed = 16.0;
        windGust = 21.0;
        humidity = 88;
        wmoCode = 63; // Moderate rain
      } else {
        // Clear window on subsequent days (ideal for rescheduling)
        rainfall = 0;
        rainProb = 10;
        windSpeed = 7.0;
        windGust = 9.5;
        humidity = 55;
        wmoCode = 0; // Clear
      }
    }

    const wmo = interpretWmoCode(wmoCode);

    periods.push({
      startTime: periodStart.toISOString(),
      endTime: periodEnd.toISOString(),
      temperatureC: {
        min: 22,
        max: 31,
        current: 26,
      },
      rainfallMm: rainfall,
      precipitationProbability: rainProb,
      windSpeedKmh: windSpeed,
      windGustKmh: windGust,
      relativeHumidityPercent: humidity,
      conditionCode: wmo.code,
      conditionText: wmo.textEn,
      conditionTextHindi: wmo.textHi,
    });
  }

  const isMissing = scenario === "MISSING_DATA";

  return {
    location,
    fetchedAt: new Date().toISOString(),
    forecastIssuedAt: new Date().toISOString(),
    source: "SIMULATED_DEMO",
    periods,
    dataQuality: {
      isComplete: !isMissing,
      missingFields: isMissing ? ["wind_gusts_10m", "relative_humidity_2m"] : [],
      isSimulated: true,
      notes: [
        `Deterministic scenario: ${scenario}`,
        "Simulated for reliable demo testing without external internet dependencies",
      ],
    },
  };
}
