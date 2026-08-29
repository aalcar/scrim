import type { RubricRow } from "./scrim";

export type ScoredRow = { id: string; score: number };

export type Scoring = {
  earned: number;
  possible: number;
  /** Rubric rows the grader failed to return. Their weight still counts against `possible`. */
  missing: string[];
  /** Row ids the grader invented that are not in the scenario. Ignored in the total. */
  unknown: string[];
};

/**
 * Applies rubric weights to the grader's per-row scores.
 *
 * Driven by the scenario's rubric rather than the model's output, so a grader
 * that skips a row is reported rather than silently scoring it zero.
 */
export function scoreRubric(rubric: RubricRow[], scored: ScoredRow[]): Scoring {
  const scoredById = new Map(scored.map((row) => [row.id, row]));
  const rubricIds = new Set(rubric.map((row) => row.id));

  let earned = 0;
  let possible = 0;
  const missing: string[] = [];

  for (const row of rubric) {
    possible += row.weight * 4;
    const match = scoredById.get(row.id);
    if (!match) {
      missing.push(row.id);
      continue;
    }
    earned += Math.min(Math.max(match.score, 0), 4) * row.weight;
  }

  const unknown = scored
    .map((row) => row.id)
    .filter((id) => !rubricIds.has(id));

  return { earned, possible, missing, unknown };
}
