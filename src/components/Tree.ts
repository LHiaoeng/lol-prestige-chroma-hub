import { createIcon } from "./icons/create-icon";

export interface TreeNode {
  readonly title: string;
  readonly children?: readonly TreeNode[];
}

export interface TreeOptions<T extends TreeNode> {
  readonly label: string;
  readonly expandable?: boolean;
  readonly defaultExpandAll?: boolean;
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

      let group: HTMLUListElement | undefined;
      if (hasChildren) {
        const expandable = options.expandable ?? true;
        const expanded = !expandable || (options.defaultExpandAll ?? false);
        const childGroup = document.createElement("ul");
        childGroup.className = "ant-tree-child-tree";
        childGroup.hidden = !expanded;
        appendNodes(childGroup, (node.children as readonly T[] | undefined) ?? []);
        group = childGroup;
        if (expandable) {
          const switcher = document.createElement("button");
          switcher.type = "button";
          switcher.className = "ant-tree-switcher";
          switcher.setAttribute("aria-expanded", String(expanded));
          switcher.setAttribute("aria-label", options.expandLabel(node.title, expanded));
          switcher.append(createIcon("RightOutlined"));
          switcher.addEventListener("click", () => {
            const nextExpanded = switcher.getAttribute("aria-expanded") !== "true";
            switcher.setAttribute("aria-expanded", String(nextExpanded));
            switcher.setAttribute("aria-label", options.expandLabel(node.title, nextExpanded));
            childGroup.hidden = !nextExpanded;
          });
          row.append(switcher);
        }
      } else if (options.expandable ?? true) {
        const switcher = document.createElement("span");
        switcher.className = "ant-tree-switcher ant-tree-switcher-noop";
        switcher.setAttribute("aria-hidden", "true");
        row.append(switcher);
      }
      if (icon) row.append(icon);
      row.append(options.renderTitle(node));
      item.append(row);
      if (group) item.append(group);
      parent.append(item);
    });
  };

  appendNodes(tree, nodes);
  return tree;
}
