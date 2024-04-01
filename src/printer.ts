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

function mapJoin<T>(value: readonly T[], joiner: string, mapper: (value: T) => string): string {
  let out = '';
  for (let index = 0; index < value.length; index++) {
    if (index) out += joiner;
    out += mapper(value[index]);
  }
  return out;
}

function printString(string: string) {
  return JSON.stringify(string);
}

function printBlockString(string: string) {
  return '"""\n' + string.replace(/"""/g, '\\"""') + '\n"""';
}

const MAX_LINE_LENGTH = 80;

let LF = '\n';

const nodes = {
  OperationDefinition(node: OperationDefinitionNode): string {
    let out: string = node.operation;
    if (node.name) out += ' ' + node.name.value;
    if (node.variableDefinitions && node.variableDefinitions.length) {
      if (!node.name) out += ' ';
      out += '(' + mapJoin(node.variableDefinitions, ', ', nodes.VariableDefinition) + ')';
    }
    if (node.directives && node.directives.length)
      out += ' ' + mapJoin(node.directives, ' ', nodes.Directive);
    return out !== 'query'
      ? out + ' ' + nodes.SelectionSet(node.selectionSet)
      : nodes.SelectionSet(node.selectionSet);
  },
  VariableDefinition(node: VariableDefinitionNode): string {
    let out = nodes.Variable!(node.variable) + ': ' + _print(node.type);
    if (node.defaultValue) out += ' = ' + _print(node.defaultValue);
    if (node.directives && node.directives.length)
      out += ' ' + mapJoin(node.directives, ' ', nodes.Directive);
    return out;
  },
  Field(node: FieldNode): string {
    let out = node.alias ? node.alias.value + ': ' + node.name.value : node.name.value;
    if (node.arguments && node.arguments.length) {
      const args = mapJoin(node.arguments, ', ', nodes.Argument);
      if (out.length + args.length + 2 > MAX_LINE_LENGTH) {
        out +=
          '(' +
          (LF += '  ') +
          mapJoin(node.arguments, LF, nodes.Argument) +
          (LF = LF.slice(0, -2)) +
          ')';
      } else {
        out += '(' + args + ')';
      }
    }
    if (node.directives && node.directives.length)
      out += ' ' + mapJoin(node.directives, ' ', nodes.Directive);
    if (node.selectionSet) out += ' ' + nodes.SelectionSet(node.selectionSet);
    return out;
  },
  StringValue(node: StringValueNode): string {
    if (node.block) {
      return printBlockString(node.value).replace(/\n/g, LF);
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
    return '[' + mapJoin(node.values, ', ', _print) + ']';
  },
  ObjectValue(node: ObjectValueNode): string {
    return '{' + mapJoin(node.fields, ', ', nodes.ObjectField) + '}';
  },
  ObjectField(node: ObjectFieldNode): string {
    return node.name.value + ': ' + _print(node.value);
  },
  Document(node: DocumentNode): string {
    if (!node.definitions || !node.definitions.length) return '';
    return mapJoin(node.definitions, '\n\n', _print);
  },
  SelectionSet(node: SelectionSetNode): string {
    return '{' + (LF += '  ') + mapJoin(node.selections, LF, _print) + (LF = LF.slice(0, -2)) + '}';
  },
  Argument(node: ArgumentNode): string {
    return node.name.value + ': ' + _print(node.value);
  },
  FragmentSpread(node: FragmentSpreadNode): string {
    let out = '...' + node.name.value;
    if (node.directives && node.directives.length)
      out += ' ' + mapJoin(node.directives, ' ', nodes.Directive);
    return out;
  },
  InlineFragment(node: InlineFragmentNode): string {
    let out = '...';
    if (node.typeCondition) out += ' on ' + node.typeCondition.name.value;
    if (node.directives && node.directives.length)
      out += ' ' + mapJoin(node.directives, ' ', nodes.Directive);
    out += ' ' + nodes.SelectionSet(node.selectionSet);
    return out;
  },
  FragmentDefinition(node: FragmentDefinitionNode): string {
    let out = 'fragment ' + node.name.value;
    if (node.variableDefinitions && node.variableDefinitions.length)
      out += '(' + mapJoin(node.variableDefinitions, ', ', nodes.VariableDefinition) + ')';
    out += ' on ' + node.typeCondition.name.value;
    if (node.directives && node.directives.length)
      out += ' ' + mapJoin(node.directives, ' ', nodes.Directive);
    return out + ' ' + nodes.SelectionSet(node.selectionSet);
  },
  Directive(node: DirectiveNode): string {
    let out = '@' + node.name.value;
    if (node.arguments && node.arguments.length)
      out += '(' + mapJoin(node.arguments, ', ', nodes.Argument) + ')';
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
  LF = '\n';
  return nodes[node.kind] ? nodes[node.kind](node) : '';
}

export { print, printString, printBlockString };
