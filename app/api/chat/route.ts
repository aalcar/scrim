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

const MODEL = process.env.SCRIM_INTERVIEWER_MODEL ?? "anthropic/claude-sonnet-5";

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

  const result = streamText({
    model: MODEL,
    system: interviewerSystemPrompt(scenario, files, minutesElapsed ?? 0),
    messages: await convertToModelMessages(conversation),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
