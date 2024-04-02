import { describe, bench } from 'vitest';

import * as graphql15 from 'graphql15';
import * as graphql16 from 'graphql16';
import * as graphql17 from 'graphql17';

import kitchenSinkAST from './fixtures/kitchen_sink.json';
import { visit } from '../visitor';

describe('visit (kitchen sink AST)', () => {
  bench('@0no-co/graphql.web', () => {
    visit(kitchenSinkAST, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });

  bench('graphql@15', () => {
    graphql15.visit(kitchenSinkAST, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });

  bench('graphql@16', () => {
    graphql16.visit(kitchenSinkAST, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });

  bench('graphql@17', () => {
    graphql17.visit(kitchenSinkAST, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });
});

function formatNode(node: any) {
  if (!node.selectionSet) return node;
  for (const selection of node.selectionSet.selections)
    if (selection.kind === 'Field' && selection.name.value === '__typename' && !selection.alias)
      return node;

  return {
    ...node,
    selectionSet: {
      ...node.selectionSet,
      selections: [
        ...node.selectionSet.selections,
        {
          kind: 'Field',
          name: {
            kind: 'Name',
            value: '__typename',
          },
        },
      ],
    },
  };
}
