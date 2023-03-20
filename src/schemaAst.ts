import type { Location } from './types';
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
  | DirectiveDefinitionNode;

export interface SchemaDefinitionNode {
  readonly kind: Kind.SCHEMA_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly operationTypes: ReadonlyArray<OperationTypeDefinitionNode>;
}

export interface OperationTypeDefinitionNode {
  readonly kind: Kind.OPERATION_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly operation: OperationTypeNode;
  readonly type: NamedTypeNode;
}

/** Type Definition */
export declare type TypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;

export interface ScalarTypeDefinitionNode {
  readonly kind: Kind.SCALAR_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
}

export interface ObjectTypeDefinitionNode {
  readonly kind: Kind.OBJECT_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
}

export interface FieldDefinitionNode {
  readonly kind: Kind.FIELD_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<InputValueDefinitionNode>;
  readonly type: TypeNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
}

export interface InputValueDefinitionNode {
  readonly kind: Kind.INPUT_VALUE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly type: TypeNode;
  readonly defaultValue?: ConstValueNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
}

export interface InterfaceTypeDefinitionNode {
  readonly kind: Kind.INTERFACE_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
}

export interface UnionTypeDefinitionNode {
  readonly kind: Kind.UNION_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly types?: ReadonlyArray<NamedTypeNode>;
}

export interface EnumTypeDefinitionNode {
  readonly kind: Kind.ENUM_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly values?: ReadonlyArray<EnumValueDefinitionNode>;
}

export interface EnumValueDefinitionNode {
  readonly kind: Kind.ENUM_VALUE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
}

export interface InputObjectTypeDefinitionNode {
  readonly kind: Kind.INPUT_OBJECT_TYPE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
}
/** Directive Definitions */
export interface DirectiveDefinitionNode {
  readonly kind: Kind.DIRECTIVE_DEFINITION;
  readonly loc?: Location;
  readonly description?: StringValueNode;
  readonly name: NameNode;
  readonly arguments?: ReadonlyArray<InputValueDefinitionNode>;
  readonly repeatable: boolean;
  readonly locations: ReadonlyArray<NameNode>;
}
/** Type System Extensions */
export declare type TypeSystemExtensionNode = SchemaExtensionNode | TypeExtensionNode;
export interface SchemaExtensionNode {
  readonly kind: Kind.SCHEMA_EXTENSION;
  readonly loc?: Location;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly operationTypes?: ReadonlyArray<OperationTypeDefinitionNode>;
}
/** Type Extensions */
export declare type TypeExtensionNode =
  | ScalarTypeExtensionNode
  | ObjectTypeExtensionNode
  | InterfaceTypeExtensionNode
  | UnionTypeExtensionNode
  | EnumTypeExtensionNode
  | InputObjectTypeExtensionNode;
export interface ScalarTypeExtensionNode {
  readonly kind: Kind.SCALAR_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
}

export interface ObjectTypeExtensionNode {
  readonly kind: Kind.OBJECT_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
}

export interface InterfaceTypeExtensionNode {
  readonly kind: Kind.INTERFACE_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly interfaces?: ReadonlyArray<NamedTypeNode>;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<FieldDefinitionNode>;
}

export interface UnionTypeExtensionNode {
  readonly kind: Kind.UNION_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly types?: ReadonlyArray<NamedTypeNode>;
}

export interface EnumTypeExtensionNode {
  readonly kind: Kind.ENUM_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly values?: ReadonlyArray<EnumValueDefinitionNode>;
}

export interface InputObjectTypeExtensionNode {
  readonly kind: Kind.INPUT_OBJECT_TYPE_EXTENSION;
  readonly loc?: Location;
  readonly name: NameNode;
  readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
}
