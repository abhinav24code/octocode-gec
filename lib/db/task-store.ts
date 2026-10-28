/**
 * PlanSafe India — Task Data Access Layer (TaskStore)
 *
 * Persists agricultural tasks to MongoDB Atlas with seamless in-memory fallback.
 * Ensures the app functions flawlessly in local development, during testing,
 * or when internet connectivity is intermittent.
 */

import {
  AgriculturalTask,
  TaskCreateInput,
  TaskUpdateInput,
} from "@/types";
import { getDatabase } from "./mongodb";
import { CHHATTISGARH_LOCATIONS } from "@/lib/weather/locations";

// In-memory fallback map (ensures resilient operations if Atlas is unreachable)
const inMemoryTasks = new Map<string, AgriculturalTask>();

// Initialize default seed tasks for demo evaluation (centered on Sejbahar, Raipur)
function getSeedTasks(): AgriculturalTask[] {
  const sejbahar = CHHATTISGARH_LOCATIONS[0];
  const now = new Date();

  // Tomorrow 06:00 AM IST
  const tomorrowMorning = new Date(now.getTime() + 24 * 3600 * 1000);
  tomorrowMorning.setHours(6, 0, 0, 0);

  const tomorrowSprayingEnd = new Date(tomorrowMorning.getTime() + 4 * 3600 * 1000);

  // Tomorrow 02:00 PM IST
  const tomorrowAfternoon = new Date(tomorrowMorning);
  tomorrowAfternoon.setHours(14, 0, 0, 0);
  const tomorrowIrrigationEnd = new Date(tomorrowAfternoon.getTime() + 3 * 3600 * 1000);

  // Day after tomorrow 07:00 AM IST
  const dayAfterTomorrow = new Date(now.getTime() + 48 * 3600 * 1000);
  dayAfterTomorrow.setHours(7, 0, 0, 0);
  const harvestingEnd = new Date(dayAfterTomorrow.getTime() + 5 * 3600 * 1000);

  // Operational deadline 3 days out
  const deadlineDate = new Date(now.getTime() + 72 * 3600 * 1000);
  deadlineDate.setHours(18, 0, 0, 0);

  return [
    {
      id: "task-spray-sejbahar-01",
      title: "Pesticide Spraying on Paddy (Blast Prevention)",
      activity: "SPRAYING",
      crop: {
        name: "Rice / Paddy",
        variety: "Swarna (MTU 7029)",
        growthStage: "Panicle Initiation",
        chemicalTarget: "Tricyclazole 75% WP (Fungicide)",
      },
      location: sejbahar,
      plannedWindow: {
        startTime: tomorrowMorning.toISOString(),
        endTime: tomorrowSprayingEnd.toISOString(),
      },
      durationHours: 4,
      deadline: deadlineDate.toISOString(),
      priority: "HIGH",
      dependencies: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-irrig-sejbahar-02",
      title: "Canal Field Irrigation for Paddy",
      activity: "IRRIGATION",
      crop: {
        name: "Rice / Paddy",
        variety: "Swarna",
        growthStage: "Panicle Initiation",
      },
      location: sejbahar,
      plannedWindow: {
        startTime: tomorrowAfternoon.toISOString(),
        endTime: tomorrowIrrigationEnd.toISOString(),
      },
      durationHours: 3,
      deadline: deadlineDate.toISOString(),
      priority: "MEDIUM",
      dependencies: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-harv-sejbahar-03",
      title: "Early Grain Harvesting",
      activity: "HARVESTING",
      crop: {
        name: "Rice / Paddy",
        growthStage: "Maturity",
      },
      location: sejbahar,
      plannedWindow: {
        startTime: dayAfterTomorrow.toISOString(),
        endTime: harvestingEnd.toISOString(),
      },
      durationHours: 5,
      deadline: deadlineDate.toISOString(),
      priority: "HIGH",
      dependencies: ["task-spray-sejbahar-01"],
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// Populate in-memory map initially
for (const task of getSeedTasks()) {
  inMemoryTasks.set(task.id, task);
}

export interface TaskFilterOptions {
  activity?: string;
  village?: string;
  isCompleted?: boolean;
}

/**
 * Ensures MongoDB indexes exist on the tasks collection.
 */
async function ensureIndexes() {
  const db = await getDatabase();
  if (!db) return;

  try {
    const col = db.collection("tasks");
    await col.createIndex({ "location.village": 1 });
    await col.createIndex({ activity: 1 });
    await col.createIndex({ isCompleted: 1 });
    await col.createIndex({ createdAt: -1 });
  } catch (err) {
    console.warn("[PlanSafe DB] Failed creating index:", err);
  }
}

// Ensure indexes on startup
ensureIndexes();

/**
 * Creates a new agricultural task and persists it to MongoDB Atlas (with in-memory fallback).
 */
export async function createTask(input: TaskCreateInput): Promise<AgriculturalTask> {
  const id = `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const task: AgriculturalTask = {
    ...input,
    id,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };

  // Always update in-memory cache
  inMemoryTasks.set(id, task);

  const db = await getDatabase();
  if (db) {
    try {
      await db.collection("tasks").insertOne({
        _id: id as unknown as undefined,
        ...task,
      });
    } catch (error) {
      console.warn("[PlanSafe DB] Failed saving to MongoDB Atlas; stored in-memory.", error);
    }
  }

  return task;
}

/**
 * Retrieves all agricultural tasks matching the filter options.
 */
export async function getTasks(filter?: TaskFilterOptions): Promise<AgriculturalTask[]> {
  const db = await getDatabase();

  if (db) {
    try {
      const query: Record<string, unknown> = {};

      if (filter?.activity) {
        query.activity = filter.activity.toUpperCase();
      }

      if (filter?.village) {
        query["location.village"] = new RegExp(filter.village, "i");
      }

      if (filter?.isCompleted !== undefined) {
        query.isCompleted = filter.isCompleted;
      }

      const docs = await db
        .collection("tasks")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      if (docs.length > 0) {
        return docs.map((doc) => {
          const { _id, ...rest } = doc;
          return {
            id: (rest.id as string) || String(_id),
            ...rest,
          } as AgriculturalTask;
        });
      }

      // If MongoDB is connected but collection is completely empty, seed initial tasks
      const seed = getSeedTasks();
      for (const t of seed) {
        await db.collection("tasks").insertOne({ _id: t.id as unknown as undefined, ...t });
      }
      return seed;
    } catch (error) {
      console.warn("[PlanSafe DB] Error fetching from MongoDB Atlas, falling back to in-memory.", error);
    }
  }

  // In-memory fallback
  let tasks = Array.from(inMemoryTasks.values());

  if (filter?.activity) {
    tasks = tasks.filter((t) => t.activity === filter.activity?.toUpperCase());
  }

  if (filter?.village) {
    const q = filter.village.toLowerCase();
    tasks = tasks.filter((t) => t.location.village.toLowerCase().includes(q));
  }

  if (filter?.isCompleted !== undefined) {
    tasks = tasks.filter((t) => t.isCompleted === filter.isCompleted);
  }

  return tasks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Retrieves a single task by its unique ID.
 */
export async function getTaskById(id: string): Promise<AgriculturalTask | null> {
  const db = await getDatabase();

  if (db) {
    try {
      const doc = await db.collection("tasks").findOne({
        $or: [{ id }, { _id: id as unknown as undefined }],
      });

      if (doc) {
        const { _id, ...rest } = doc;
        return {
          id: (rest.id as string) || String(_id),
          ...rest,
        } as AgriculturalTask;
      }
    } catch (error) {
      console.warn("[PlanSafe DB] Error fetching task from MongoDB Atlas.", error);
    }
  }

  return inMemoryTasks.get(id) ?? null;
}

/**
 * Updates an existing task with partial modifications.
 */
export async function updateTask(
  id: string,
  updates: TaskUpdateInput
): Promise<AgriculturalTask | null> {
  const existing = await getTaskById(id);
  if (!existing) {
    return null;
  }

  const updated: AgriculturalTask = {
    ...existing,
    ...updates,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  inMemoryTasks.set(id, updated);

  const db = await getDatabase();
  if (db) {
    try {
      await db.collection("tasks").updateOne(
        { $or: [{ id }, { _id: id as unknown as undefined }] },
        { $set: { ...updates, updatedAt: updated.updatedAt } }
      );
    } catch (error) {
      console.warn("[PlanSafe DB] Error updating task in MongoDB Atlas.", error);
    }
  }

  return updated;
}

/**
 * Deletes a task by ID.
 */
export async function deleteTask(id: string): Promise<boolean> {
  const existedInMemory = inMemoryTasks.delete(id);

  const db = await getDatabase();
  if (db) {
    try {
      const res = await db.collection("tasks").deleteOne({
        $or: [{ id }, { _id: id as unknown as undefined }],
      });
      return res.deletedCount > 0 || existedInMemory;
    } catch (error) {
      console.warn("[PlanSafe DB] Error deleting task from MongoDB Atlas.", error);
    }
  }

  return existedInMemory;
}
