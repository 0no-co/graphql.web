import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { parse } from '../parser';

describe('parse', () => {
  it('parses the kitchen sink query', () => {
    const sink = readFileSync(__dirname + '/../../benchmark/kitchen_sink.graphql', { encoding: 'utf8' });
    expect(parse(sink)).toMatchSnapshot();
  })
});
