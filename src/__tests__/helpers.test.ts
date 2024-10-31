import { describe, it, expect } from 'vitest';

import { parse } from '../parser';
import { isSelectionNode, Source } from '../helpers';
import type { OperationDefinitionNode } from '../ast';

describe('helpers', () => {
  it('Correctly indicates a selection-node', () => {
    const parsed = parse(`
        query {
            field
            ... on Query { field }
            ...Frag
        }

        fragment Frag on Query { field }
    `);

    const operation = parsed.definitions[0] as OperationDefinitionNode;
    expect(isSelectionNode(operation.selectionSet.selections[0])).toEqual(true);
    expect(isSelectionNode(operation.selectionSet.selections[1])).toEqual(true);
    expect(isSelectionNode(operation.selectionSet.selections[2])).toEqual(true);
  });

  it('Source is a function', () => {
    expect(typeof Source).toEqual('function');
    expect(Source('test')).toEqual({
      body: 'test',
      name: undefined,
      locationOffset: { line: 1, column: 1 },
    });
    expect(Source('test', 'test', { line: 2, column: 1 })).toEqual({
      body: 'test',
      name: 'test',
      locationOffset: { line: 2, column: 1 },
    });
  });
});
