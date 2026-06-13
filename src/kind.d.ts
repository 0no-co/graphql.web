import type * as GraphQL from 'graphql';

// When `graphql` isn't installed, `typeof GraphQL.Kind` resolves to `any`. That would make
// `keyof typeof GraphQL.Kind` match every `Key` and collapse `GraphQLKind` and the `Kind` value
// itself to `any`, breaking discriminated unions on AST `kind` fields. `IsGraphQLAny` detects that
// case so we fall back to the literal string kinds instead.
type IsGraphQLAny = 0 extends 1 & typeof GraphQL.Kind ? true : false;

type GraphQLKind<Key extends string, Fallback extends string> = IsGraphQLAny extends true
  ? Fallback
  : Key extends keyof typeof GraphQL.Kind
    ? (typeof GraphQL.Kind)[Key]
    : Fallback;

export declare const Kind: (IsGraphQLAny extends true ? {} : typeof GraphQL.Kind) & {
  readonly NAME: GraphQLKind<'NAME', 'Name'>;
  readonly DOCUMENT: GraphQLKind<'DOCUMENT', 'Document'>;
  readonly OPERATION_DEFINITION: GraphQLKind<'OPERATION_DEFINITION', 'OperationDefinition'>;
  readonly VARIABLE_DEFINITION: GraphQLKind<'VARIABLE_DEFINITION', 'VariableDefinition'>;
  readonly SELECTION_SET: GraphQLKind<'SELECTION_SET', 'SelectionSet'>;
  readonly FIELD: GraphQLKind<'FIELD', 'Field'>;
  readonly ARGUMENT: GraphQLKind<'ARGUMENT', 'Argument'>;
  readonly FRAGMENT_SPREAD: GraphQLKind<'FRAGMENT_SPREAD', 'FragmentSpread'>;
  readonly INLINE_FRAGMENT: GraphQLKind<'INLINE_FRAGMENT', 'InlineFragment'>;
  readonly FRAGMENT_DEFINITION: GraphQLKind<'FRAGMENT_DEFINITION', 'FragmentDefinition'>;
  readonly VARIABLE: GraphQLKind<'VARIABLE', 'Variable'>;
  readonly INT: GraphQLKind<'INT', 'IntValue'>;
  readonly FLOAT: GraphQLKind<'FLOAT', 'FloatValue'>;
  readonly STRING: GraphQLKind<'STRING', 'StringValue'>;
  readonly BOOLEAN: GraphQLKind<'BOOLEAN', 'BooleanValue'>;
  readonly NULL: GraphQLKind<'NULL', 'NullValue'>;
  readonly ENUM: GraphQLKind<'ENUM', 'EnumValue'>;
  readonly LIST: GraphQLKind<'LIST', 'ListValue'>;
  readonly OBJECT: GraphQLKind<'OBJECT', 'ObjectValue'>;
  readonly OBJECT_FIELD: GraphQLKind<'OBJECT_FIELD', 'ObjectField'>;
  readonly DIRECTIVE: GraphQLKind<'DIRECTIVE', 'Directive'>;
  readonly NAMED_TYPE: GraphQLKind<'NAMED_TYPE', 'NamedType'>;
  readonly LIST_TYPE: GraphQLKind<'LIST_TYPE', 'ListType'>;
  readonly NON_NULL_TYPE: GraphQLKind<'NON_NULL_TYPE', 'NonNullType'>;
  readonly SCHEMA_DEFINITION: GraphQLKind<'SCHEMA_DEFINITION', 'SchemaDefinition'>;
  readonly OPERATION_TYPE_DEFINITION: GraphQLKind<
    'OPERATION_TYPE_DEFINITION',
    'OperationTypeDefinition'
  >;
  readonly SCALAR_TYPE_DEFINITION: GraphQLKind<'SCALAR_TYPE_DEFINITION', 'ScalarTypeDefinition'>;
  readonly OBJECT_TYPE_DEFINITION: GraphQLKind<'OBJECT_TYPE_DEFINITION', 'ObjectTypeDefinition'>;
  readonly FIELD_DEFINITION: GraphQLKind<'FIELD_DEFINITION', 'FieldDefinition'>;
  readonly INPUT_VALUE_DEFINITION: GraphQLKind<'INPUT_VALUE_DEFINITION', 'InputValueDefinition'>;
  readonly INTERFACE_TYPE_DEFINITION: GraphQLKind<
    'INTERFACE_TYPE_DEFINITION',
    'InterfaceTypeDefinition'
  >;
  readonly UNION_TYPE_DEFINITION: GraphQLKind<'UNION_TYPE_DEFINITION', 'UnionTypeDefinition'>;
  readonly ENUM_TYPE_DEFINITION: GraphQLKind<'ENUM_TYPE_DEFINITION', 'EnumTypeDefinition'>;
  readonly ENUM_VALUE_DEFINITION: GraphQLKind<'ENUM_VALUE_DEFINITION', 'EnumValueDefinition'>;
  readonly INPUT_OBJECT_TYPE_DEFINITION: GraphQLKind<
    'INPUT_OBJECT_TYPE_DEFINITION',
    'InputObjectTypeDefinition'
  >;
  readonly DIRECTIVE_DEFINITION: GraphQLKind<'DIRECTIVE_DEFINITION', 'DirectiveDefinition'>;
  readonly SCHEMA_EXTENSION: GraphQLKind<'SCHEMA_EXTENSION', 'SchemaExtension'>;
  readonly SCALAR_TYPE_EXTENSION: GraphQLKind<'SCALAR_TYPE_EXTENSION', 'ScalarTypeExtension'>;
  readonly OBJECT_TYPE_EXTENSION: GraphQLKind<'OBJECT_TYPE_EXTENSION', 'ObjectTypeExtension'>;
  readonly INTERFACE_TYPE_EXTENSION: GraphQLKind<
    'INTERFACE_TYPE_EXTENSION',
    'InterfaceTypeExtension'
  >;
  readonly UNION_TYPE_EXTENSION: GraphQLKind<'UNION_TYPE_EXTENSION', 'UnionTypeExtension'>;
  readonly ENUM_TYPE_EXTENSION: GraphQLKind<'ENUM_TYPE_EXTENSION', 'EnumTypeExtension'>;
  readonly INPUT_OBJECT_TYPE_EXTENSION: GraphQLKind<
    'INPUT_OBJECT_TYPE_EXTENSION',
    'InputObjectTypeExtension'
  >;
  /** Coordinates */
  readonly TYPE_COORDINATE: GraphQLKind<'TYPE_COORDINATE', 'TypeCoordinate'>;
  readonly MEMBER_COORDINATE: GraphQLKind<'MEMBER_COORDINATE', 'MemberCoordinate'>;
  readonly ARGUMENT_COORDINATE: GraphQLKind<'ARGUMENT_COORDINATE', 'ArgumentCoordinate'>;
  readonly DIRECTIVE_COORDINATE: GraphQLKind<'DIRECTIVE_COORDINATE', 'DirectiveCoordinate'>;
  readonly DIRECTIVE_ARGUMENT_COORDINATE: GraphQLKind<
    'DIRECTIVE_ARGUMENT_COORDINATE',
    'DirectiveArgumentCoordinate'
  >;
};

export type Kind = (typeof Kind)[keyof typeof Kind];

export declare namespace Kind {
  /** Name */
  export type NAME = GraphQLKind<'NAME', 'Name'>;
  /** Document */
  export type DOCUMENT = GraphQLKind<'DOCUMENT', 'Document'>;
  export type OPERATION_DEFINITION = GraphQLKind<'OPERATION_DEFINITION', 'OperationDefinition'>;
  export type VARIABLE_DEFINITION = GraphQLKind<'VARIABLE_DEFINITION', 'VariableDefinition'>;
  export type SELECTION_SET = GraphQLKind<'SELECTION_SET', 'SelectionSet'>;
  export type FIELD = GraphQLKind<'FIELD', 'Field'>;
  export type ARGUMENT = GraphQLKind<'ARGUMENT', 'Argument'>;
  /** Fragments */
  export type FRAGMENT_SPREAD = GraphQLKind<'FRAGMENT_SPREAD', 'FragmentSpread'>;
  export type INLINE_FRAGMENT = GraphQLKind<'INLINE_FRAGMENT', 'InlineFragment'>;
  export type FRAGMENT_DEFINITION = GraphQLKind<'FRAGMENT_DEFINITION', 'FragmentDefinition'>;
  /** Values */
  export type VARIABLE = GraphQLKind<'VARIABLE', 'Variable'>;
  export type INT = GraphQLKind<'INT', 'IntValue'>;
  export type FLOAT = GraphQLKind<'FLOAT', 'FloatValue'>;
  export type STRING = GraphQLKind<'STRING', 'StringValue'>;
  export type BOOLEAN = GraphQLKind<'BOOLEAN', 'BooleanValue'>;
  export type NULL = GraphQLKind<'NULL', 'NullValue'>;
  export type ENUM = GraphQLKind<'ENUM', 'EnumValue'>;
  export type LIST = GraphQLKind<'LIST', 'ListValue'>;
  export type OBJECT = GraphQLKind<'OBJECT', 'ObjectValue'>;
  export type OBJECT_FIELD = GraphQLKind<'OBJECT_FIELD', 'ObjectField'>;
  /** Directives */
  export type DIRECTIVE = GraphQLKind<'DIRECTIVE', 'Directive'>;
  /** Types */
  export type NAMED_TYPE = GraphQLKind<'NAMED_TYPE', 'NamedType'>;
  export type LIST_TYPE = GraphQLKind<'LIST_TYPE', 'ListType'>;
  export type NON_NULL_TYPE = GraphQLKind<'NON_NULL_TYPE', 'NonNullType'>;
  /** Type System Definitions */
  export type SCHEMA_DEFINITION = GraphQLKind<'SCHEMA_DEFINITION', 'SchemaDefinition'>;
  export type OPERATION_TYPE_DEFINITION = GraphQLKind<
    'OPERATION_TYPE_DEFINITION',
    'OperationTypeDefinition'
  >;
  /** Type Definitions */
  export type SCALAR_TYPE_DEFINITION = GraphQLKind<
    'SCALAR_TYPE_DEFINITION',
    'ScalarTypeDefinition'
  >;
  export type OBJECT_TYPE_DEFINITION = GraphQLKind<
    'OBJECT_TYPE_DEFINITION',
    'ObjectTypeDefinition'
  >;
  export type FIELD_DEFINITION = GraphQLKind<'FIELD_DEFINITION', 'FieldDefinition'>;
  export type INPUT_VALUE_DEFINITION = GraphQLKind<
    'INPUT_VALUE_DEFINITION',
    'InputValueDefinition'
  >;
  export type INTERFACE_TYPE_DEFINITION = GraphQLKind<
    'INTERFACE_TYPE_DEFINITION',
    'InterfaceTypeDefinition'
  >;
  export type UNION_TYPE_DEFINITION = GraphQLKind<'UNION_TYPE_DEFINITION', 'UnionTypeDefinition'>;
  export type ENUM_TYPE_DEFINITION = GraphQLKind<'ENUM_TYPE_DEFINITION', 'EnumTypeDefinition'>;
  export type ENUM_VALUE_DEFINITION = GraphQLKind<'ENUM_VALUE_DEFINITION', 'EnumValueDefinition'>;
  export type INPUT_OBJECT_TYPE_DEFINITION = GraphQLKind<
    'INPUT_OBJECT_TYPE_DEFINITION',
    'InputObjectTypeDefinition'
  >;
  /** Directive Definitions */
  export type DIRECTIVE_DEFINITION = GraphQLKind<'DIRECTIVE_DEFINITION', 'DirectiveDefinition'>;
  /** Type System Extensions */
  export type SCHEMA_EXTENSION = GraphQLKind<'SCHEMA_EXTENSION', 'SchemaExtension'>;
  /** Type Extensions */
  export type SCALAR_TYPE_EXTENSION = GraphQLKind<'SCALAR_TYPE_EXTENSION', 'ScalarTypeExtension'>;
  export type OBJECT_TYPE_EXTENSION = GraphQLKind<'OBJECT_TYPE_EXTENSION', 'ObjectTypeExtension'>;
  export type INTERFACE_TYPE_EXTENSION = GraphQLKind<
    'INTERFACE_TYPE_EXTENSION',
    'InterfaceTypeExtension'
  >;
  export type UNION_TYPE_EXTENSION = GraphQLKind<'UNION_TYPE_EXTENSION', 'UnionTypeExtension'>;
  export type ENUM_TYPE_EXTENSION = GraphQLKind<'ENUM_TYPE_EXTENSION', 'EnumTypeExtension'>;
  export type INPUT_OBJECT_TYPE_EXTENSION = GraphQLKind<
    'INPUT_OBJECT_TYPE_EXTENSION',
    'InputObjectTypeExtension'
  >;
  /** Coordinates */
  export type TYPE_COORDINATE = GraphQLKind<'TYPE_COORDINATE', 'TypeCoordinate'>;
  export type MEMBER_COORDINATE = GraphQLKind<'MEMBER_COORDINATE', 'MemberCoordinate'>;
  export type ARGUMENT_COORDINATE = GraphQLKind<'ARGUMENT_COORDINATE', 'ArgumentCoordinate'>;
  export type DIRECTIVE_COORDINATE = GraphQLKind<'DIRECTIVE_COORDINATE', 'DirectiveCoordinate'>;
  export type DIRECTIVE_ARGUMENT_COORDINATE = GraphQLKind<
    'DIRECTIVE_ARGUMENT_COORDINATE',
    'DirectiveArgumentCoordinate'
  >;
}

export declare enum OperationTypeNode {
  QUERY = 'query',
  MUTATION = 'mutation',
  SUBSCRIPTION = 'subscription',
}
