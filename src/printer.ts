import { ASTNode } from './ast';

export function printString(string: string) {
  return JSON.stringify(string);
}

export function printBlockString(string: string) {
  return '"""\n' + string.replace(/"""/g, '\\"""') + '\n"""';
}

const hasItems = <T>(array: ReadonlyArray<T> | undefined | null): array is ReadonlyArray<T> =>
  !!(array && array.length);

const MAX_LINE_LENGTH = 80;

const nodes: {
  [NodeT in ASTNode as NodeT['kind']]?: (node: NodeT) => string;
} = {
  OperationDefinition(node) {
    if (
      node.operation === 'query' &&
      !node.name &&
      !hasItems(node.variableDefinitions) &&
      !hasItems(node.directives)
    ) {
      return nodes.SelectionSet!(node.selectionSet);
    }
    let out: string = node.operation;
    if (node.name) out += ' ' + node.name.value;
    if (hasItems(node.variableDefinitions)) {
      if (!node.name) out += ' ';
      out += '(' + node.variableDefinitions.map(nodes.VariableDefinition!).join(', ') + ')';
    }
    if (hasItems(node.directives)) out += ' ' + node.directives.map(nodes.Directive!).join(' ');
    return out + ' ' + nodes.SelectionSet!(node.selectionSet);
  },
  VariableDefinition(node) {
    let out = nodes.Variable!(node.variable) + ': ' + print(node.type);
    if (node.defaultValue) out += ' = ' + print(node.defaultValue);
    if (hasItems(node.directives)) out += ' ' + node.directives.map(nodes.Directive!).join(' ');
    return out;
  },
  Field(node) {
    let out = (node.alias ? node.alias.value + ': ' : '') + node.name.value;
    if (hasItems(node.arguments)) {
      const args = node.arguments.map(nodes.Argument!);
      const argsLine = out + '(' + args.join(', ') + ')';
      out =
        argsLine.length > MAX_LINE_LENGTH
          ? out + '(\n  ' + args.join('\n').replace(/\n/g, '\n  ') + '\n)'
          : argsLine;
    }
    if (hasItems(node.directives)) out += ' ' + node.directives.map(nodes.Directive!).join(' ');
    return node.selectionSet ? out + ' ' + nodes.SelectionSet!(node.selectionSet) : out;
  },
  StringValue(node) {
    return node.block ? printBlockString(node.value) : printString(node.value);
  },
  BooleanValue(node) {
    return '' + node.value;
  },
  NullValue(_node) {
    return 'null';
  },
  IntValue(node) {
    return node.value;
  },
  FloatValue(node) {
    return node.value;
  },
  EnumValue(node) {
    return node.value;
  },
  Name(node) {
    return node.value;
  },
  Variable(node) {
    return '$' + node.name.value;
  },
  ListValue(node) {
    return '[' + node.values.map(print).join(', ') + ']';
  },
  ObjectValue(node) {
    return '{' + node.fields.map(nodes.ObjectField!).join(', ') + '}';
  },
  ObjectField(node) {
    return node.name.value + ': ' + print(node.value);
  },
  Document(node) {
    return hasItems(node.definitions) ? node.definitions.map(print).join('\n\n') : '';
  },
  SelectionSet(node) {
    return '{\n  ' + node.selections.map(print).join('\n').replace(/\n/g, '\n  ') + '\n}';
  },
  Argument(node) {
    return node.name.value + ': ' + print(node.value);
  },
  FragmentSpread(node) {
    let out = '...' + node.name.value;
    if (hasItems(node.directives))
      out += ' ' + node.directives.map(nodes.Directive!).join(' ');
    return out;
  },
  InlineFragment(node) {
    let out = '...';
    if (node.typeCondition) out += ' on ' + node.typeCondition.name.value;
    if (hasItems(node.directives)) out += ' ' + node.directives.map(nodes.Directive!).join(' ');
    return out + ' ' + print(node.selectionSet);
  },
  FragmentDefinition(node) {
    let out = 'fragment ' + node.name.value;
    out += ' on ' + node.typeCondition.name.value;
    if (hasItems(node.directives)) out += ' ' + node.directives.map(nodes.Directive!).join(' ');
    return out + ' ' + print(node.selectionSet);
  },
  Directive(node) {
    let out = '@' + node.name.value;
    if (hasItems(node.arguments)) out += '(' + node.arguments.map(nodes.Argument!).join(', ') + ')';
    return out;
  },
  NamedType(node) {
    return node.name.value;
  },
  ListType(node) {
    return '[' + print(node.type) + ']';
  },
  NonNullType(node) {
    return print(node.type) + '!';
  },
};

export function print(node: ASTNode): string {
  return nodes[node.kind] ? nodes[node.kind]!(node as any) : '';
}
