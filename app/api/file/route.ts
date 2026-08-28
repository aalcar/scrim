import { highlightFile } from "@/lib/highlight";
import { loadScenario, readFixtureFile } from "@/lib/scrim";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scenarioId = url.searchParams.get("scenario");
  const path = url.searchParams.get("path");
  if (!scenarioId || !path) {
    return new Response("scenario and path are required", { status: 400 });
  }

  try {
    const scenario = await loadScenario(scenarioId);
    const source = await readFixtureFile(scenario.fixture, path);
    return Response.json({ html: await highlightFile(path, source) });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
