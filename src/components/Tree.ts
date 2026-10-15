export interface TreeNode {
  readonly title: string;
  readonly children?: readonly TreeNode[];
}

export interface TreeOptions<T extends TreeNode> {
  readonly label: string;
  readonly expandedByDefault?: boolean;
  readonly renderIcon?: (node: T) => SVGElement | undefined;
  readonly renderTitle: (node: T) => HTMLElement;
  readonly expandLabel: (title: string, expanded: boolean) => string;
}

export function createTree<T extends TreeNode>(
  nodes: readonly T[],
  options: TreeOptions<T>,
): HTMLUListElement {
  const tree = document.createElement("ul");
  tree.className = "ant-tree";
  tree.setAttribute("aria-label", options.label);

  const appendNodes = (parent: HTMLUListElement, children: readonly T[]) => {
    children.forEach((node) => {
      const item = document.createElement("li");
      item.className = "ant-tree-node";
      const row = document.createElement("div");
      row.className = "ant-tree-treenode";
      const hasChildren = Boolean(node.children?.length);
      const icon = options.renderIcon?.(node);
      if (icon) {
        icon.classList.add("ant-tree-icon");
        icon.setAttribute("aria-hidden", "true");
      }

      if (hasChildren) {
        const expanded = options.expandedByDefault ?? true;
        const switcher = document.createElement("button");
        switcher.type = "button";
        switcher.className = "ant-tree-switcher";
        switcher.setAttribute("aria-expanded", String(expanded));
        switcher.setAttribute("aria-label", options.expandLabel(node.title, expanded));
        switcher.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="m6 3 5 5-5 5" /></svg>';

        const group = document.createElement("ul");
        group.className = "ant-tree-child-tree";
        group.hidden = !expanded;
        appendNodes(group, (node.children as readonly T[] | undefined) ?? []);
        switcher.addEventListener("click", () => {
          const nextExpanded = switcher.getAttribute("aria-expanded") !== "true";
          switcher.setAttribute("aria-expanded", String(nextExpanded));
          switcher.setAttribute("aria-label", options.expandLabel(node.title, nextExpanded));
          group.hidden = !nextExpanded;
        });

        row.append(switcher);
        if (icon) row.append(icon);
        row.append(options.renderTitle(node));
        item.append(row, group);
      } else {
        const switcher = document.createElement("span");
        switcher.className = "ant-tree-switcher ant-tree-switcher-noop";
        switcher.setAttribute("aria-hidden", "true");
        row.append(switcher);
        if (icon) row.append(icon);
        row.append(options.renderTitle(node));
        item.append(row);
      }
      parent.append(item);
    });
  };

  appendNodes(tree, nodes);
  return tree;
}
