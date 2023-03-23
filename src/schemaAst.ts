import type * as GraphQL from 'graphql';

import type { Or, Location } from './types';
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
export declare type TypeSystemDefinitionNode = Or<
  GraphQL.TypeSystemDefinitionNode,
  SchemaDefinitionNode | TypeDefinitionNode | DirectiveDefinitionNode
>;

export type SchemaDefinitionNode = Or<
  GraphQL.SchemaDefinitionNode,
  {
    readonly kind: Kind.SCHEMA_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly operationTypes: ReadonlyArray<OperationTypeDefinitionNode>;
  }
>;

export type OperationTypeDefinitionNode = Or<
  GraphQL.OperationTypeDefinitionNode,
  {
    readonly kind: Kind.OPERATION_TYPE_DEFINITION;
    readonly loc?: Location;
    readonly operation: OperationTypeNode;
    readonly type: NamedTypeNode;
  }
>;

/** Type Definition */
export declare type TypeDefinitionNode = Or<
  GraphQL.TypeDefinitionNode,
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode
>;

export type ScalarTypeDefinitionNode = Or<
  GraphQL.ScalarTypeDefinitionNode,
  {
    readonly kind: Kind.SCALAR_TYPE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  }
>;

export type ObjectTypeDefinitionNode = Or<
  GraphQL.ObjectTypeDefinitionNode,
  {
    readonly kind: Kind.OBJECT_TYPE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly interfaces?: ReadonlyArray<NamedTypeNode>;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly fields?: ReadonlyArray<FieldDefinitionNode>;
  }
>;

export type FieldDefinitionNode = Or<
  GraphQL.FieldDefinitionNode,
  {
    readonly kind: Kind.FIELD_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly arguments?: ReadonlyArray<InputValueDefinitionNode>;
    readonly type: TypeNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  }
>;

export type InputValueDefinitionNode = Or<
  GraphQL.InputValueDefinitionNode,
  {
    readonly kind: Kind.INPUT_VALUE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly type: TypeNode;
    readonly defaultValue?: ConstValueNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  }
>;

export type InterfaceTypeDefinitionNode = Or<
  GraphQL.InterfaceTypeDefinitionNode,
  {
    readonly kind: Kind.INTERFACE_TYPE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly interfaces?: ReadonlyArray<NamedTypeNode>;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly fields?: ReadonlyArray<FieldDefinitionNode>;
  }
>;

export type UnionTypeDefinitionNode = Or<
  GraphQL.UnionTypeDefinitionNode,
  {
    readonly kind: Kind.UNION_TYPE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly types?: ReadonlyArray<NamedTypeNode>;
  }
>;

export type EnumTypeDefinitionNode = Or<
  GraphQL.EnumTypeDefinitionNode,
  {
    readonly kind: Kind.ENUM_TYPE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly values?: ReadonlyArray<EnumValueDefinitionNode>;
  }
>;

export type EnumValueDefinitionNode = Or<
  GraphQL.EnumValueDefinitionNode,
  {
    readonly kind: Kind.ENUM_VALUE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  }
>;

export type InputObjectTypeDefinitionNode = Or<
  GraphQL.InputObjectTypeDefinitionNode,
  {
    readonly kind: Kind.INPUT_OBJECT_TYPE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
  }
>;

export type DirectiveDefinitionNode = Or<
  GraphQL.DirectiveDefinitionNode,
  {
    readonly kind: Kind.DIRECTIVE_DEFINITION;
    readonly loc?: Location;
    readonly description?: StringValueNode;
    readonly name: NameNode;
    readonly arguments?: ReadonlyArray<InputValueDefinitionNode>;
    readonly repeatable: boolean;
    readonly locations: ReadonlyArray<NameNode>;
  }
>;

export type TypeSystemExtensionNode = Or<
  GraphQL.TypeSystemExtensionNode,
  SchemaExtensionNode | TypeExtensionNode
>;

export type SchemaExtensionNode = Or<
  GraphQL.SchemaExtensionNode,
  {
    readonly kind: Kind.SCHEMA_EXTENSION;
    readonly loc?: Location;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly operationTypes?: ReadonlyArray<OperationTypeDefinitionNode>;
  }
>;

export declare type TypeExtensionNode = Or<
  GraphQL.TypeExtensionNode,
  | ScalarTypeExtensionNode
  | ObjectTypeExtensionNode
  | InterfaceTypeExtensionNode
  | UnionTypeExtensionNode
  | EnumTypeExtensionNode
  | InputObjectTypeExtensionNode
>;

export type ScalarTypeExtensionNode = Or<
  GraphQL.ScalarTypeExtensionNode,
  {
    readonly kind: Kind.SCALAR_TYPE_EXTENSION;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
  }
>;

export type ObjectTypeExtensionNode = Or<
  GraphQL.ObjectTypeExtensionNode,
  {
    readonly kind: Kind.OBJECT_TYPE_EXTENSION;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly interfaces?: ReadonlyArray<NamedTypeNode>;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly fields?: ReadonlyArray<FieldDefinitionNode>;
  }
>;

export type InterfaceTypeExtensionNode = Or<
  GraphQL.InterfaceTypeExtensionNode,
  {
    readonly kind: Kind.INTERFACE_TYPE_EXTENSION;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly interfaces?: ReadonlyArray<NamedTypeNode>;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly fields?: ReadonlyArray<FieldDefinitionNode>;
  }
>;

export type UnionTypeExtensionNode = Or<
  GraphQL.UnionTypeExtensionNode,
  {
    readonly kind: Kind.UNION_TYPE_EXTENSION;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly types?: ReadonlyArray<NamedTypeNode>;
  }
>;

export type EnumTypeExtensionNode = Or<
  GraphQL.EnumTypeExtensionNode,
  {
    readonly kind: Kind.ENUM_TYPE_EXTENSION;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly values?: ReadonlyArray<EnumValueDefinitionNode>;
  }
>;

export type InputObjectTypeExtensionNode = Or<
  GraphQL.InputObjectTypeExtensionNode,
  {
    readonly kind: Kind.INPUT_OBJECT_TYPE_EXTENSION;
    readonly loc?: Location;
    readonly name: NameNode;
    readonly directives?: ReadonlyArray<ConstDirectiveNode>;
    readonly fields?: ReadonlyArray<InputValueDefinitionNode>;
  }
>;
