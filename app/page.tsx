import Session from "./session";
import { loadScenario, readFixture } from "@/lib/scrim";

const DEFAULT_SCENARIO = "pulse-monitors";

export default async function Page({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const requested = params.scenario;
  const scenario = await loadScenario(
    typeof requested === "string" ? requested : DEFAULT_SCENARIO,
  );
  const files = await readFixture(scenario.fixture);

  return <Session scenario={scenario} files={files} />;
}
