import type * as GraphQL from 'graphql';

import type { Or, Location } from './types';
import type { Kind } from './kind';
import type { NameNode } from './ast';

export declare type SchemaCoordinateNode = Or<
  GraphQL.SchemaCoordinateNode,
  TypeCoordinateNode | MemberCoordinateNode | ArgumentCoordinateNode | DirectiveCoordinateNode | DirectiveArgumentCoordinateNode
>;

export type TypeCoordinateNode = Or<
  GraphQL.TypeCoordinateNode,
  {
    readonly kind: Kind.TYPE_COORDINATE;
    readonly loc?: Location;
    readonly name: NameNode;
  }
>;

export type MemberCoordinateNode = Or<
  GraphQL.MemberCoordinateNode,
  {
    readonly kind: Kind.MEMBER_COORDINATE;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly memberName: NameNode;
  }
>;

export type ArgumentCoordinateNode = Or<
  GraphQL.ArgumentCoordinateNode,
  {
    readonly kind: Kind.ARGUMENT_COORDINATE;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly fieldName: NameNode;
    readonly argumentName: NameNode;
  }
>;

export type DirectiveCoordinateNode = Or<
  GraphQL.DirectiveCoordinateNode,
  {
    readonly kind: Kind.DIRECTIVE_COORDINATE;
    readonly loc?: Location;
    readonly name: NameNode;
  }
>;

export type DirectiveArgumentCoordinateNode = Or<
  GraphQL.DirectiveArgumentCoordinateNode,
  {
    readonly kind: Kind.DIRECTIVE_ARGUMENT_COORDINATE;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly argumentName: NameNode;
  }
>;
