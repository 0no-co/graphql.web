import type { Kind, OperationTypeNode } from './kind';
import type { Location } from './types';

import type {
  TypeSystemDefinitionNode,
  TypeSystemExtensionNode
} from './schemaAst';

export declare type ASTNode =
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
  | TypeSystemDefinitionNode
  | TypeSystemExtensionNode;

export interface NameNode {
  readonly kind: Kind.NAME;
  readonly value: string;
  readonly loc?: Location;
}

export interface DocumentNode {
  readonly kind: Kind.DOCUMENT;
  readonly definitions: ReadonlyArray<DefinitionNode>;
  readonly loc?: Location;
}

export type DefinitionNode =
  | ExecutableDefinitionNode
  | TypeSystemDefinitionNode
  | TypeSystemExtensionNode;

export type ExecutableDefinitionNode =
  | OperationDefinitionNode
  | FragmentDefinitionNode;

export interface OperationDefinitionNode {
  readonly kind: Kind.OPERATION_DEFINITION;
  readonly operation: OperationTypeNode;
  readonly name?: NameNode;
  readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
  readonly loc?: Location;
}

export interface VariableDefinitionNode {
  readonly kind: Kind.VARIABLE_DEFINITION;
  readonly variable: VariableNode;
  readonly type: TypeNode;
  readonly defaultValue?: ConstValueNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly loc?: Location;
}

export interface VariableNode {
  readonly kind: Kind.VARIABLE;
  readonly name: NameNode;
  readonly loc?: Location;
}

export interface SelectionSetNode {
  readonly kind: Kind.SELECTION_SET;
  readonly selections: ReadonlyArray<SelectionNode>;
  readonly loc?: Location;
}

export declare type SelectionNode =
  | FieldNode
  | FragmentSpreadNode
  | InlineFragmentNode;

export interface FieldNode {
  readonly kind: Kind.FIELD;
  readonly alias?: NameNode;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet?: SelectionSetNode;
  readonly loc?: Location;
}

export interface ArgumentNode {
  readonly kind: Kind.ARGUMENT;
  readonly name: NameNode;
  readonly value: ValueNode;
  readonly loc?: Location;
}

export interface ConstArgumentNode {
  readonly kind: Kind.ARGUMENT;
  readonly name: NameNode;
  readonly value: ConstValueNode;
  readonly loc?: Location;
}

export interface FragmentSpreadNode {
  readonly kind: Kind.FRAGMENT_SPREAD;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly loc?: Location;
}

export interface InlineFragmentNode {
  readonly kind: Kind.INLINE_FRAGMENT;
  readonly typeCondition?: NamedTypeNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
  readonly loc?: Location;
}

export interface FragmentDefinitionNode {
  readonly kind: Kind.FRAGMENT_DEFINITION;
  readonly name: NameNode;
  readonly typeCondition: NamedTypeNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
  readonly loc?: Location;
}

export type ValueNode =
  | VariableNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode;

export type ConstValueNode =
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ConstListValueNode
  | ConstObjectValueNode;

export interface IntValueNode {
  readonly kind: Kind.INT;
  readonly value: string;
  readonly loc?: Location;
}

export interface FloatValueNode {
  readonly kind: Kind.FLOAT;
  readonly value: string;
  readonly loc?: Location;
}

export interface StringValueNode {
  readonly kind: Kind.STRING;
  readonly value: string;
  readonly block?: boolean;
  readonly loc?: Location;
}

export interface BooleanValueNode {
  readonly kind: Kind.BOOLEAN;
  readonly value: boolean;
  readonly loc?: Location;
}

export interface NullValueNode {
  readonly kind: Kind.NULL;
  readonly loc?: Location;
}

export interface EnumValueNode {
  readonly kind: Kind.ENUM;
  readonly value: string;
  readonly loc?: Location;
}

export interface ListValueNode {
  readonly kind: Kind.LIST;
  readonly values: ReadonlyArray<ValueNode>;
  readonly loc?: Location;
}

export interface ConstListValueNode {
  readonly kind: Kind.LIST;
  readonly values: ReadonlyArray<ConstValueNode>;
  readonly loc?: Location;
}

export interface ObjectValueNode {
  readonly kind: Kind.OBJECT;
  readonly fields: ReadonlyArray<ObjectFieldNode>;
  readonly loc?: Location;
}

export interface ConstObjectValueNode {
  readonly kind: Kind.OBJECT;
  readonly fields: ReadonlyArray<ConstObjectFieldNode>;
  readonly loc?: Location;
}

export interface ObjectFieldNode {
  readonly kind: Kind.OBJECT_FIELD;
  readonly name: NameNode;
  readonly value: ValueNode;
  readonly loc?: Location;
}

export interface ConstObjectFieldNode {
  readonly kind: Kind.OBJECT_FIELD;
  readonly name: NameNode;
  readonly value: ConstValueNode;
  readonly loc?: Location;
}

export interface DirectiveNode {
  readonly kind: Kind.DIRECTIVE;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
  readonly loc?: Location;
}

export interface ConstDirectiveNode {
  readonly kind: Kind.DIRECTIVE;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ConstArgumentNode>;
  readonly loc?: Location;
}

export declare type TypeNode = NamedTypeNode | ListTypeNode | NonNullTypeNode;

export interface NamedTypeNode {
  readonly kind: Kind.NAMED_TYPE;
  readonly name: NameNode;
  readonly loc?: Location;
}

export interface ListTypeNode {
  readonly kind: Kind.LIST_TYPE;
  readonly type: TypeNode;
  readonly loc?: Location;
}

export interface NonNullTypeNode {
  readonly kind: Kind.NON_NULL_TYPE;
  readonly type: NamedTypeNode | ListTypeNode;
  readonly loc?: Location;
}
