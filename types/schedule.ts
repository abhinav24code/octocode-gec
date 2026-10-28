/**
 * PlanSafe India — Weather Recovery Engine Scheduling Contract
 * Shared across Backend (Member 1), UI (Member 2),
 * and Scheduling Recovery Engine (Member 4).
 */

import { AgriculturalActivity, TimeWindow } from "./task";

export type ScheduleChangeType =
  | "UNCHANGED"            // Original window remains optimal and weather-compliant
  | "RESCHEDULED"          // Successfully reassigned to a feasible, conflict-free window
  | "UNFEASIBLE_CONFLICT"  // Weather conflict exists, but deadline or dependency prevents rescheduling
  | "INSUFFICIENT_INFO";   // Missing weather metrics prevent verified window calculation

export interface TaskScheduleChange {
  taskId: string;
  activity: AgriculturalActivity;
  title: string;
  originalWindow: TimeWindow;
  /** Null if the task could not be feasibly rescheduled */
  proposedWindow: TimeWindow | null;
  changeType: ScheduleChangeType;
  /** Explainable rationale in English */
  reasons: string[];
  /** Plain-language explanation in Hindi */
  reasonsHindi: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  /** Constraints preventing or influencing the schedule (e.g. DEADLINE_BREACH, RAIN_WINDOW) */
  limitingFactors: string[];
  /** Forecast summary during the proposed alternative window */
  assessedAlternativeConditions?: {
    avgRainfallMm: number;
    maxWindSpeedKmh: number;
    avgTemperatureC: number;
  };
}

export interface ScheduleProposal {
  planId: string;
  generatedAt: string;
  evaluatedWeatherSource: string;
  overallStatus: "FEASIBLE" | "PARTIAL_FEASIBLE" | "CONFLICT_UNRESOLVED";
  tasks: TaskScheduleChange[];
  summary: {
    totalTasks: number;
    unchangedCount: number;
    rescheduledCount: number;
    unfeasibleCount: number;
  };
  appliedConstraints: {
    respectDependencies: boolean;
    respectDeadlines: boolean;
    prioritiesConsidered: boolean;
  };
}
