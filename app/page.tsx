import Session from "./session";
import { listFixturePaths, loadScenario } from "@/lib/scrim";

const DEFAULT_SCENARIO = "pulse-monitors";

export default async function Page({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const requested = params.scenario;
  const scenario = await loadScenario(
    typeof requested === "string" ? requested : DEFAULT_SCENARIO,
  );

  // Only paths are sent up front; contents are fetched and highlighted on
  // demand so the grammar bundle never reaches the browser.
  const paths = await listFixturePaths(scenario.fixture);

  return <Session scenario={scenario} paths={paths} />;
}
