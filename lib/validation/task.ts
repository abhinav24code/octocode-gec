/**
 * PlanSafe India — Task Input Validation Schemas
 * Strict Zod validation schemas for task creation and updates.
 */

import { z } from "zod";

export const ActivityEnum = z.enum([
  "SPRAYING",
  "IRRIGATION",
  "SOWING",
  "HARVESTING",
]);

export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const LocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  village: z.string().min(1, "Village name is required"),
  district: z.string().min(1, "District name is required"),
  state: z.string().default("Chhattisgarh"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const CropContextSchema = z.object({
  name: z.string().min(1, "Crop name is required"),
  variety: z.string().optional(),
  growthStage: z.string().optional(),
  chemicalTarget: z.string().optional(),
});

export const TimeWindowSchema = z.object({
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 start timestamp",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 end timestamp",
  }),
});

export const TaskCreateSchema = z
  .object({
    title: z.string().min(3, "Task title must be at least 3 characters").max(120),
    activity: ActivityEnum,
    crop: CropContextSchema,
    location: LocationSchema,
    plannedWindow: TimeWindowSchema,
    durationHours: z.number().min(0.5, "Duration must be at least 30 minutes").max(72),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO 8601 deadline timestamp",
    }),
    priority: PriorityEnum.default("MEDIUM"),
    dependencies: z.array(z.string()).default([]),
    additionalConstraints: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.plannedWindow.startTime).getTime();
      const end = new Date(data.plannedWindow.endTime).getTime();
      return start < end;
    },
    {
      message: "Planned window start time must be before end time",
      path: ["plannedWindow", "endTime"],
    }
  )
  .refine(
    (data) => {
      const end = new Date(data.plannedWindow.endTime).getTime();
      const deadline = new Date(data.deadline).getTime();
      return end <= deadline;
    },
    {
      message: "Task planned window end time cannot exceed the operational deadline",
      path: ["deadline"],
    }
  );

export const TaskUpdateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  activity: ActivityEnum.optional(),
  crop: CropContextSchema.optional(),
  location: LocationSchema.optional(),
  plannedWindow: TimeWindowSchema.optional(),
  durationHours: z.number().min(0.5).max(72).optional(),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid ISO 8601 deadline timestamp",
    })
    .optional(),
  priority: PriorityEnum.optional(),
  dependencies: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
  additionalConstraints: z.record(z.string(), z.unknown()).optional(),
});
