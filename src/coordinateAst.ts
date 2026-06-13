import type { Location } from './types';
import type { Kind } from './kind';
import type { NameNode } from './ast';

export declare type SchemaCoordinateNode =
  | TypeCoordinateNode
  | MemberCoordinateNode
  | ArgumentCoordinateNode
  | DirectiveCoordinateNode
  | DirectiveArgumentCoordinateNode;

export interface TypeCoordinateNode {
  readonly kind: Kind.TYPE_COORDINATE;
  readonly loc?: Location;
  readonly name: NameNode;
}

export interface MemberCoordinateNode {
  readonly kind: Kind.MEMBER_COORDINATE;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly memberName: NameNode;
}

export interface ArgumentCoordinateNode {
  readonly kind: Kind.ARGUMENT_COORDINATE;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly fieldName: NameNode;
  readonly argumentName: NameNode;
}

export interface DirectiveCoordinateNode {
  readonly kind: Kind.DIRECTIVE_COORDINATE;
  readonly loc?: Location;
  readonly name: NameNode;
}

export interface DirectiveArgumentCoordinateNode {
  readonly kind: Kind.DIRECTIVE_ARGUMENT_COORDINATE;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly argumentName: NameNode;
}
