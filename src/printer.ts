import { ASTNode } from './ast';

export function printString(string: string) {
  return JSON.stringify(string);
}

export function printBlockString(string: string) {
  return '"""\n' + string.replace(/"""/g, '\\"""') + '\n"""';
}

const hasItems = <T>(
  array: ReadonlyArray<T> | undefined | null
): array is ReadonlyArray<T> => !!(array && array.length);

const MAX_LINE_LENGTH = 80;

export function print(node: ASTNode): string {
  let out: string;
  switch (node.kind) {
    case 'OperationDefinition':
      if (node.operation === 'query' && !node.name && !hasItems(node.variableDefinitions) && !hasItems(node.directives)) {
        return print(node.selectionSet);
      }
      out = node.operation;
      if (node.name)
        out += ' ' + node.name.value;
      if (hasItems(node.variableDefinitions)) {
        if (!node.name) out += ' ';
        out += '(' + node.variableDefinitions.map(print).join(', ') + ')';
      }
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out + ' ' + print(node.selectionSet);

    case 'VariableDefinition':
      out = print(node.variable) +
        ': ' +
        print(node.type);
      if (node.defaultValue)
        out += ' = ' + print(node.defaultValue);
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out;

    case 'Field':
      out = (node.alias ? print(node.alias) + ': ' : '') + node.name.value
      if (hasItems(node.arguments)) {
        const args = node.arguments.map(print);
        const argsLine = out + '(' + args.join(', ') + ')';
        out = argsLine.length > MAX_LINE_LENGTH
          ? out + '(\n  ' + args.join('\n').replace(/\n/g, '\n  ') + '\n)'
          : argsLine;
      }
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return node.selectionSet
        ? out + ' ' + print(node.selectionSet)
        : out;

    case 'StringValue':
      return node.block
        ? printBlockString(node.value)
        : printString(node.value);

    case 'BooleanValue':
      return '' + node.value;

    case 'NullValue':
      return 'null';

    case 'IntValue':
    case 'FloatValue':
    case 'EnumValue':
    case 'Name':
      return node.value;

    case 'ListValue':
      return '[' + node.values.map(print).join(', ') + ']';

    case 'ObjectValue':
      return '{' + node.fields.map(print).join(', ') + '}';

    case 'ObjectField':
      return node.name.value + ': ' + print(node.value);

    case 'Variable':
      return '$' + node.name.value;

    case 'Document':
      return hasItems(node.definitions)
        ? node.definitions.map(print).join('\n\n')
        : '';

    case 'SelectionSet':
      return '{\n  ' +
        node.selections.map(print).join('\n').replace(/\n/g, '\n  ') +
        '\n}';

    case 'Argument':
      return node.name.value + ': ' + print(node.value);

    case 'FragmentSpread':
      out = '...' + node.name.value;
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out;

    case 'InlineFragment':
      out = '...';
      if (node.typeCondition)
        out += ' on ' + node.typeCondition.name.value;
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out + ' ' + print(node.selectionSet);

    case 'FragmentDefinition':
      out = 'fragment ' + node.name.value;
      out += ' on ' + node.typeCondition.name.value;
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out + ' ' + print(node.selectionSet);
      
    case 'Directive':
      out = '@' + node.name.value;
      if (hasItems(node.arguments))
        out += '(' + node.arguments.map(print).join(', ') + ')';
      return out;

    case 'NamedType':
      return node.name.value;

    case 'ListType':
      return '[' + print(node.type) + ']';

    case 'NonNullType':
      return print(node.type) + '!';
    
    default:
      return '';
  }
}
