import * as graphql from 'graphql';

import { Kind, OperationTypeNode, parse, parseValue } from '../../src';
import type {
  ASTNode,
  ArgumentCoordinateNode,
  DirectiveArgumentCoordinateNode,
  DirectiveCoordinateNode,
  DocumentNode,
  MemberCoordinateNode,
  SchemaCoordinateNode,
  TypeCoordinateNode,
} from '../../src';

export const constructedDocument: DocumentNode = {
  kind: Kind.DOCUMENT,
  definitions: [
    {
      kind: Kind.OPERATION_DEFINITION,
      operation: OperationTypeNode.QUERY,
      selectionSet: {
        kind: Kind.SELECTION_SET,
        selections: [
          {
            kind: Kind.FIELD,
            name: { kind: Kind.NAME, value: 'id' },
          },
        ],
      },
    },
  ],
};

export const typeCoordinate: TypeCoordinateNode = {
  kind: Kind.TYPE_COORDINATE,
  name: { kind: Kind.NAME, value: 'User' },
};

export const memberCoordinate: MemberCoordinateNode = {
  kind: Kind.MEMBER_COORDINATE,
  name: { kind: Kind.NAME, value: 'User' },
  memberName: { kind: Kind.NAME, value: 'email' },
};

export const argumentCoordinate: ArgumentCoordinateNode = {
  kind: Kind.ARGUMENT_COORDINATE,
  name: { kind: Kind.NAME, value: 'Query' },
  fieldName: { kind: Kind.NAME, value: 'user' },
  argumentName: { kind: Kind.NAME, value: 'id' },
};

export const directiveCoordinate: DirectiveCoordinateNode = {
  kind: Kind.DIRECTIVE_COORDINATE,
  name: { kind: Kind.NAME, value: 'include' },
};

export const directiveArgumentCoordinate: DirectiveArgumentCoordinateNode = {
  kind: Kind.DIRECTIVE_ARGUMENT_COORDINATE,
  name: { kind: Kind.NAME, value: 'include' },
  argumentName: { kind: Kind.NAME, value: 'if' },
};

export function acceptsWebDocument(document: graphql.DocumentNode): DocumentNode {
  return document;
}

export function acceptsGraphQLDocument(document: DocumentNode): graphql.DocumentNode {
  return document;
}

export function acceptsWebASTNode(node: graphql.ASTNode): ASTNode {
  return node;
}

export function acceptsGraphQLASTNode(node: ASTNode): graphql.ASTNode {
  return node;
}

export function acceptsWebCoordinate(node: graphql.SchemaCoordinateNode): SchemaCoordinateNode {
  return node;
}

export function acceptsGraphQLCoordinate(node: SchemaCoordinateNode): graphql.SchemaCoordinateNode {
  return node;
}

export const graphqlParse: typeof graphql.parse = parse;
export const webParse: typeof parse = graphql.parse;
export const graphqlParseValue: typeof graphql.parseValue = parseValue;
export const webParseValue: typeof parseValue = graphql.parseValue;
