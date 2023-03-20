import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { parse as graphql_parse } from 'graphql';
import { parse } from '../parser';

describe('print', () => {
  it('prints the kitchen sink document like graphql.js does', () => {
    const sink = readFileSync(__dirname + '/../../benchmark/kitchen_sink.graphql', {
      encoding: 'utf8',
    });
    const doc = parse(sink);
    expect(doc).toMatchSnapshot();
    expect(doc).toEqual(graphql_parse(sink, { noLocation: true }));
  });
});
