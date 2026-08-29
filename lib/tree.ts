/**
 * File-tree construction for the codebase sidebar.
 *
 * Pure data-structure code — deliberately free of React so it can be tested
 * directly and so the component stays presentational.
 */

export type TreeNode =
  | { kind: "file"; name: string; path: string }
  | { kind: "dir"; name: string; path: string; children: TreeNode[] };

type Draft = { dirs: Map<string, Draft>; files: string[] };

function draft(paths: string[]): Draft {
  const root: Draft = { dirs: new Map(), files: [] };
  for (const path of paths) {
    const segments = path.split("/");
    const fileName = segments.pop();
    if (!fileName) continue;
    let node = root;
    for (const segment of segments) {
      let next = node.dirs.get(segment);
      if (!next) {
        next = { dirs: new Map(), files: [] };
        node.dirs.set(segment, next);
      }
      node = next;
    }
    node.files.push(fileName);
  }
  return root;
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

function toNodes(node: Draft, prefix: string): TreeNode[] {
  const dirs: TreeNode[] = [...node.dirs.entries()].map(([name, child]) => {
    let label = name;
    let path = prefix ? `${prefix}/${name}` : name;
    let current = child;

    // IntelliJ-style compaction: a directory that only leads to one other
    // directory is folded into a single row, so src/main/java/com/pulse/api
    // does not cost five levels of indentation. A directory holding files of
    // its own is never folded away — its files would have nowhere to live.
    while (current.files.length === 0 && current.dirs.size === 1) {
      const [childName, grandchild] = [...current.dirs.entries()][0];
      label += `/${childName}`;
      path += `/${childName}`;
      current = grandchild;
    }

    return { kind: "dir", name: label, path, children: toNodes(current, path) };
  });

  const files: TreeNode[] = node.files.map((name) => ({
    kind: "file",
    name,
    path: prefix ? `${prefix}/${name}` : name,
  }));

  return [...dirs.sort(byName), ...files.sort(byName)];
}

/** Builds the display tree from a flat list of relative file paths. */
export function buildTree(paths: string[]): TreeNode[] {
  return toNodes(draft(paths), "");
}

/** Every directory path in the tree, for expand-all / collapse-all. */
export function directoryPaths(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) =>
    node.kind === "dir" ? [node.path, ...directoryPaths(node.children)] : [],
  );
}
