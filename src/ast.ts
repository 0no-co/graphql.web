import type * as GraphQL from 'graphql';

import type { Kind, OperationTypeNode } from './kind';
import type { Or, Location } from './types';

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

export type ASTNode = Or<
  GraphQL.ASTNode,
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
>;

export type NameNode = Or<
  GraphQL.NameNode,
  {
    readonly kind: Kind.NAME;
    readonly value: string;
    readonly loc?: Location;
  }
>;

export type DocumentNode = Or<
  GraphQL.DocumentNode,
  {
    readonly kind: Kind.DOCUMENT;
    readonly definitions: ReadonlyArray<DefinitionNode>;
    readonly loc?: Location;
  }
>;

export type DefinitionNode = Or<
  GraphQL.DefinitionNode,
  ExecutableDefinitionNode | TypeSystemDefinitionNode | TypeSystemExtensionNode
>;

export type ExecutableDefinitionNode = Or<
  GraphQL.ExecutableDefinitionNode,
  OperationDefinitionNode | FragmentDefinitionNode
>;

export type OperationDefinitionNode = Or<
  GraphQL.OperationDefinitionNode,
  {
    readonly kind: Kind.OPERATION_DEFINITION;
    readonly operation: OperationTypeNode;
    readonly name?: NameNode;
    readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
    readonly directives?: ReadonlyArray<DirectiveNode>;
    readonly selectionSet: SelectionSetNode;
    readonly loc?: Location;
  }
>;

export type VariableDefinitionNode = Or<
  GraphQL.VariableDefinitionNode,
  {
    readonly kind: Kind.VARIABLE_DEFINITION;
    readonly variable: VariableNode;
    readonly type: TypeNode;
    readonly defaultValue?: ConstValueNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly loc?: Location;
  }
>;

export type VariableNode = Or<
  GraphQL.VariableNode,
  {
    readonly kind: Kind.VARIABLE;
    readonly name: NameNode;
    readonly loc?: Location;
  }
>;

export type SelectionSetNode = Or<
  GraphQL.SelectionSetNode,
  {
    readonly kind: Kind.SELECTION_SET;
    readonly selections: ReadonlyArray<SelectionNode>;
    readonly loc?: Location;
  }
>;

export declare type SelectionNode = Or<
  GraphQL.SelectionNode,
  FieldNode | FragmentSpreadNode | InlineFragmentNode
>;

export type FieldNode = Or<
  GraphQL.FieldNode,
  {
    readonly kind: Kind.FIELD;
    readonly alias?: NameNode;
    readonly name: NameNode;
    readonly arguments?: ReadonlyArray<ArgumentNode>;
    readonly directives?: ReadonlyArray<DirectiveNode>;
    readonly selectionSet?: SelectionSetNode;
    readonly loc?: Location;
  }
>;

export type ArgumentNode = Or<
  GraphQL.ArgumentNode,
  {
    readonly kind: Kind.ARGUMENT;
    readonly name: NameNode;
    readonly value: ValueNode;
    readonly loc?: Location;
  }
>;

export type ConstArgumentNode = Or<
  GraphQL.ConstArgumentNode,
  {
    readonly kind: Kind.ARGUMENT;
    readonly name: NameNode;
    readonly value: ConstValueNode;
    readonly loc?: Location;
  }
>;

export type FragmentSpreadNode = Or<
  GraphQL.FragmentSpreadNode,
  {
    readonly kind: Kind.FRAGMENT_SPREAD;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<DirectiveNode>;
    readonly loc?: Location;
  }
>;

export type InlineFragmentNode = Or<
  GraphQL.InlineFragmentNode,
  {
    readonly kind: Kind.INLINE_FRAGMENT;
    readonly typeCondition?: NamedTypeNode;
    readonly directives?: ReadonlyArray<DirectiveNode>;
    readonly selectionSet: SelectionSetNode;
    readonly loc?: Location;
  }
>;

export type FragmentDefinitionNode = Or<
  GraphQL.FragmentDefinitionNode,
  {
    readonly kind: Kind.FRAGMENT_DEFINITION;
    readonly name: NameNode;
    readonly typeCondition: NamedTypeNode;
    readonly directives?: ReadonlyArray<DirectiveNode>;
    readonly selectionSet: SelectionSetNode;
    readonly loc?: Location;
  }
>;

export type ValueNode = Or<
  GraphQL.ValueNode,
  | VariableNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode
>;

export type ConstValueNode = Or<
  GraphQL.ConstValueNode,
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ConstListValueNode
  | ConstObjectValueNode
>;

export type IntValueNode = Or<
  GraphQL.IntValueNode,
  {
    readonly kind: Kind.INT;
    readonly value: string;
    readonly loc?: Location;
  }
>;

export type FloatValueNode = Or<
  GraphQL.FloatValueNode,
  {
    readonly kind: Kind.FLOAT;
    readonly value: string;
    readonly loc?: Location;
  }
>;

export type StringValueNode = Or<
  GraphQL.StringValueNode,
  {
    readonly kind: Kind.STRING;
    readonly value: string;
    readonly block?: boolean;
    readonly loc?: Location;
  }
>;

export type BooleanValueNode = Or<
  GraphQL.BooleanValueNode,
  {
    readonly kind: Kind.BOOLEAN;
    readonly value: boolean;
    readonly loc?: Location;
  }
>;

export type NullValueNode = Or<
  GraphQL.NullValueNode,
  {
    readonly kind: Kind.NULL;
    readonly loc?: Location;
  }
>;

export type EnumValueNode = Or<
  GraphQL.EnumValueNode,
  {
    readonly kind: Kind.ENUM;
    readonly value: string;
    readonly loc?: Location;
  }
>;

export type ListValueNode = Or<
  GraphQL.ListValueNode,
  {
    readonly kind: Kind.LIST;
    readonly values: ReadonlyArray<ValueNode>;
    readonly loc?: Location;
  }
>;

export type ConstListValueNode = Or<
  GraphQL.ConstListValueNode,
  {
    readonly kind: Kind.LIST;
    readonly values: ReadonlyArray<ConstValueNode>;
    readonly loc?: Location;
  }
>;

export type ObjectValueNode = Or<
  GraphQL.ObjectValueNode,
  {
    readonly kind: Kind.OBJECT;
    readonly fields: ReadonlyArray<ObjectFieldNode>;
    readonly loc?: Location;
  }
>;

export type ConstObjectValueNode = Or<
  GraphQL.ConstObjectValueNode,
  {
    readonly kind: Kind.OBJECT;
    readonly fields: ReadonlyArray<ConstObjectFieldNode>;
    readonly loc?: Location;
  }
>;

export type ObjectFieldNode = Or<
  GraphQL.ObjectFieldNode,
  {
    readonly kind: Kind.OBJECT_FIELD;
    readonly name: NameNode;
    readonly value: ValueNode;
    readonly loc?: Location;
  }
>;

export type ConstObjectFieldNode = Or<
  GraphQL.ConstObjectFieldNode,
  {
    readonly kind: Kind.OBJECT_FIELD;
    readonly name: NameNode;
    readonly value: ConstValueNode;
    readonly loc?: Location;
  }
>;

export type DirectiveNode = Or<
  GraphQL.DirectiveNode,
  {
    readonly kind: Kind.DIRECTIVE;
    readonly name: NameNode;
    readonly arguments?: ReadonlyArray<ArgumentNode>;
    readonly loc?: Location;
  }
>;

export type ConstDirectiveNode = Or<
  GraphQL.ConstDirectiveNode,
  {
    readonly kind: Kind.DIRECTIVE;
    readonly name: NameNode;
    readonly arguments?: ReadonlyArray<ConstArgumentNode>;
    readonly loc?: Location;
  }
>;

export type TypeNode = Or<GraphQL.TypeNode, NamedTypeNode | ListTypeNode | NonNullTypeNode>;

export type NamedTypeNode = Or<
  GraphQL.NamedTypeNode,
  {
    readonly kind: Kind.NAMED_TYPE;
    readonly name: NameNode;
    readonly loc?: Location;
  }
>;

export type ListTypeNode = Or<
  GraphQL.ListTypeNode,
  {
    readonly kind: Kind.LIST_TYPE;
    readonly type: TypeNode;
    readonly loc?: Location;
  }
>;

export type NonNullTypeNode = Or<
  GraphQL.NonNullTypeNode,
  {
    readonly kind: Kind.NON_NULL_TYPE;
    readonly type: NamedTypeNode | ListTypeNode;
    readonly loc?: Location;
  }
>;
