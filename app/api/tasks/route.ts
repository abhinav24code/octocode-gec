/**
 * PlanSafe India — Task Collection API Route Handler
 *
 * GET /api/tasks   - Retrieve all agricultural tasks (supports ?activity=, ?village=, ?isCompleted=)
 * POST /api/tasks  - Validate and create a new agricultural task
 */

import { NextRequest, NextResponse } from "next/server";
import { createTask, getTasks } from "@/lib/db/task-store";
import { TaskCreateSchema } from "@/lib/validation/task";
import { ApiResponse, ProblemDetails } from "@/types";

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const searchParams = request.nextUrl.searchParams;

  const activity = searchParams.get("activity") || undefined;
  const village = searchParams.get("village") || undefined;
  const isCompletedParam = searchParams.get("isCompleted");
  const isCompleted =
    isCompletedParam !== null ? isCompletedParam === "true" : undefined;

  try {
    const tasks = await getTasks({
      activity,
      village,
      isCompleted,
    });

    return NextResponse.json(
      {
        success: true,
        data: tasks,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve tasks";

    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/task-retrieval-failed",
      title: "Task Retrieval Error",
      status: 500,
      detail: message,
      instance: request.nextUrl.pathname,
    };

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorDetails,
        timestamp,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/invalid-json",
      title: "Malformed Request Body",
      status: 400,
      detail: "The request body could not be parsed as valid JSON.",
      instance: request.nextUrl.pathname,
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

  const parsed = TaskCreateSchema.safeParse(body);

  if (!parsed.success) {
    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/task-validation-failed",
      title: "Task Validation Failed",
      status: 400,
      detail: "One or more task fields violated agricultural planning constraints.",
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

  try {
    const task = await createTask(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: task,
        timestamp,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to persist task";

    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/task-persistence-failed",
      title: "Task Persistence Error",
      status: 500,
      detail: message,
      instance: request.nextUrl.pathname,
    };

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorDetails,
        timestamp,
      },
      { status: 500 }
    );
  }
}
