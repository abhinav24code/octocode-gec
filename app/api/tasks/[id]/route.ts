/**
 * PlanSafe India — Single Task Item API Route Handler
 *
 * GET /api/tasks/[id]    - Retrieve a specific task by ID
 * PATCH /api/tasks/[id]  - Update specific fields of a task
 * DELETE /api/tasks/[id] - Delete a task
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteTask, getTaskById, updateTask } from "@/lib/db/task-store";
import { TaskUpdateSchema } from "@/lib/validation/task";
import { ApiResponse, ProblemDetails } from "@/types";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteProps) {
  const timestamp = new Date().toISOString();
  const { id } = await props.params;

  try {
    const task = await getTaskById(id);

    if (!task) {
      const errorDetails: ProblemDetails = {
        type: "https://plansafe.in/errors/task-not-found",
        title: "Task Not Found",
        status: 404,
        detail: `No agricultural task found with identifier '${id}'.`,
        instance: request.nextUrl.pathname,
      };

      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: errorDetails,
          timestamp,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: task,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error retrieving task";

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

export async function PATCH(request: NextRequest, props: RouteProps) {
  const timestamp = new Date().toISOString();
  const { id } = await props.params;

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

  const parsed = TaskUpdateSchema.safeParse(body);

  if (!parsed.success) {
    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/task-validation-failed",
      title: "Task Update Validation Failed",
      status: 400,
      detail: "The update request contains invalid field values.",
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
    const updated = await updateTask(id, parsed.data);

    if (!updated) {
      const errorDetails: ProblemDetails = {
        type: "https://plansafe.in/errors/task-not-found",
        title: "Task Not Found",
        status: 404,
        detail: `Cannot update non-existent task '${id}'.`,
        instance: request.nextUrl.pathname,
      };

      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: errorDetails,
          timestamp,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error updating task";

    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/task-update-failed",
      title: "Task Update Failed",
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

export async function DELETE(request: NextRequest, props: RouteProps) {
  const timestamp = new Date().toISOString();
  const { id } = await props.params;

  try {
    const deleted = await deleteTask(id);

    if (!deleted) {
      const errorDetails: ProblemDetails = {
        type: "https://plansafe.in/errors/task-not-found",
        title: "Task Not Found",
        status: 404,
        detail: `Cannot delete non-existent task '${id}'.`,
        instance: request.nextUrl.pathname,
      };

      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: errorDetails,
          timestamp,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id, deleted: true },
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error deleting task";

    const errorDetails: ProblemDetails = {
      type: "https://plansafe.in/errors/task-delete-failed",
      title: "Task Deletion Failed",
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
