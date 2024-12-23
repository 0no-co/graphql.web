import type { Location, Source as _Source } from './types';
import type { ASTNode, SelectionNode } from './ast';
import { Kind } from './kind';

export function isSelectionNode(node: ASTNode): node is SelectionNode {
  return (
    node.kind === Kind.FIELD ||
    node.kind === Kind.FRAGMENT_SPREAD ||
    node.kind === Kind.INLINE_FRAGMENT
  );
}

export function Source(body: string, name?: string, locationOffset?: Location): _Source {
  return {
    body,
    name,
    locationOffset: locationOffset || { line: 1, column: 1 },
  };
}
