const fs = require('fs');
const graphqlWeb = require('..');
const graphql15 = require('graphql15');
const graphql16 = require('graphql16');
const graphql17 = require('graphql17');

const kitchenSink = fs.readFileSync('../src/__tests__/kitchen_sink.graphql', { encoding: 'utf8' });
const document = require('../src/__tests__/kitchen_sink.json');

suite('parse kitchen sink query', () => {
  benchmark('0no-co/graphql.web', () => {
    graphqlWeb.parse(kitchenSink);
  });

  benchmark('graphql@15', () => {
    graphql15.parse(kitchenSink, { noLocation: true });
  });

  benchmark('graphql@16', () => {
    graphql16.parse(kitchenSink, { noLocation: true });
  });

  benchmark('graphql@17', () => {
    graphql17.parse(kitchenSink, { noLocation: true });
  });
});

suite('print kitchen sink query', () => {
  benchmark('0no-co/graphql.web', () => {
    graphqlWeb.print(document);
  });

  benchmark('graphql@15', () => {
    graphql15.print(document);
  });

  benchmark('graphql@16', () => {
    graphql16.print(document);
  });

  benchmark('graphql@17', () => {
    graphql17.print(document);
  });
});

suite('visit kitchen sink query', () => {
  benchmark('0no-co/graphql.web', () => {
    graphqlWeb.visit(document, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });

  benchmark('graphql@15', () => {
    graphql15.visit(document, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });

  benchmark('graphql@16', () => {
    graphql16.visit(document, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });

  benchmark('graphql@17', () => {
    graphql17.visit(document, {
      Field: formatNode,
      InlineFragment: formatNode,
    });
  });
});

function formatNode(node) {
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
