type MdNode = { type: string; value?: string; children?: MdNode[]; data?: Record<string, unknown> };

// ==highlight== → <mark>. Inline code and code blocks are separate node types, so they are never touched.
const pattern = /==(?=\S)([^=\n]+?)(?<=\S)==/gu;

function split(value: string): MdNode[] {
  const nodes: MdNode[] = [];
  let last = 0;
  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push({ type: "text", value: value.slice(last, start) });
    nodes.push({ type: "mark", data: { hName: "mark" }, children: [{ type: "text", value: match[1] ?? "" }] });
    last = start + match[0].length;
  }
  if (last === 0) return [{ type: "text", value }];
  if (last < value.length) nodes.push({ type: "text", value: value.slice(last) });
  return nodes;
}

function walk(node: MdNode): void {
  if (!node.children) return;
  node.children = node.children.flatMap((child) => {
    if (child.type === "text" && child.value?.includes("==")) return split(child.value);
    walk(child);
    return [child];
  });
}

export function remarkMark() {
  return (tree: MdNode) => walk(tree);
}
