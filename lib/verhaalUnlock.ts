import type { Progress } from "./types";

/**
 * Returns an array of lesson IDs that have been completed.
 * Used to check which story lessons are unlocked.
 */
export function getUnlockedLesIds(lessons: Progress["lessons"] | undefined): string[] {
  if (!lessons) return [];
  return Object.entries(lessons)
    .filter(([_, progress]) => progress && progress.completed)
    .map(([lesId]) => lesId);
}
