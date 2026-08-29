import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRubric } from "./score.ts";
import type { RubricRow } from "./scrim.ts";

const rubric = (weights: Record<string, number>): RubricRow[] =>
  Object.entries(weights).map(([id, weight]) => ({
    id,
    weight,
    criterion: "",
    strong: "",
    weak: "",
  }));

test("weights each row and reports the maximum", () => {
  const result = scoreRubric(rubric({ a: 5, b: 3 }), [
    { id: "a", score: 4 },
    { id: "b", score: 2 },
  ]);
  assert.equal(result.earned, 4 * 5 + 2 * 3);
  assert.equal(result.possible, (5 + 3) * 4);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.unknown, []);
});

// The bug this guards: a grader that omits a row must not have it silently
// scored zero and folded into the total with no trace.
test("reports rows the grader skipped instead of scoring them zero", () => {
  const result = scoreRubric(rubric({ a: 5, b: 3 }), [{ id: "a", score: 4 }]);
  assert.equal(result.earned, 20);
  assert.equal(result.possible, 32, "skipped rows still count against the maximum");
  assert.deepEqual(result.missing, ["b"]);
});

test("ignores row ids the grader invented, and names them", () => {
  const result = scoreRubric(rubric({ a: 2 }), [
    { id: "a", score: 3 },
    { id: "hallucinated", score: 4 },
  ]);
  assert.equal(result.earned, 6);
  assert.deepEqual(result.unknown, ["hallucinated"]);
});

test("clamps out-of-range scores", () => {
  const result = scoreRubric(rubric({ a: 1 }), [{ id: "a", score: 9 }]);
  assert.equal(result.earned, 4);
  assert.equal(scoreRubric(rubric({ a: 1 }), [{ id: "a", score: -3 }]).earned, 0);
});

test("an empty grader response scores zero against the full maximum", () => {
  const result = scoreRubric(rubric({ a: 5, b: 3 }), []);
  assert.equal(result.earned, 0);
  assert.equal(result.possible, 32);
  assert.deepEqual(result.missing, ["a", "b"]);
});
