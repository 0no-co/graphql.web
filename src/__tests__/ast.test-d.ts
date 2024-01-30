import { describe, it, expectTypeOf } from 'vitest';
import type * as graphql from 'graphql';

import type { DocumentNode, ASTNode } from '../ast';

describe('DocumentNode', () => {
  it('should match graphql.js’ DocumentNode', () => {
    expectTypeOf<DocumentNode>().toMatchTypeOf<graphql.DocumentNode>();
    expectTypeOf<graphql.DocumentNode>().toMatchTypeOf<DocumentNode>();
  });
});

describe('ASTNode', () => {
  it('should match graphql.js’ ASTNode', () => {
    expectTypeOf<ASTNode>().toMatchTypeOf<graphql.ASTNode>();
    expectTypeOf<graphql.ASTNode>().toMatchTypeOf<ASTNode>();
  });
});
