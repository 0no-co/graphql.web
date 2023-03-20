import type { Kind } from './kind';

export interface Location {
  readonly start: number;
  readonly end: number;
  readonly source: Source;
}

export interface Source {
  body: string;
  name: string;
  locationOffset: {
    line: number;
    column: number;
  };
}

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
  | NonNullTypeNode;

export interface NameNode {
  readonly kind: Kind.NAME;
  readonly value: string;
}

export interface DocumentNode {
  readonly kind: Kind.DOCUMENT;
  readonly definitions: ReadonlyArray<ExecutableDefinitionNode>;
  readonly loc?: Location;
}

export type DefinitionNode = OperationDefinitionNode | FragmentDefinitionNode;
export type ExecutableDefinitionNode = OperationDefinitionNode | FragmentDefinitionNode;

export interface OperationDefinitionNode {
  readonly kind: Kind.OPERATION_DEFINITION;
  readonly operation: OperationTypeNode;
  readonly name?: NameNode;
  readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
}

export const enum OperationTypeNode {
  QUERY = 'query',
  MUTATION = 'mutation',
  SUBSCRIPTION = 'subscription',
}

export interface VariableDefinitionNode {
  readonly kind: Kind.VARIABLE_DEFINITION;
  readonly variable: VariableNode;
  readonly type: TypeNode;
  readonly defaultValue?: ConstValueNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
}

export interface VariableNode {
  readonly kind: Kind.VARIABLE;
  readonly name: NameNode;
}

export interface SelectionSetNode {
  kind: Kind.SELECTION_SET;
  selections: ReadonlyArray<SelectionNode>;
}

export declare type SelectionNode = FieldNode | FragmentSpreadNode | InlineFragmentNode;

export interface FieldNode {
  readonly kind: Kind.FIELD;
  readonly alias?: NameNode;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet?: SelectionSetNode;
}

export interface ArgumentNode {
  readonly kind: Kind.ARGUMENT;
  readonly name: NameNode;
  readonly value: ValueNode;
}

export interface ConstArgumentNode {
  readonly kind: Kind.ARGUMENT;
  readonly name: NameNode;
  readonly value: ConstValueNode;
}

export interface FragmentSpreadNode {
  readonly kind: Kind.FRAGMENT_SPREAD;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
}

export interface InlineFragmentNode {
  readonly kind: Kind.INLINE_FRAGMENT;
  readonly typeCondition?: NamedTypeNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
}

export interface FragmentDefinitionNode {
  readonly kind: Kind.FRAGMENT_DEFINITION;
  readonly name: NameNode;
  readonly typeCondition: NamedTypeNode;
  readonly directives?: ReadonlyArray<DirectiveNode>;
  readonly selectionSet: SelectionSetNode;
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
}

export interface FloatValueNode {
  readonly kind: Kind.FLOAT;
  readonly value: string;
}
export interface StringValueNode {
  readonly kind: Kind.STRING;
  readonly value: string;
  readonly block?: boolean;
}

export interface BooleanValueNode {
  readonly kind: Kind.BOOLEAN;
  readonly value: boolean;
}

export interface NullValueNode {
  readonly kind: Kind.NULL;
}

export interface EnumValueNode {
  readonly kind: Kind.ENUM;
  readonly value: string;
}

export interface ListValueNode {
  readonly kind: Kind.LIST;
  readonly values: ReadonlyArray<ValueNode>;
}

export interface ConstListValueNode {
  readonly kind: Kind.LIST;
  readonly values: ReadonlyArray<ConstValueNode>;
}

export interface ObjectValueNode {
  readonly kind: Kind.OBJECT;
  readonly fields: ReadonlyArray<ObjectFieldNode>;
}

export interface ConstObjectValueNode {
  readonly kind: Kind.OBJECT;
  readonly fields: ReadonlyArray<ConstObjectFieldNode>;
}

export interface ObjectFieldNode {
  readonly kind: Kind.OBJECT_FIELD;
  readonly name: NameNode;
  readonly value: ValueNode;
}

export interface ConstObjectFieldNode {
  readonly kind: Kind.OBJECT_FIELD;
  readonly name: NameNode;
  readonly value: ConstValueNode;
}

export interface DirectiveNode {
  readonly kind: Kind.DIRECTIVE;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
}

export interface ConstDirectiveNode {
  readonly kind: Kind.DIRECTIVE;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<ConstArgumentNode>;
}

export declare type TypeNode = NamedTypeNode | ListTypeNode | NonNullTypeNode;

export interface NamedTypeNode {
  readonly kind: Kind.NAMED_TYPE;
  readonly name: NameNode;
}

export interface ListTypeNode {
  readonly kind: Kind.LIST_TYPE;
  readonly type: TypeNode;
}

export interface NonNullTypeNode {
  readonly kind: Kind.NON_NULL_TYPE;
  readonly type: NamedTypeNode | ListTypeNode;
}
