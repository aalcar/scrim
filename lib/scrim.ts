import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SCENARIOS_DIR = path.join(ROOT, "scenarios");
const FIXTURES_DIR = path.join(ROOT, "fixtures");

export type HiddenRequirement = {
  id: string;
  weight: number;
  summary: string;
  revealedBy: string;
  answer: string;
};

export type Landmine = {
  id: string;
  file: string;
  summary: string;
  credit: string;
};

export type RubricRow = {
  id: string;
  weight: number;
  criterion: string;
  strong: string;
  weak: string;
};

export type Scenario = {
  id: string;
  fixture: string;
  title: string;
  durationMinutes: number;
  candidateBrief: string;
  ticket: { id: string; title: string; reporter: string; body: string };
  interviewer: {
    name: string;
    role: string;
    persona: string;
    opening: string;
    rules: string[];
  };
  hiddenRequirements: HiddenRequirement[];
  landmines: Landmine[];
  outOfScope: string[];
  rubric: RubricRow[];
};

export type FixtureFile = { path: string; content: string };

export async function listScenarios(): Promise<Scenario[]> {
  const entries = await fs.readdir(SCENARIOS_DIR);
  const ids = entries.filter((e) => e.endsWith(".json")).map((e) => e.slice(0, -5));
  return Promise.all(ids.map(loadScenario));
}

export async function loadScenario(id: string): Promise<Scenario> {
  const file = safeJoin(SCENARIOS_DIR, `${id}.json`);
  return JSON.parse(await fs.readFile(file, "utf8")) as Scenario;
}

/** Every file path in a fixture, sorted. */
export async function listFixturePaths(fixture: string): Promise<string[]> {
  const root = safeJoin(FIXTURES_DIR, fixture);
  return (await walk(root, root)).sort();
}

/** One file from a fixture. The relative path arrives from the client. */
export async function readFixtureFile(
  fixture: string,
  relative: string,
): Promise<string> {
  const root = safeJoin(FIXTURES_DIR, fixture);
  return fs.readFile(safeJoin(root, relative), "utf8");
}

/** Every file in a fixture, sorted, with contents. Fixtures are small by design. */
export async function readFixture(fixture: string): Promise<FixtureFile[]> {
  const root = safeJoin(FIXTURES_DIR, fixture);
  const paths = (await walk(root, root)).sort();
  return Promise.all(
    paths.map(async (rel) => ({
      path: rel,
      content: await fs.readFile(path.join(root, rel), "utf8"),
    })),
  );
}

async function walk(dir: string, root: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "target") continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(abs, root)));
    else out.push(path.relative(root, abs));
  }
  return out;
}

/**
 * Joins a caller-supplied segment onto a trusted base and refuses to escape it.
 * Scenario and file ids arrive from the client, so this is a trust boundary.
 */
function safeJoin(base: string, segment: string): string {
  const resolved = path.resolve(base, segment);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error(`Path escapes ${base}: ${segment}`);
  }
  return resolved;
}

export { safeJoin };
