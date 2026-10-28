/**
 * PlanSafe India — Task & Agricultural Context Data Contract
 * Shared across Backend (Member 1), UI (Member 2),
 * Rule Assessment (Member 3), and Scheduling Recovery (Member 4).
 */

import { WeatherLocation } from "./weather";

export type AgriculturalActivity =
  | "SPRAYING"
  | "IRRIGATION"
  | "SOWING"
  | "HARVESTING";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AssessmentStatus =
  | "SUITABLE"           // No weather conflicts found in configured rules
  | "CAUTION"            // Nearing a weather threshold; user review advised
  | "WEATHER_CONFLICT"   // One or more verified rules violated by forecast
  | "INSUFFICIENT_DATA"; // Forecast or task context lacks required metrics to evaluate

export interface CropContext {
  /** Crop name, e.g. "Rice / Paddy", "Soybean", "Wheat", "Chana" */
  name: string;
  /** Variety or cultivar identifier if known */
  variety?: string;
  /** Phenological growth stage, e.g. "Vegetative", "Flowering", "Maturity" */
  growthStage?: string;
  /** Chemical / pesticide target, e.g. "Pre-emergence herbicide", "Fungicide" */
  chemicalTarget?: string;
}

export interface TimeWindow {
  /** ISO 8601 start timestamp */
  startTime: string;
  /** ISO 8601 end timestamp */
  endTime: string;
}

export interface TaskAssessment {
  status: AssessmentStatus;
  evaluatedAt: string;
  reasons: string[];
  reasonsHindi?: string[];
  ruleReferences: string[];
  limitations: string[];
  missingDataWarnings: string[];
}

export interface AgriculturalTask {
  id: string;
  title: string;
  activity: AgriculturalActivity;
  crop: CropContext;
  location: WeatherLocation;
  plannedWindow: TimeWindow;
  durationHours: number;
  /** Hard operational deadline (ISO 8601); scheduler must not breach this without alerting */
  deadline: string;
  priority: TaskPriority;
  /** Array of parent task IDs that must complete before this task can begin */
  dependencies: string[];
  isCompleted: boolean;
  additionalConstraints?: Record<string, unknown>;
  latestAssessment?: TaskAssessment;
  createdAt: string;
  updatedAt: string;
}

export type TaskCreateInput = Omit<
  AgriculturalTask,
  "id" | "isCompleted" | "latestAssessment" | "createdAt" | "updatedAt"
>;

export type TaskUpdateInput = Partial<
  Omit<AgriculturalTask, "id" | "createdAt" | "updatedAt">
>;
