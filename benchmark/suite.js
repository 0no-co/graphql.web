const fs = require('fs');
const graphqlWeb = require('..');
const graphql = require('graphql');

const kitchenSink = fs.readFileSync('./kitchen_sink.graphql', { encoding: 'utf8' });
const document = graphql.parse(kitchenSink, { noLocation: true });

suite('parse kitchen sink query', () => {
  benchmark('0no-co/graphql.web', () => {
    graphqlWeb.parse(kitchenSink);
  });

  benchmark('graphql', () => {
    graphql.parse(kitchenSink, { noLocation: true });
  });
});

suite('print kitchen sink query', () => {
  benchmark('0no-co/graphql.web', () => {
    graphqlWeb.print(document);
  });

  benchmark('graphql', () => {
    graphql.print(document);
  });
});
