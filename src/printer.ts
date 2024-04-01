import type {
  ASTNode,
  NameNode,
  DocumentNode,
  VariableNode,
  SelectionSetNode,
  FieldNode,
  ArgumentNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  VariableDefinitionNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  IntValueNode,
  FloatValueNode,
  StringValueNode,
  BooleanValueNode,
  NullValueNode,
  EnumValueNode,
  ListValueNode,
  ObjectValueNode,
  ObjectFieldNode,
  DirectiveNode,
  NamedTypeNode,
  ListTypeNode,
  NonNullTypeNode,
} from './ast';

function printString(string: string) {
  return JSON.stringify(string);
}

function printBlockString(string: string) {
  return '"""\n' + string.replace(/"""/g, '\\"""') + '\n"""';
}

const MAX_LINE_LENGTH = 80;

let INDENT = 0;

const nodes = {
  OperationDefinition(node: OperationDefinitionNode): string {
    if (
      node.operation === 'query' &&
      !node.name &&
      !(node.variableDefinitions && node.variableDefinitions.length) &&
      !(node.directives && node.directives.length)
    ) {
      return nodes.SelectionSet(node.selectionSet);
    }
    let out: string = node.operation;
    if (node.name) out += ' ' + node.name.value;
    if (node.variableDefinitions && node.variableDefinitions.length) {
      if (!node.name) out += ' ';
      out += '(' + node.variableDefinitions.map(nodes.VariableDefinition).join(', ') + ')';
    }
    if (node.directives && node.directives.length)
      out += ' ' + node.directives.map(nodes.Directive).join(' ');
    return out + ' ' + nodes.SelectionSet!(node.selectionSet);
  },
  VariableDefinition(node: VariableDefinitionNode): string {
    let out = nodes.Variable!(node.variable) + ': ' + _print(node.type);
    if (node.defaultValue) out += ' = ' + _print(node.defaultValue);
    if (node.directives && node.directives.length)
      out += ' ' + node.directives.map(nodes.Directive).join(' ');
    return out;
  },
  Field(node: FieldNode): string {
    let out = node.alias ? node.alias.value + ': ' + node.name.value : node.name.value;
    if (node.arguments && node.arguments.length) {
      const args = node.arguments.map(nodes.Argument);
      const argsLine = '(' + args.join(', ') + ')';
      if (out.length + argsLine.length > MAX_LINE_LENGTH) {
        out +=
          '(\n' +
          '  '.repeat(++INDENT) +
          args.join('\n' + '  '.repeat(INDENT)) +
          '\n' +
          '  '.repeat(--INDENT) +
          ')';
      } else {
        out += argsLine;
      }
    }
    if (node.directives && node.directives.length)
      out += ' ' + node.directives.map(nodes.Directive).join(' ');
    if (node.selectionSet) out += ' ' + nodes.SelectionSet(node.selectionSet);
    return out;
  },
  StringValue(node: StringValueNode): string {
    if (node.block) {
      return printBlockString(node.value).replace(/\n/g, '\n' + '  '.repeat(INDENT + 1));
    } else {
      return printString(node.value);
    }
  },
  BooleanValue(node: BooleanValueNode): string {
    return '' + node.value;
  },
  NullValue(_node: NullValueNode): string {
    return 'null';
  },
  IntValue(node: IntValueNode): string {
    return node.value;
  },
  FloatValue(node: FloatValueNode): string {
    return node.value;
  },
  EnumValue(node: EnumValueNode): string {
    return node.value;
  },
  Name(node: NameNode): string {
    return node.value;
  },
  Variable(node: VariableNode): string {
    return '$' + node.name.value;
  },
  ListValue(node: ListValueNode): string {
    return '[' + node.values.map(_print).join(', ') + ']';
  },
  ObjectValue(node: ObjectValueNode): string {
    return '{' + node.fields.map(nodes.ObjectField).join(', ') + '}';
  },
  ObjectField(node: ObjectFieldNode): string {
    return node.name.value + ': ' + _print(node.value);
  },
  Document(node: DocumentNode): string {
    if (!node.definitions || !node.definitions.length) return '';
    return node.definitions.map(_print).join('\n\n');
  },
  SelectionSet(node: SelectionSetNode): string {
    return (
      '{\n' +
      '  '.repeat(++INDENT) +
      node.selections.map(_print).join('\n' + '  '.repeat(INDENT)) +
      '\n' +
      '  '.repeat(--INDENT) +
      '}'
    );
  },
  Argument(node: ArgumentNode): string {
    return node.name.value + ': ' + _print(node.value);
  },
  FragmentSpread(node: FragmentSpreadNode): string {
    let out = '...' + node.name.value;
    if (node.directives && node.directives.length)
      out += ' ' + node.directives.map(nodes.Directive).join(' ');
    return out;
  },
  InlineFragment(node: InlineFragmentNode): string {
    let out = '...';
    if (node.typeCondition) out += ' on ' + node.typeCondition.name.value;
    if (node.directives && node.directives.length)
      out += ' ' + node.directives.map(nodes.Directive).join(' ');
    out += ' ' + _print(node.selectionSet);
    return out;
  },
  FragmentDefinition(node: FragmentDefinitionNode): string {
    let out = 'fragment ' + node.name.value;
    if (node.variableDefinitions && node.variableDefinitions.length)
      out += '(' + node.variableDefinitions.map(nodes.VariableDefinition).join(', ') + ')';
    out += ' on ' + node.typeCondition.name.value;
    if (node.directives && node.directives.length)
      out += ' ' + node.directives.map(nodes.Directive).join(' ');
    return out + ' ' + _print(node.selectionSet);
  },
  Directive(node: DirectiveNode): string {
    let out = '@' + node.name.value;
    if (node.arguments && node.arguments.length)
      out += '(' + node.arguments.map(nodes.Argument).join(', ') + ')';
    return out;
  },
  NamedType(node: NamedTypeNode): string {
    return node.name.value;
  },
  ListType(node: ListTypeNode): string {
    return '[' + _print(node.type) + ']';
  },
  NonNullType(node: NonNullTypeNode): string {
    return _print(node.type) + '!';
  },
} as const;

const _print = (node: ASTNode): string => nodes[node.kind](node);

function print(node: ASTNode): string {
  INDENT = 0;
  return nodes[node.kind] ? nodes[node.kind](node) : '';
}

export { print, printString, printBlockString };
