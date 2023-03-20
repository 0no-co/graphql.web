import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { print as graphql_print } from 'graphql';
import { print } from '../printer';

describe('print', () => {
  it('prints the kitchen sink document like graphql.js does', () => {
    const sink = JSON.parse(readFileSync(__dirname + '/kitchen_sink.json', { encoding: 'utf8' }));
    const doc = print(sink);
    expect(doc).toMatchSnapshot();
    expect(doc).toEqual(graphql_print(sink));
  });
});
