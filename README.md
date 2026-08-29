# scrim

Practice for interviews where you are dropped into an unfamiliar
codebase and asked to design a feature, resolve a bug, or review a PR

Right now it runs one scenario: design an alert-rules API for `pulse-api`, a
Java Spring metrics service. The interviewer is an
LLM playing a busy engineer. When you end the session it scores the transcript against a rubric.

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
| `ticket` | Underspecified feature to implement. |
| `interviewer` | Persona, opening line, and the rules that keep them in character. |
| `hiddenRequirements` | Real constraints withheld from the ticket. Each has a `revealedBy` condition where the interviewer only discusses it when the candidate specifically asks. |
| `landmines` | Problems planted in the fixture. The interviewer never points them out first. |
| `outOfScope` | Rabbit holes the interviewer steers away from. |
| `rubric` | What does a weak and strong answer look like. |

To add a scenario: 
- drop a fixture in `fixtures/<name>/`
- write `scenarios/<id>.json`
- visit `/?scenario=<id>`

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
