import { test } from "node:test";
import assert from "node:assert/strict";
import { safeJoin } from "./scrim.ts";

// safeJoin is the trust boundary for scenario ids and fixture file paths, both
// of which arrive from the client. These cases are the ones an attacker tries.
test("safeJoin allows paths inside the base", () => {
  assert.equal(safeJoin("/srv/fixtures", "pom.xml"), "/srv/fixtures/pom.xml");
  assert.equal(
    safeJoin("/srv/fixtures", "src/main/App.java"),
    "/srv/fixtures/src/main/App.java",
  );
});

test("safeJoin allows traversal that stays inside", () => {
  assert.equal(safeJoin("/srv/fixtures", "src/../pom.xml"), "/srv/fixtures/pom.xml");
});

test("safeJoin rejects traversal that escapes", () => {
  assert.throws(() => safeJoin("/srv/fixtures", "../etc/passwd"), /escapes/);
  assert.throws(() => safeJoin("/srv/fixtures", "src/../../etc/passwd"), /escapes/);
  assert.throws(() => safeJoin("/srv/fixtures", ".."), /escapes/);
});

test("safeJoin rejects absolute paths outside the base", () => {
  assert.throws(() => safeJoin("/srv/fixtures", "/etc/passwd"), /escapes/);
});

// The classic off-by-one in prefix guards: "/srv/fixtures-evil" starts with
// "/srv/fixtures" as a string but is a different directory.
test("safeJoin rejects a sibling sharing the base as a string prefix", () => {
  assert.throws(() => safeJoin("/srv/fixtures", "../fixtures-evil/x"), /escapes/);
});
