"use client";

import { useMemo, useState } from "react";

export const BRIEF = "__brief__";

type TreeNode =
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
    // does not cost five levels of indentation.
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

function directoryPaths(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) =>
    node.kind === "dir" ? [node.path, ...directoryPaths(node.children)] : [],
  );
}

export default function FileTree({
  paths,
  selected,
  onSelect,
}: {
  paths: string[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  const nodes = useMemo(() => toNodes(draft(paths), ""), [paths]);
  const allDirs = useMemo(() => directoryPaths(nodes), [nodes]);

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allDirs));

  function toggle(path: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(path)) next.add(path);
      return next;
    });
  }

  if (collapsed) {
    return (
      <nav className="flex w-9 shrink-0 flex-col items-center border-r border-line bg-panel py-2">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Show files"
          title="Show files"
          className="rounded px-1.5 py-1 text-muted hover:bg-raised hover:text-text"
        >
          <span aria-hidden="true">»</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex w-72 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <span className="px-1 text-[10px] uppercase tracking-wide text-muted/60">
          files
        </span>
        <button
          onClick={() =>
            setExpanded((current) =>
              current.size === 0 ? new Set(allDirs) : new Set(),
            )
          }
          aria-label={expanded.size === 0 ? "Expand all" : "Collapse all"}
          title={expanded.size === 0 ? "Expand all" : "Collapse all"}
          className="ml-auto rounded px-1.5 py-0.5 font-mono text-xs text-muted hover:bg-raised hover:text-text"
        >
          <span aria-hidden="true">{expanded.size === 0 ? "＋" : "－"}</span>
        </button>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Hide files"
          title="Hide files"
          className="rounded px-1.5 py-0.5 font-mono text-xs text-muted hover:bg-raised hover:text-text"
        >
          <span aria-hidden="true">«</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto py-1 font-mono text-xs">
        <Row
          depth={0}
          active={selected === BRIEF}
          onClick={() => onSelect(BRIEF)}
          label="ticket & brief"
        />
        <div className="my-1 border-t border-line" />
        <Rows
          nodes={nodes}
          depth={0}
          selected={selected}
          expanded={expanded}
          onToggle={toggle}
          onSelect={onSelect}
        />
      </div>
    </nav>
  );
}

function Rows({
  nodes,
  depth,
  selected,
  expanded,
  onToggle,
  onSelect,
}: {
  nodes: TreeNode[];
  depth: number;
  selected: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  return nodes.map((node) =>
    node.kind === "file" ? (
      <Row
        key={node.path}
        depth={depth}
        active={selected === node.path}
        onClick={() => onSelect(node.path)}
        label={node.name}
      />
    ) : (
      <div key={node.path}>
        <Row
          depth={depth}
          active={false}
          onClick={() => onToggle(node.path)}
          label={node.name}
          chevron={expanded.has(node.path) ? "▾" : "▸"}
        />
        {expanded.has(node.path) && (
          <Rows
            nodes={node.children}
            depth={depth + 1}
            selected={selected}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        )}
      </div>
    ),
  );
}

function Row({
  depth,
  active,
  onClick,
  label,
  chevron,
}: {
  depth: number;
  active: boolean;
  onClick: () => void;
  label: string;
  chevron?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
      className={`flex w-full items-center gap-1 py-0.5 pr-2 text-left ${
        active
          ? "bg-raised text-accent"
          : chevron
            ? "text-muted hover:text-text"
            : "text-text/70 hover:text-text"
      }`}
    >
      <span className="w-3 shrink-0 text-center text-muted/50">{chevron ?? ""}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
