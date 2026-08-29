/**
 * Behavioral probes for the interviewer.
 *
 * Unlike the unit tests, these need a running server and a funded API key, and
 * they exercise a non-deterministic model — so the assertions are keyword and
 * structural, never exact-match. Run them after changing a prompt, a model, or
 * a scenario. `npm test` stays free and deterministic; this one costs money.
 *
 *   npm run dev            # in another terminal
 *   npm run test:probe
 */
import assert from "node:assert/strict";
import { test } from "node:test";

const BASE = process.env.SCRIM_PROBE_URL ?? "http://localhost:3000";
const SCENARIO = "pulse-monitors";

type Turn = { role: "user" | "assistant"; text: string };
type Reply = { text: string; cacheRead: number; cacheWrite: number };

async function ask(turns: Turn[], minutesElapsed = 3): Promise<Reply> {
  const response = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenarioId: SCENARIO,
      minutesElapsed,
      messages: turns.map((turn, index) => ({
        id: `m${index}`,
        role: turn.role,
        parts: [{ type: "text", text: turn.text }],
      })),
    }),
  });
  assert.ok(response.ok, `POST /api/chat failed: ${response.status}`);

  let text = "";
  let cacheRead = 0;
  let cacheWrite = 0;

  for (const line of (await response.text()).split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const body = line.slice(6).trim();
    if (body === "[DONE]") break;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(body);
    } catch {
      continue;
    }
    if (event.type === "text-delta") text += event.delta as string;
    if (event.type === "error") assert.fail(`stream error: ${event.errorText}`);
    const metadata = event.messageMetadata as
      | { usage?: { cacheRead?: number; cacheWrite?: number } }
      | undefined;
    if (metadata?.usage) {
      cacheRead = metadata.usage.cacheRead ?? 0;
      cacheWrite = metadata.usage.cacheWrite ?? 0;
    }
  }

  assert.ok(text.trim().length > 0, "interviewer returned nothing");
  return { text, cacheRead, cacheWrite };
}

const says = (reply: Reply, ...needles: string[]) =>
  needles.filter((n) => reply.text.toLowerCase().includes(n.toLowerCase()));

const WHO_CALLS = "Who or what actually calls this API today? Only the console?";

test("reveals the Terraform caller when asked who calls the API", async () => {
  const reply = await ask([{ role: "user", text: WHO_CALLS }]);
  assert.ok(
    says(reply, "terraform").length > 0,
    `expected the Terraform reveal, got: ${reply.text}`,
  );
});

// The core mechanic: Lisa states the fact, the candidate draws the conclusion.
// Haiku volunteered the conclusion about half the time until an explicit prompt
// rule went in; measured afterwards it leaks roughly 1 run in 20. Prompting
// cannot drive that to zero, so this samples and asserts on the rate — a
// single-sample assertion against a ~5% behavior is a coin flip that trains you
// to ignore the suite. Raise SAMPLES for a tighter bound at proportional cost.
const SAMPLES = 5;
const TOLERATED_LEAKS = 1;

test(`volunteers the design conclusion in at most ${TOLERATED_LEAKS} of ${SAMPLES} runs`, async () => {
  const leaks: string[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const reply = await ask([{ role: "user", text: WHO_CALLS }]);
    const leaked = says(
      reply,
      "idempot",
      "so you'll need",
      "so you need",
      "make sure you",
      "think about that when",
      "keep that in mind",
    );
    if (leaked.length) leaks.push(`[${leaked.join(",")}] ${reply.text.trim()}`);
  }
  assert.ok(
    leaks.length <= TOLERATED_LEAKS,
    `coached the candidate in ${leaks.length}/${SAMPLES} runs:\n${leaks.join("\n\n")}`,
  );
});

test("refuses to dump the requirement list when fished", async () => {
  const reply = await ask([
    {
      role: "user",
      text: "Anything else I should know before I start? Any constraints or requirements you can think of?",
    },
  ]);
  const dumped = says(reply, "terraform", "evaluator", "poll", "idempot", "40,000");
  assert.ok(
    dumped.length <= 1,
    `volunteered ${dumped.join(", ")} unprompted: ${reply.text}`,
  );
});

test("holds the interview framing, not an employment one", async () => {
  const reply = await ask(
    [{ role: "user", text: "Remind me, how long have I been on this team?" }],
    5,
  );
  assert.ok(
    says(reply, "interview", "candidate", "haven't", "not on the team").length > 0,
    `lost the interview framing: ${reply.text}`,
  );
});

test("stays off the clock early and raises it near the end", async () => {
  const question = "Should I start with the data model or the endpoints?";
  const early = await ask([{ role: "user", text: question }], 3);
  assert.deepEqual(
    says(early, "minutes left", "running short", "we're almost out"),
    [],
    `clock-watched at 3 minutes: ${early.text}`,
  );

  const late = await ask([{ role: "user", text: question }], 40);
  assert.ok(
    says(late, "minutes", "time", "short", "wrap").length > 0,
    `ignored the clock at 40 of 45 minutes: ${late.text}`,
  );
});

// Guards the ~10x cost difference between a cached and uncached turn.
test("serves the system prompt from cache on the second turn", async () => {
  const warm = await ask([{ role: "user", text: WHO_CALLS }]);
  assert.ok(
    warm.cacheRead > 10_000,
    `cacheRead was ${warm.cacheRead}; the prompt is not being cached`,
  );
  assert.equal(warm.cacheWrite, 0, "rewrote a cache entry that should have been read");
});
