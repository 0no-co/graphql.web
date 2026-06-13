import { describe, it, expectTypeOf } from 'vitest';
import type * as graphql16new from 'graphql16new';

import type { ASTNode, DocumentNode } from '../ast';
import type { Kind } from '../kind';
import type {
  SchemaCoordinateNode,
  TypeCoordinateNode,
  MemberCoordinateNode,
  ArgumentCoordinateNode,
  DirectiveCoordinateNode,
  DirectiveArgumentCoordinateNode,
} from '../coordinateAst';

describe('graphql@16.12 compatibility', () => {
  it('keeps Kind assignable after GraphQL added schema coordinate kinds', () => {
    expectTypeOf<Kind>().toMatchTypeOf<graphql16new.Kind>();
    expectTypeOf<graphql16new.Kind>().toMatchTypeOf<Kind>();
    expectTypeOf<Kind.DOCUMENT>().toMatchTypeOf<graphql16new.Kind.DOCUMENT>();
    expectTypeOf<graphql16new.Kind.DOCUMENT>().toMatchTypeOf<Kind.DOCUMENT>();
  });

  it('keeps AST node types assignable to the current GraphQL 16 AST', () => {
    expectTypeOf<DocumentNode>().toMatchTypeOf<graphql16new.DocumentNode>();
    expectTypeOf<graphql16new.DocumentNode>().toMatchTypeOf<DocumentNode>();
    expectTypeOf<ASTNode>().toMatchTypeOf<graphql16new.ASTNode>();
    expectTypeOf<graphql16new.ASTNode>().toMatchTypeOf<ASTNode>();
  });

  it('matches GraphQL schema coordinate AST nodes', () => {
    expectTypeOf<SchemaCoordinateNode>().toMatchTypeOf<graphql16new.SchemaCoordinateNode>();
    expectTypeOf<graphql16new.SchemaCoordinateNode>().toMatchTypeOf<SchemaCoordinateNode>();
    expectTypeOf<TypeCoordinateNode>().toMatchTypeOf<graphql16new.TypeCoordinateNode>();
    expectTypeOf<graphql16new.TypeCoordinateNode>().toMatchTypeOf<TypeCoordinateNode>();
    expectTypeOf<MemberCoordinateNode>().toMatchTypeOf<graphql16new.MemberCoordinateNode>();
    expectTypeOf<graphql16new.MemberCoordinateNode>().toMatchTypeOf<MemberCoordinateNode>();
    expectTypeOf<ArgumentCoordinateNode>().toMatchTypeOf<graphql16new.ArgumentCoordinateNode>();
    expectTypeOf<graphql16new.ArgumentCoordinateNode>().toMatchTypeOf<ArgumentCoordinateNode>();
    expectTypeOf<DirectiveCoordinateNode>().toMatchTypeOf<graphql16new.DirectiveCoordinateNode>();
    expectTypeOf<graphql16new.DirectiveCoordinateNode>().toMatchTypeOf<DirectiveCoordinateNode>();
    expectTypeOf<DirectiveArgumentCoordinateNode>().toMatchTypeOf<graphql16new.DirectiveArgumentCoordinateNode>();
    expectTypeOf<graphql16new.DirectiveArgumentCoordinateNode>().toMatchTypeOf<DirectiveArgumentCoordinateNode>();
  });
});
