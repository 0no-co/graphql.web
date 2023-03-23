import type * as GraphQL from 'graphql';

import type { OrNever, Location } from './types';
import type { Kind, OperationTypeNode } from './kind';

import type {
  StringValueNode,
  ConstDirectiveNode,
  ConstValueNode,
  NamedTypeNode,
  TypeNode,
  NameNode,
} from './ast';

/** Type System Definition */
export declare type TypeSystemDefinitionNode =
  | SchemaDefinitionNode
  | TypeDefinitionNode
  | DirectiveDefinitionNode
  | OrNever<GraphQL.TypeSystemDefinitionNode>;

export type SchemaDefinitionNode = {
  readonly kind: Kind.SCHEMA_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly operationTypes: ReadonlyArray<OperationTypeDefinitionNode>;
} | OrNever<GraphQL.SchemaDefinitionNode>;

export type OperationTypeDefinitionNode = {
  readonly kind: Kind.OPERATION_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly operation: OperationTypeNode;
  readonly type: NamedTypeNode;
} | OrNever<GraphQL.OperationTypeDefinitionNode>;

/** Type Definition */
export declare type TypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode
  | OrNever<GraphQL.TypeDefinitionNode>;

export type ScalarTypeDefinitionNode = {
  readonly kind: Kind.SCALAR_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
} | OrNever<GraphQL.ScalarTypeDefinitionNode>;

export type ObjectTypeDefinitionNode = {
  readonly kind: Kind.OBJECT_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
} | OrNever<GraphQL.ObjectTypeDefinitionNode>;

export type FieldDefinitionNode = {
  readonly kind: Kind.FIELD_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<InputValueDefinitionNode>;
  readonly type: TypeNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
} | OrNever<GraphQL.FieldDefinitionNode>;

export type InputValueDefinitionNode = {
  readonly kind: Kind.INPUT_VALUE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly type: TypeNode;
  readonly defaultValue?: ConstValueNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
} | OrNever<GraphQL.InputValueDefinitionNode>;

export type InterfaceTypeDefinitionNode = {
  readonly kind: Kind.INTERFACE_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
} | OrNever<GraphQL.InterfaceTypeDefinitionNode>;

export type UnionTypeDefinitionNode = {
  readonly kind: Kind.UNION_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly types?: ReadonlyArray<NamedTypeNode>;
} | OrNever<GraphQL.UnionTypeDefinitionNode>;

export type EnumTypeDefinitionNode = {
  readonly kind: Kind.ENUM_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly values?: ReadonlyArray<EnumValueDefinitionNode>;
} | OrNever<GraphQL.EnumTypeDefinitionNode>;

export type EnumValueDefinitionNode = {
  readonly kind: Kind.ENUM_VALUE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
} | OrNever<GraphQL.EnumValueDefinitionNode>;

export type InputObjectTypeDefinitionNode = {
  readonly kind: Kind.INPUT_OBJECT_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
} | OrNever<GraphQL.InputObjectTypeDefinitionNode>;

/** Directive Definitions */
export type DirectiveDefinitionNode = {
  readonly kind: Kind.DIRECTIVE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<InputValueDefinitionNode>;
  readonly repeatable: boolean;
  readonly locations: ReadonlyArray<NameNode>;
} | OrNever<GraphQL.DirectiveDefinitionNode>;

/** Type System Extensions */
export type TypeSystemExtensionNode =
  | SchemaExtensionNode
  | TypeExtensionNode
  | OrNever<GraphQL.TypeSystemExtensionNode>;

export type SchemaExtensionNode = {
  readonly kind: Kind.SCHEMA_EXTENSION;
  readonly loc?: Location;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly operationTypes?: ReadonlyArray<OperationTypeDefinitionNode>;
} | OrNever<GraphQL.SchemaExtensionNode>;

/** Type Extensions */
export declare type TypeExtensionNode =
  | ScalarTypeExtensionNode
  | ObjectTypeExtensionNode
  | InterfaceTypeExtensionNode
  | UnionTypeExtensionNode
  | EnumTypeExtensionNode
  | InputObjectTypeExtensionNode
  | OrNever<GraphQL.TypeExtensionNode>;

export type ScalarTypeExtensionNode = {
  readonly kind: Kind.SCALAR_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
} | OrNever<GraphQL.ScalarTypeExtensionNode>;

export type ObjectTypeExtensionNode = {
  readonly kind: Kind.OBJECT_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
} | OrNever<GraphQL.ObjectTypeExtensionNode>;

export type InterfaceTypeExtensionNode = {
  readonly kind: Kind.INTERFACE_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
} | OrNever<GraphQL.InterfaceTypeExtensionNode>;

export type UnionTypeExtensionNode = {
  readonly kind: Kind.UNION_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly types?: ReadonlyArray<NamedTypeNode>;
} | OrNever<GraphQL.UnionTypeExtensionNode>;

export type EnumTypeExtensionNode = {
  readonly kind: Kind.ENUM_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly values?: ReadonlyArray<EnumValueDefinitionNode>;
} | OrNever<GraphQL.EnumTypeExtensionNode>;

export type InputObjectTypeExtensionNode = {
  readonly kind: Kind.INPUT_OBJECT_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
} | OrNever<GraphQL.InputObjectTypeExtensionNode>;
