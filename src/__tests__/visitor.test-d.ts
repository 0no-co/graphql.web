import { describe, it, expectTypeOf } from 'vitest';
import type * as graphql from 'graphql16';

import type { visit } from '../visitor';

describe('visit', () => {
  it('should match graphql.js’ visit', () => {
    expectTypeOf<typeof visit>().toMatchTypeOf<typeof graphql.visit>();
    expectTypeOf<typeof graphql.visit>().toMatchTypeOf<typeof visit>();
  });
});
