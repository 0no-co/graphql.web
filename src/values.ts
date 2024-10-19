import type { TypeNode, ValueNode } from './ast';
import type { Maybe } from './types';

export function valueFromASTUntyped(
  node: ValueNode,
  variables?: Maybe<Record<string, any>>
): unknown {
  switch (node.kind) {
    case 'NullValue':
      return null;
    case 'IntValue':
      return parseInt(node.value, 10);
    case 'FloatValue':
      return parseFloat(node.value);
    case 'StringValue':
    case 'EnumValue':
    case 'BooleanValue':
      return node.value;
    case 'ListValue': {
      const values: unknown[] = [];
      for (let i = 0, l = node.values.length; i < l; i++)
        values.push(valueFromASTUntyped(node.values[i], variables));
      return values;
    }
    case 'ObjectValue': {
      const obj = Object.create(null);
      for (let i = 0, l = node.fields.length; i < l; i++) {
        const field = node.fields[i];
        obj[field.name.value] = valueFromASTUntyped(field.value, variables);
      }
      return obj;
    }
    case 'Variable':
      return variables && variables[node.name.value];
  }
}

export function valueFromTypeNode(
  node: ValueNode,
  type: TypeNode,
  variables?: Maybe<Record<string, any>>
): unknown {
  if (node.kind === 'Variable') {
    const variableName = node.name.value;
    return variables ? valueFromTypeNode(variables[variableName], type, variables) : undefined;
  } else if (type.kind === 'NonNullType') {
    return node.kind !== 'NullValue' ? valueFromTypeNode(node, type, variables) : undefined;
  } else if (node.kind === 'NullValue') {
    return null;
  } else if (type.kind === 'ListType') {
    if (node.kind === 'ListValue') {
      const values: unknown[] = [];
      for (let i = 0, l = node.values.length; i < l; i++) {
        const value = node.values[i];
        const coerced = valueFromTypeNode(value, type.type, variables);
        if (coerced === undefined) {
          return undefined;
        } else {
          values.push(coerced);
        }
      }
      return values;
    }
  } else if (type.kind === 'NamedType') {
    switch (type.name.value) {
      case 'Int':
      case 'Float':
      case 'String':
      case 'Bool':
        return type.name.value + 'Value' === node.kind
          ? valueFromASTUntyped(node, variables)
          : undefined;
      default:
        return valueFromASTUntyped(node, variables);
    }
  }
}
