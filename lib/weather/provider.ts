/**
 * PlanSafe India — Meteorological Service Provider Client
 * Queries the Open-Meteo High-Resolution API with in-memory TTL caching,
 * timeout handling, and deterministic fallback for offline hackathon demos.
 */

import { NormalizedWeatherForecast, WeatherLocation } from "@/types";
import {
  generateDeterministicForecast,
  normalizeOpenMeteoForecast,
  RawOpenMeteoPayload,
} from "./normalize";

interface CacheEntry {
  forecast: NormalizedWeatherForecast;
  expiresAt: number;
}

// 1-hour in-memory cache to guarantee meteorological freshness is updated hourly
const CACHE_TTL_MS = 60 * 60 * 1000;
const memoryCache = new Map<string, CacheEntry>();

export interface FetchWeatherOptions {
  location: WeatherLocation;
  days?: number; // default 7
  forceRefresh?: boolean;
}

/**
 * Retrieves a normalized weather forecast for a given location.
 */
export async function getForecastForLocation(
  options: FetchWeatherOptions
): Promise<NormalizedWeatherForecast> {
  const { location, days = 7, forceRefresh = false } = options;
  const cacheKey = `${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}_${days}`;

  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > now) {
    return cached.forecast;
  }

  const baseUrl =
    process.env.WEATHER_PROVIDER_URL ||
    "https://api.open-meteo.com/v1/forecast";

  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "precipitation_probability",
      "wind_speed_10m",
      "wind_gusts_10m",
      "weather_code",
    ].join(","),
    timezone: "Asia/Kolkata",
    forecast_days: Math.min(Math.max(days, 1), 14).toString(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // 1-hour hourly refresh cache
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(
        `Weather provider responded with status ${res.status}: ${res.statusText}`
      );
    }

    const rawData = (await res.json()) as RawOpenMeteoPayload;
    const normalized = normalizeOpenMeteoForecast(rawData, location);

    // Save to cache
    memoryCache.set(cacheKey, {
      forecast: normalized,
      expiresAt: now + CACHE_TTL_MS,
    });

    return normalized;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown weather network error";

    console.warn(
      `[PlanSafe Weather] Live provider request failed (${errorMessage}). Evaluating fallback options.`
    );

    // If DEMO_MODE is true or we are offline during a demo, safely pivot to deterministic fallback
    const isDemoMode = process.env.DEMO_MODE !== "false";

    if (isDemoMode) {
      console.log(
        `[PlanSafe Weather] Generating deterministic scenario for ${location.name} (Demo Mode Active).`
      );
      const fallback = generateDeterministicForecast(location, "RAIN_CONFLICT_OCT29");

      // Cache fallback briefly (3 minutes)
      memoryCache.set(cacheKey, {
        forecast: fallback,
        expiresAt: now + 3 * 60 * 1000,
      });

      return fallback;
    }

    throw new Error(
      `Unable to retrieve meteorological forecast for ${location.name}: ${errorMessage}`
    );
  }
}
