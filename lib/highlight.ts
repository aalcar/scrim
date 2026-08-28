import { createHighlighter, type Highlighter } from "shiki";

/** VS Code's Dark+ — the Java colouring most people already have muscle memory for. */
const THEME = "dark-plus";

const LANGUAGES = ["java", "xml", "yaml", "markdown"] as const;
type Language = (typeof LANGUAGES)[number] | "text";

const BY_EXTENSION: Record<string, Language> = {
  java: "java",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown",
};

let highlighter: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({ themes: [THEME], langs: [...LANGUAGES] });
  return highlighter;
}

// Fixture files never change while the server is running, so highlighted output
// is memoised. Skipped in development so editing a fixture shows up on reload.
const cache = new Map<string, string>();
const cacheable = process.env.NODE_ENV === "production";

export async function highlightFile(path: string, code: string): Promise<string> {
  const cached = cacheable ? cache.get(path) : undefined;
  if (cached) return cached;

  const extension = path.slice(path.lastIndexOf(".") + 1);
  const html = (await getHighlighter()).codeToHtml(code.trimEnd(), {
    lang: BY_EXTENSION[extension] ?? "text",
    theme: THEME,
  });

  if (cacheable) cache.set(path, html);
  return html;
}
