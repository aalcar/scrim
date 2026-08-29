import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { interviewerSystemPrompt } from "@/lib/prompt";
import { loadScenario, readFixture } from "@/lib/scrim";

export const maxDuration = 60;

const MODEL = process.env.SCRIM_INTERVIEWER_MODEL ?? "anthropic/claude-haiku-4.5";

export async function POST(req: Request) {
  const {
    messages,
    scenarioId,
    minutesElapsed,
  }: { messages: UIMessage[]; scenarioId: string; minutesElapsed: number } =
    await req.json();

  const scenario = await loadScenario(scenarioId);
  const files = await readFixture(scenario.fixture);

  // The UI seeds the interviewer's opening line so the candidate has something
  // to reply to, but a conversation may not start with an assistant turn. The
  // opening is carried in the system prompt instead.
  const firstUserTurn = messages.findIndex((message) => message.role === "user");
  const conversation = firstUserTurn === -1 ? [] : messages.slice(firstUserTurn);

  const modelMessages = await convertToModelMessages(conversation);

  // The clock rides on the user turn, after the cache breakpoint. Putting it in
  // the system prompt would change those bytes every turn and cache nothing.
  const elapsed = Math.max(0, minutesElapsed ?? 0);
  modelMessages.push({
    role: "user",
    content: `<session_clock>${elapsed} of ${scenario.durationMinutes} minutes elapsed, ${Math.max(0, scenario.durationMinutes - elapsed)} remaining.</session_clock>`,
  });

  const result = streamText({
    model: MODEL,
    instructions: {
      role: "system",
      content: interviewerSystemPrompt(scenario, files),
      providerOptions: {
        // The whole fixture sits above this breakpoint and never changes, so
        // every turn after the first reads it at ~10% of input price. The 1h
        // TTL is deliberate: candidates go quiet for minutes while reading code,
        // which would expire the 5m default and force a re-write.
        anthropic: { cacheControl: { type: "ephemeral", ttl: "1h" } },
      },
    },
    messages: modelMessages,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // Surfaced so the cache can be asserted on rather than trusted. A run
      // where cacheReadTokens stays zero costs roughly ten times as much.
      messageMetadata: ({ part }) =>
        part.type === "finish"
          ? {
              model: MODEL,
              usage: {
                input: part.totalUsage.inputTokens,
                output: part.totalUsage.outputTokens,
                cacheRead: part.totalUsage.inputTokenDetails?.cacheReadTokens,
                cacheWrite: part.totalUsage.inputTokenDetails?.cacheWriteTokens,
              },
            }
          : undefined,
    }),
  });
}
