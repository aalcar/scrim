# scrim

Practice for the interview format where you are dropped into an unfamiliar
codebase and asked to design a feature, resolve a bug, or review a PR — while a
staff engineer watches how you ask questions.

Right now it runs one scenario: design an alert-rules API for `pulse-api`, a
Java Spring metrics service you have never seen before. The interviewer is an
LLM playing a busy staff engineer who answers what you ask and volunteers
nothing. When you end the session it scores the transcript against a rubric.

## Running it

```bash
cp .env.example .env.local   # add an AI Gateway key
npm run dev
```

Open http://localhost:3000.

## How a scenario works

Everything that makes a session is one JSON file in `scenarios/`, paired with a
codebase in `fixtures/`.

| Key | Purpose |
|---|---|
| `ticket` | The deliberately underspecified ask the candidate sees. |
| `interviewer` | Persona, opening line, and the rules that keep them in character. |
| `hiddenRequirements` | Real constraints withheld from the ticket. Each has a `revealedBy` condition — the interviewer only surfaces one when the candidate's question actually reaches it. |
| `landmines` | Problems planted in the fixture. The interviewer never points them out first. |
| `outOfScope` | Rabbit holes the interviewer steers away from. |
| `rubric` | Weighted rows, each with what a 4 and a 1 look like. Scores are weighted server-side, not by the model. |

To add a scenario: drop a fixture in `fixtures/<name>/`, write
`scenarios/<id>.json`, and visit `/?scenario=<id>`.

## Layout

```
app/            Next.js UI and API routes
lib/prompt.ts   Interviewer and grader prompts
lib/scrim.ts    Scenario and fixture loading
scenarios/      Scenario definitions
fixtures/       The codebases under interview
```

## Not built yet

- A code editor. Sessions are design conversations only.
- PR review mode.
- Voice.
- More than one scenario.
- Session persistence — a reload loses the transcript.
