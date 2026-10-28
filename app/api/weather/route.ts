/**
 * PlanSafe India — Weather Forecast Route Handler
 * GET /api/weather
 *
 * Query Parameters:
 * - location: string (village, district, or agricultural location name)
 * - lat: number (latitude override)
 * - lon: number (longitude override)
 * - days: number (1 to 14, default 7)
 * - listLocations: boolean ('true' returns all configured agricultural locations)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  findNearestLocation,
  getAvailableLocations,
  getForecastForLocation,
  resolveLocation,
} from "@/lib/weather";
import { ApiResponse, ProblemDetails } from "@/types";

const WeatherQuerySchema = z.object({
  location: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  days: z.coerce.number().min(1).max(14).default(7),
  listLocations: z.enum(["true", "false"]).optional(),
});

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const searchParams = request.nextUrl.searchParams;

  const rawParams = {
    location: searchParams.get("location") || undefined,
    lat: searchParams.get("lat") || undefined,
    lon: searchParams.get("lon") || undefined,
    days: searchParams.get("days") || undefined,
    listLocations: searchParams.get("listLocations") || undefined,
  };

  const parsed = WeatherQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/invalid-parameters",
      title: "Invalid Request Parameters",
      status: 400,
      detail: "The query parameters provided for weather forecast failed validation.",
      instance: request.nextUrl.pathname,
      invalidParams: parsed.error.issues.map((issue) => ({
        name: issue.path.join("."),
        reason: issue.message,
      })),
    };

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorDetails,
        timestamp,
      },
      { status: 400 }
    );
  }

  const { location: locationQuery, lat, lon, days, listLocations } = parsed.data;

  // Convenience query for frontend to populate village dropdown
  if (listLocations === "true") {
    const locations = getAvailableLocations();
    return NextResponse.json(
      {
        success: true,
        data: locations,
        timestamp,
      },
      { status: 200 }
    );
  }

  // Resolve target location
  let targetLocation = resolveLocation(locationQuery);

  if (lat !== undefined && lon !== undefined) {
    targetLocation = findNearestLocation(lat, lon);
    targetLocation = {
      ...targetLocation,
      latitude: lat,
      longitude: lon,
    };
  }

  try {
    const forecast = await getForecastForLocation({
      location: targetLocation,
      days,
    });

    return NextResponse.json(
      {
        success: true,
        data: forecast,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal weather service failure";

    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/weather-service-failure",
      title: "Weather Service Unavailable",
      status: 502,
      detail: message,
      instance: request.nextUrl.pathname,
    };

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorDetails,
        timestamp,
      },
      { status: 502 }
    );
  }
}
