import type * as GraphQL from 'graphql';

import type { Kind, OperationTypeNode } from './kind';
import type { OrNever, Location } from './types';

import type {
  TypeSystemDefinitionNode,
  TypeSystemExtensionNode,
  SchemaDefinitionNode,
  OperationTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  UnionTypeDefinitionNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  DirectiveDefinitionNode,
  SchemaExtensionNode,
  ScalarTypeExtensionNode,
  ObjectTypeExtensionNode,
  InterfaceTypeExtensionNode,
  UnionTypeExtensionNode,
  EnumTypeExtensionNode,
  InputObjectTypeExtensionNode,
} from './schemaAst';

export type ASTNode =
  | NameNode
  | DocumentNode
  | OperationDefinitionNode
  | VariableDefinitionNode
  | VariableNode
  | SelectionSetNode
  | FieldNode
  | ArgumentNode
  | FragmentSpreadNode
  | InlineFragmentNode
  | FragmentDefinitionNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode
  | ObjectFieldNode
  | DirectiveNode
  | NamedTypeNode
  | ListTypeNode
  | NonNullTypeNode
  | SchemaDefinitionNode
  | OperationTypeDefinitionNode
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | FieldDefinitionNode
  | InputValueDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | EnumValueDefinitionNode
  | InputObjectTypeDefinitionNode
  | DirectiveDefinitionNode
  | SchemaExtensionNode
  | ScalarTypeExtensionNode
  | ObjectTypeExtensionNode
  | InterfaceTypeExtensionNode
  | UnionTypeExtensionNode
  | EnumTypeExtensionNode
  | InputObjectTypeExtensionNode
  | OrNever<GraphQL.ASTNode>;

export type NameNode = {
  readonly kind: Kind.NAME;
  readonly value: string;
  readonly loc?: Location;
} | OrNever<GraphQL.NameNode>;

export type DocumentNode = {
  readonly kind: Kind.DOCUMENT;
  readonly definitions: ReadonlyArray<DefinitionNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.NameNode>;

export type DefinitionNode =
  | ExecutableDefinitionNode
  | TypeSystemDefinitionNode
  | TypeSystemExtensionNode
  | OrNever<GraphQL.DefinitionNode>;

export type ExecutableDefinitionNode =
  | OperationDefinitionNode
  | FragmentDefinitionNode
  | OrNever<GraphQL.ExecutableDefinitionNode>;

export type OperationDefinitionNode = {
  readonly kind: Kind.OPERATION_DEFINITION;
  readonly operation: OperationTypeNode;
  readonly name?: NameNode;
  readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
  readonly loc?: Location;
} | OrNever<GraphQL.OperationDefinitionNode>;

export type VariableDefinitionNode = {
  readonly kind: Kind.VARIABLE_DEFINITION;
  readonly variable: VariableNode;
  readonly type: TypeNode;
  readonly defaultValue?: ConstValueNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.VariableDefinitionNode>;

export type VariableNode = {
  readonly kind: Kind.VARIABLE;
  readonly name: NameNode;
  readonly loc?: Location;
} | OrNever<GraphQL.VariableNode>;

export type SelectionSetNode = {
  readonly kind: Kind.SELECTION_SET;
  readonly selections: ReadonlyArray<SelectionNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.SelectionSetNode>;

export declare type SelectionNode =
  | FieldNode
  | FragmentSpreadNode
  | InlineFragmentNode
  | OrNever<GraphQL.SelectionNode>;

export type FieldNode = {
  readonly kind: Kind.FIELD;
  readonly alias?: NameNode;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet?: SelectionSetNode;
  readonly loc?: Location;
} | OrNever<GraphQL.FieldNode>

export type ArgumentNode = {
  readonly kind: Kind.ARGUMENT;
  readonly name: NameNode;
  readonly value: ValueNode;
  readonly loc?: Location;
} | OrNever<GraphQL.ArgumentNode>;

export type ConstArgumentNode = {
  readonly kind: Kind.ARGUMENT;
  readonly name: NameNode;
  readonly value: ConstValueNode;
  readonly loc?: Location;
} | OrNever<GraphQL.ConstArgumentNode>;

export type FragmentSpreadNode = {
  readonly kind: Kind.FRAGMENT_SPREAD;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.FragmentSpreadNode>;

export type InlineFragmentNode = {
  readonly kind: Kind.INLINE_FRAGMENT;
  readonly typeCondition?: NamedTypeNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
  readonly loc?: Location;
} | OrNever<GraphQL.InlineFragmentNode>;

export type FragmentDefinitionNode = {
  readonly kind: Kind.FRAGMENT_DEFINITION;
  readonly name: NameNode;
  readonly typeCondition: NamedTypeNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
  readonly loc?: Location;
} | OrNever<GraphQL.FragmentDefinitionNode>;

export type ValueNode =
  | VariableNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode
  | OrNever<GraphQL.ValueNode>;

export type ConstValueNode =
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ConstListValueNode
  | ConstObjectValueNode
  | OrNever<GraphQL.ConstValueNode>;

export type IntValueNode = {
  readonly kind: Kind.INT;
  readonly value: string;
  readonly loc?: Location;
} | OrNever<GraphQL.IntValueNode>;

export type FloatValueNode = {
  readonly kind: Kind.FLOAT;
  readonly value: string;
  readonly loc?: Location;
} | OrNever<GraphQL.FloatValueNode>;

export type StringValueNode = {
  readonly kind: Kind.STRING;
  readonly value: string;
  readonly block?: boolean;
  readonly loc?: Location;
} | OrNever<GraphQL.FloatValueNode>;

export type BooleanValueNode = {
  readonly kind: Kind.BOOLEAN;
  readonly value: boolean;
  readonly loc?: Location;
} | OrNever<GraphQL.BooleanValueNode>;

export type NullValueNode = {
  readonly kind: Kind.NULL;
  readonly loc?: Location;
} | OrNever<GraphQL.NullValueNode>;

export type EnumValueNode = {
  readonly kind: Kind.ENUM;
  readonly value: string;
  readonly loc?: Location;
} | OrNever<GraphQL.EnumValueNode>;

export type ListValueNode = {
  readonly kind: Kind.LIST;
  readonly values: ReadonlyArray<ValueNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.ListValueNode>;

export type ConstListValueNode = {
  readonly kind: Kind.LIST;
  readonly values: ReadonlyArray<ConstValueNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.ConstListValueNode>;

export type ObjectValueNode = {
  readonly kind: Kind.OBJECT;
  readonly fields: ReadonlyArray<ObjectFieldNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.ObjectValueNode>;

export type ConstObjectValueNode = {
  readonly kind: Kind.OBJECT;
  readonly fields: ReadonlyArray<ConstObjectFieldNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.ConstObjectValueNode>;

export type ObjectFieldNode = {
  readonly kind: Kind.OBJECT_FIELD;
  readonly name: NameNode;
  readonly value: ValueNode;
  readonly loc?: Location;
} | OrNever<GraphQL.ObjectFieldNode>;

export type ConstObjectFieldNode = {
  readonly kind: Kind.OBJECT_FIELD;
  readonly name: NameNode;
  readonly value: ConstValueNode;
  readonly loc?: Location;
} | OrNever<GraphQL.ConstObjectFieldNode>;

export type DirectiveNode = {
  readonly kind: Kind.DIRECTIVE;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.DirectiveNode>;

export type ConstDirectiveNode = {
  readonly kind: Kind.DIRECTIVE;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ConstArgumentNode>;
  readonly loc?: Location;
} | OrNever<GraphQL.ConstDirectiveNode>;

export type TypeNode =
  | NamedTypeNode
  | ListTypeNode
  | NonNullTypeNode
  | OrNever<GraphQL.TypeNode>;

export type NamedTypeNode = {
  readonly kind: Kind.NAMED_TYPE;
  readonly name: NameNode;
  readonly loc?: Location;
} | OrNever<GraphQL.NamedTypeNode>;

export type ListTypeNode = {
  readonly kind: Kind.LIST_TYPE;
  readonly type: TypeNode;
  readonly loc?: Location;
} | OrNever<GraphQL.ListTypeNode>;

export type NonNullTypeNode = {
  readonly kind: Kind.NON_NULL_TYPE;
  readonly type: NamedTypeNode | ListTypeNode;
  readonly loc?: Location;
} | OrNever<GraphQL.NonNullTypeNode>;
