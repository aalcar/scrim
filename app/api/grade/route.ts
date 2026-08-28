import { generateText, Output, type UIMessage } from "ai";
import { z } from "zod";
import { graderSystemPrompt } from "@/lib/prompt";
import { loadScenario } from "@/lib/scrim";

export const maxDuration = 120;

const MODEL = process.env.SCRIM_GRADER_MODEL ?? "anthropic/claude-opus-5";

const gradeSchema = z.object({
  headline: z
    .string()
    .describe("Two sentences. What this session actually showed about the candidate."),
  rubric: z.array(
    z.object({
      id: z.string().describe("Rubric row id, exactly as given."),
      score: z.number().int().min(0).max(4),
      evidence: z
        .string()
        .describe("The moment in the transcript that earned this score. Quote it."),
      improvement: z
        .string()
        .describe("One concrete thing that would have raised this score."),
    }),
  ),
  requirements: z.array(
    z.object({
      id: z.string(),
      discovered: z
        .boolean()
        .describe("True only if the candidate's own question surfaced it."),
      note: z.string().describe("Which question surfaced it, or what would have."),
    }),
  ),
  landmines: z.array(
    z.object({
      id: z.string(),
      spotted: z.boolean(),
      note: z.string(),
    }),
  ),
  topThree: z
    .array(z.string())
    .describe("The three highest-leverage things to do differently next time."),
});

export async function POST(req: Request) {
  const { messages, scenarioId }: { messages: UIMessage[]; scenarioId: string } =
    await req.json();

  const scenario = await loadScenario(scenarioId);

  const transcript = messages
    .map((message) => {
      const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => (part as { text: string }).text)
        .join("");
      const speaker = message.role === "user" ? "CANDIDATE" : scenario.interviewer.name.toUpperCase();
      return `${speaker}: ${text}`;
    })
    .join("\n\n");

  const { output } = await generateText({
    model: MODEL,
    system: graderSystemPrompt(scenario),
    output: Output.object({ schema: gradeSchema }),
    prompt: `Transcript:\n\n${transcript}`,
  });

  const weightById = new Map(scenario.rubric.map((row) => [row.id, row.weight]));
  const earned = output.rubric.reduce(
    (sum, row) => sum + row.score * (weightById.get(row.id) ?? 0),
    0,
  );
  const possible = scenario.rubric.reduce((sum, row) => sum + row.weight * 4, 0);

  return Response.json({ ...output, earned, possible });
}
