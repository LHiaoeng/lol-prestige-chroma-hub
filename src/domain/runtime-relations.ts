import type {
  RuntimeEntity,
  RuntimeEntityKind,
  RuntimeList,
} from "./communitydragon-runtime";

export interface RuntimeRelationTarget {
  readonly kind: RuntimeEntityKind;
  readonly id: number;
}

export function relatedRuntimeItems(
  entity: RuntimeEntity,
  target: RuntimeRelationTarget,
  items: RuntimeList,
): RuntimeList {
  if (target.kind === "skinline" && entity.kind === "skinline")
    return items.filter(
      (item) =>
        item.kind === "universe" &&
        (entity.universeIds.includes(item.id) ||
          item.skinlineIds.includes(target.id)),
    );
  if (target.kind === "universe" && entity.kind === "universe")
    return items.filter(
      (item) =>
        item.kind === "skinline" &&
        (entity.skinlineIds.includes(item.id) ||
          item.universeIds.includes(target.id)),
    );
  if (target.kind === "skin" && entity.kind === "skin") {
    const skinlineIds = entity.skinlineIds;
    const universeIds = entity.universeIds ?? [];
    return items.filter(
      (item) =>
        (item.kind === "skinline" && skinlineIds.includes(item.id)) ||
        (item.kind === "universe" &&
          (universeIds.includes(item.id) ||
            item.skinlineIds.some((id) => skinlineIds.includes(id)))),
    );
  }
  return [];
}
