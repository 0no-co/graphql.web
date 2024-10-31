import type { Location } from './types';
import type { ASTNode, SelectionNode } from './ast';

export function isSelectionNode(node: ASTNode): node is SelectionNode {
  return node.kind === 'Field' || node.kind === 'FragmentSpread' || node.kind === 'InlineFragment';
}

export function Source(body: string, name?: string, locationOffset?: Location) {
  return {
    body,
    name,
    locationOffset: locationOffset || { line: 1, column: 1 },
  };
}
