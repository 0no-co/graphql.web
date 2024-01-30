import { describe, it, expectTypeOf } from 'vitest';
import type * as graphql from 'graphql';

import type { GraphQLError } from '../error';

describe('GraphQLError', () => {
  it('should match graphql.js’ GraphQLError', () => {
    expectTypeOf<GraphQLError>().toMatchTypeOf<graphql.GraphQLError>();
    expectTypeOf<graphql.GraphQLError>().toMatchTypeOf<GraphQLError>();
  });
});
