import { describe, it, expectTypeOf } from 'vitest';
import type * as graphql from 'graphql16';

import type { parse, parseValue } from '../parser';

describe('parse', () => {
  it('should match graphql.js’ parse', () => {
    expectTypeOf<typeof parse>().toMatchTypeOf<typeof graphql.parse>();
    expectTypeOf<typeof graphql.parse>().toMatchTypeOf<typeof parse>();
  });
});

describe('parseValue', () => {
  it('should match graphql.js’ parseValue', () => {
    expectTypeOf<typeof parseValue>().toMatchTypeOf<typeof graphql.parseValue>();
    expectTypeOf<typeof graphql.parseValue>().toMatchTypeOf<typeof parseValue>();
  });
});
