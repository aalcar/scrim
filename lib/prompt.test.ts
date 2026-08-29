import { test } from "node:test";
import assert from "node:assert/strict";
import { graderSystemPrompt, interviewerSystemPrompt } from "./prompt.ts";
import { loadScenario, readFixture } from "./scrim.ts";

const scenario = await loadScenario("pulse-monitors");
const files = await readFixture(scenario.fixture);

/**
 * The whole prompt sits above an Anthropic cache breakpoint, and caching is a
 * prefix match: one varying byte and every turn pays full price. This caught a
 * real regression once (an elapsed-minutes counter interpolated into the
 * prompt) and exists to catch the next one.
 */
test("interviewer prompt is byte-identical across calls", async () => {
  const first = interviewerSystemPrompt(scenario, files);
  await new Promise((resolve) => setTimeout(resolve, 25));
  const second = interviewerSystemPrompt(scenario, files);
  assert.equal(first, second, "prompt varies between calls — caching is dead");
});

// Anthropic silently declines to cache a prefix below the model minimum
// (4096 tokens on Haiku 4.5). Gutting the prompt would not error, it would
// just quietly stop caching.
test("interviewer prompt stays above the cacheable minimum", () => {
  const prompt = interviewerSystemPrompt(scenario, files);
  assert.ok(
    prompt.length > 20_000,
    `prompt is ${prompt.length} chars, too short to cache reliably`,
  );
});

test("interviewer prompt carries the fixture and the hidden requirements", () => {
  const prompt = interviewerSystemPrompt(scenario, files);
  assert.ok(prompt.includes("ChannelService.java"), "fixture is missing");
  for (const requirement of scenario.hiddenRequirements) {
    assert.ok(
      prompt.includes(requirement.answer),
      `hidden requirement ${requirement.id} is missing`,
    );
  }
});

// The interviewer must not be able to see how the candidate is being scored,
// or she can hint at it.
test("interviewer prompt never leaks the rubric", () => {
  const prompt = interviewerSystemPrompt(scenario, files);
  for (const row of scenario.rubric) {
    assert.ok(!prompt.includes(row.strong), `rubric row ${row.id} leaked`);
    assert.ok(!prompt.includes(row.criterion), `rubric row ${row.id} leaked`);
  }
});

test("grader prompt carries the rubric and the answer key", () => {
  const prompt = graderSystemPrompt(scenario);
  for (const row of scenario.rubric) {
    assert.ok(prompt.includes(row.criterion), `rubric row ${row.id} is missing`);
  }
  for (const landmine of scenario.landmines) {
    assert.ok(prompt.includes(landmine.id), `landmine ${landmine.id} is missing`);
  }
});
