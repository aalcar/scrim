"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FixtureFile, Scenario } from "@/lib/scrim";

type Grade = {
  headline: string;
  rubric: { id: string; score: number; evidence: string; improvement: string }[];
  requirements: { id: string; discovered: boolean; note: string }[];
  landmines: { id: string; spotted: boolean; note: string }[];
  topThree: string[];
  earned: number;
  possible: number;
};

const BRIEF = "__brief__";

export default function Session({
  scenario,
  files,
}: {
  scenario: Scenario;
  files: FixtureFile[];
}) {
  const [selected, setSelected] = useState<string>(BRIEF);
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);

  // The transport is built once, so the current clock reading is read from a ref
  // rather than captured in a closure.
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 60000)),
      5000,
    );
    return () => clearInterval(timer);
  }, []);

  const opening: UIMessage = useMemo(
    () => ({
      id: "opening",
      role: "assistant",
      parts: [{ type: "text", text: scenario.interviewer.opening }],
    }),
    [scenario.interviewer.opening],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          scenarioId: scenario.id,
          minutesElapsed: elapsedRef.current,
        }),
      }),
    [scenario.id],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [opening],
  });

  const busy = status === "submitted" || status === "streaming";

  async function endSession() {
    setGrading(true);
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, scenarioId: scenario.id }),
      });
      if (!response.ok) throw new Error(await response.text());
      setGrade(await response.json());
    } catch (error) {
      alert(`Grading failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      setGrading(false);
    }
  }

  const overtime = elapsed > scenario.durationMinutes;
  const answered = messages.filter((m) => m.role === "user").length;

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-4 border-b border-line bg-panel px-4 py-2.5">
        <span className="font-mono text-sm font-semibold tracking-tight">scrim</span>
        <span className="text-line">/</span>
        <span className="truncate text-sm text-muted">
          <span className="font-mono text-text">{scenario.ticket.id}</span>{" "}
          {scenario.ticket.title}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <span
            className={`font-mono text-xs ${overtime ? "text-warn" : "text-muted"}`}
          >
            {elapsed}/{scenario.durationMinutes} min
          </span>
          <button
            onClick={endSession}
            disabled={grading || answered === 0}
            className="rounded border border-line bg-raised px-3 py-1 text-xs text-text transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {grading ? "Scoring…" : "End & score"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <FileList files={files} selected={selected} onSelect={setSelected} />
        <main className="min-w-0 flex-1 overflow-auto bg-ink">
          {selected === BRIEF ? (
            <Brief scenario={scenario} />
          ) : (
            <CodeView
              path={selected}
              content={files.find((f) => f.path === selected)?.content ?? ""}
            />
          )}
        </main>
        <Chat
          scenario={scenario}
          messages={messages}
          busy={busy}
          error={error}
          input={input}
          setInput={setInput}
          onSend={() => {
            const text = input.trim();
            if (!text || busy) return;
            sendMessage({ text });
            setInput("");
          }}
        />
      </div>

      {grade && (
        <GradeReport grade={grade} scenario={scenario} onClose={() => setGrade(null)} />
      )}
    </div>
  );
}

function FileList({
  files,
  selected,
  onSelect,
}: {
  files: FixtureFile[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  const groups = useMemo(() => {
    const byDir = new Map<string, string[]>();
    for (const file of files) {
      const slash = file.path.lastIndexOf("/");
      const dir = slash === -1 ? "." : file.path.slice(0, slash);
      const name = slash === -1 ? file.path : file.path.slice(slash + 1);
      byDir.set(dir, [...(byDir.get(dir) ?? []), name]);
    }
    return [...byDir.entries()];
  }, [files]);

  return (
    <nav className="w-72 shrink-0 overflow-auto border-r border-line bg-panel py-2 font-mono text-xs">
      <button
        onClick={() => onSelect(BRIEF)}
        className={`block w-full px-3 py-1.5 text-left ${
          selected === BRIEF ? "bg-raised text-accent" : "text-muted hover:text-text"
        }`}
      >
        ticket & brief
      </button>
      <div className="my-2 border-t border-line" />
      {groups.map(([dir, names]) => (
        <div key={dir} className="mb-2">
          <div className="truncate px-3 py-1 text-[10px] uppercase tracking-wide text-muted/60">
            {dir}
          </div>
          {names.map((name) => {
            const full = dir === "." ? name : `${dir}/${name}`;
            return (
              <button
                key={full}
                onClick={() => onSelect(full)}
                className={`block w-full truncate px-3 py-1 pl-5 text-left ${
                  selected === full
                    ? "bg-raised text-accent"
                    : "text-text/70 hover:text-text"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brief({ scenario }: { scenario: Scenario }) {
  return (
    <article className="mx-auto max-w-2xl px-8 py-10">
      <p className="text-sm leading-relaxed text-muted">{scenario.candidateBrief}</p>

      <div className="mt-8 rounded border border-line bg-panel p-5">
        <div className="font-mono text-xs text-accent">{scenario.ticket.id}</div>
        <h1 className="mt-1 text-lg font-semibold">{scenario.ticket.title}</h1>
        <div className="mt-1 text-xs text-muted">{scenario.ticket.reporter}</div>
        <p className="mt-4 text-sm leading-relaxed">{scenario.ticket.body}</p>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted">
        {scenario.interviewer.name} is on the call with you and knows this system
        well. She will answer what you ask and not much else.
      </p>
    </article>
  );
}

function CodeView({ path, content }: { path: string; content: string }) {
  const lines = content.split("\n");
  return (
    <div>
      <div className="sticky top-0 border-b border-line bg-panel px-4 py-2 font-mono text-xs text-muted">
        {path}
      </div>
      <pre className="px-2 py-3 font-mono text-xs leading-5">
        {lines.map((line, index) => (
          <div key={index} className="flex hover:bg-panel/60">
            <span className="w-12 shrink-0 select-none pr-3 text-right text-muted/40">
              {index + 1}
            </span>
            <code className="whitespace-pre-wrap break-words">{line || " "}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}

function Chat({
  scenario,
  messages,
  busy,
  error,
  input,
  setInput,
  onSend,
}: {
  scenario: Scenario;
  messages: UIMessage[];
  busy: boolean;
  error: Error | undefined;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <aside className="flex w-[26rem] shrink-0 flex-col border-l border-line bg-panel">
      <div className="border-b border-line px-4 py-2 text-xs text-muted">
        <span className="text-text">{scenario.interviewer.name}</span> ·{" "}
        {scenario.interviewer.role}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto px-4 py-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted/60">
              {message.role === "user" ? "you" : scenario.interviewer.name}
            </div>
            <div
              className={`whitespace-pre-wrap text-sm leading-relaxed ${
                message.role === "user" ? "text-muted" : "text-text"
              }`}
            >
              {message.parts
                .filter((part) => part.type === "text")
                .map((part, index) => (
                  <span key={index}>{(part as { text: string }).text}</span>
                ))}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-muted">…</div>}
        {error && (
          <div className="rounded border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
            {error.message}. Check that AI_GATEWAY_API_KEY is set in .env.local.
          </div>
        )}
        <div ref={bottom} />
      </div>

      <form
        className="border-t border-line p-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          rows={3}
          placeholder="Ask a question, or start designing…"
          className="w-full resize-none rounded border border-line bg-ink px-3 py-2 text-sm outline-none placeholder:text-muted/50 focus:border-accent"
        />
      </form>
    </aside>
  );
}

function GradeReport({
  grade,
  scenario,
  onClose,
}: {
  grade: Grade;
  scenario: Scenario;
  onClose: () => void;
}) {
  const rubricById = new Map(scenario.rubric.map((row) => [row.id, row]));
  const requirementById = new Map(
    scenario.hiddenRequirements.map((requirement) => [requirement.id, requirement]),
  );
  const landmineById = new Map(scenario.landmines.map((mine) => [mine.id, mine]));
  const percent = Math.round((grade.earned / grade.possible) * 100);

  return (
    <div className="absolute inset-0 overflow-auto bg-ink/98 backdrop-blur">
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="flex items-baseline gap-4">
          <h2 className="text-xl font-semibold">Session report</h2>
          <span className="font-mono text-sm text-accent">
            {grade.earned}/{grade.possible} · {percent}%
          </span>
          <button
            onClick={onClose}
            className="ml-auto rounded border border-line px-3 py-1 text-xs text-muted hover:text-text"
          >
            Back to transcript
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">{grade.headline}</p>

        <Section title="What to do differently">
          <ol className="space-y-2 text-sm">
            {grade.topThree.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="font-mono text-muted/60">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Requirements you had to uncover">
          <ul className="space-y-2 text-sm">
            {grade.requirements.map((requirement) => (
              <li key={requirement.id} className="flex gap-3">
                <span
                  className={`mt-0.5 font-mono text-xs ${
                    requirement.discovered ? "text-accent" : "text-warn"
                  }`}
                >
                  {requirement.discovered ? "found" : "miss"}
                </span>
                <span>
                  <span className="text-text">
                    {requirementById.get(requirement.id)?.summary ?? requirement.id}
                  </span>
                  <span className="block text-muted">{requirement.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Problems planted in the code">
          <ul className="space-y-2 text-sm">
            {grade.landmines.map((mine) => (
              <li key={mine.id} className="flex gap-3">
                <span
                  className={`mt-0.5 font-mono text-xs ${
                    mine.spotted ? "text-accent" : "text-warn"
                  }`}
                >
                  {mine.spotted ? "seen" : "miss"}
                </span>
                <span>
                  <span className="text-text">
                    {landmineById.get(mine.id)?.summary ?? mine.id}
                  </span>
                  <span className="block font-mono text-xs text-muted">
                    {landmineById.get(mine.id)?.file}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Rubric">
          <div className="space-y-4">
            {grade.rubric.map((row) => {
              const meta = rubricById.get(row.id);
              return (
                <div key={row.id} className="rounded border border-line bg-panel p-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">{row.id}</span>
                    <span className="ml-auto font-mono text-sm">
                      {row.score}/4
                      <span className="ml-2 text-xs text-muted">
                        ×{meta?.weight ?? 0}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{meta?.criterion}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {row.evidence}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-warn/90">
                    {row.improvement}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h3 className="mb-3 text-xs uppercase tracking-wide text-muted/60">{title}</h3>
      {children}
    </section>
  );
}
