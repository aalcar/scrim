import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTree, directoryPaths, type TreeNode } from "./tree.ts";

const dirNames = (nodes: TreeNode[]) =>
  nodes.filter((n) => n.kind === "dir").map((n) => n.name);
const fileNames = (nodes: TreeNode[]) =>
  nodes.filter((n) => n.kind === "file").map((n) => n.name);

test("folds a chain of single-child directories into one row", () => {
  const tree = buildTree(["src/main/java/com/pulse/api/Ids.java"]);
  assert.deepEqual(dirNames(tree), ["src/main/java/com/pulse/api"]);
  assert.equal(tree[0].path, "src/main/java/com/pulse/api");
  assert.deepEqual(fileNames((tree[0] as Extract<TreeNode, { kind: "dir" }>).children), [
    "Ids.java",
  ]);
});

test("stops folding where a directory has two children", () => {
  const tree = buildTree(["src/main/A.java", "src/test/B.java"]);
  assert.deepEqual(dirNames(tree), ["src"]);
  const src = tree[0] as Extract<TreeNode, { kind: "dir" }>;
  assert.deepEqual(dirNames(src.children), ["main", "test"]);
});

test("never folds away a directory that holds files of its own", () => {
  const tree = buildTree(["a/keep.txt", "a/b/deep.txt"]);
  assert.deepEqual(dirNames(tree), ["a"]);
  const a = tree[0] as Extract<TreeNode, { kind: "dir" }>;
  assert.deepEqual(fileNames(a.children), ["keep.txt"]);
  assert.deepEqual(dirNames(a.children), ["b"]);
});

test("keeps root-level files and sorts directories before them", () => {
  const tree = buildTree(["pom.xml", "README.md", "src/A.java"]);
  assert.deepEqual(
    tree.map((n) => n.kind),
    ["dir", "file", "file"],
  );
  // Case-insensitive, the way a file explorer orders things: pom before README.
  assert.deepEqual(fileNames(tree), ["pom.xml", "README.md"]);
});

test("directory paths are full, not just the folded label", () => {
  const tree = buildTree(["a/b/c/x.txt", "a/b/c/d/y.txt"]);
  assert.deepEqual(directoryPaths(tree), ["a/b/c", "a/b/c/d"]);
});

test("empty input yields an empty tree", () => {
  assert.deepEqual(buildTree([]), []);
});
