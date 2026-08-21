import { describe, expect, it } from 'vitest';
import * as graphql17 from 'graphql17';

import kitchenSinkDocument from './fixtures/kitchen_sink.graphql?raw';
import { parse } from '../parser';
import { print } from '../printer';
import { visit } from '../visitor';

describe('graphql@17 compatibility', () => {
  it('produces an interoperable AST', () => {
    const webDocument = parse(kitchenSinkDocument, { noLocation: true });
    const graphqlDocument = graphql17.parse(kitchenSinkDocument, { noLocation: true });

    expect(webDocument).toEqual(graphqlDocument);

    // Type interoperability is checked with GraphQL 17 mapped to the peer in fixtures/graphql17.
    expect(graphql17.parse(print(graphqlDocument as any), { noLocation: true })).toEqual(
      graphqlDocument
    );
    expect(parse(graphql17.print(webDocument as any), { noLocation: true })).toEqual(webDocument);
    expect(graphql17.visit(webDocument as any, {})).toBe(webDocument);
    expect(visit(graphqlDocument as any, {})).toBe(graphqlDocument);
  });
});
