import { Kind } from './kind';
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
    case Kind.OPERATION_DEFINITION:
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

    case Kind.VARIABLE_DEFINITION:
      out = print(node.variable) +
        ': ' +
        print(node.type);
      if (node.defaultValue)
        out += ' = ' + print(node.defaultValue);
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out;

    case Kind.FIELD:
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

    case Kind.STRING:
      return node.block
        ? printBlockString(node.value)
        : printString(node.value);

    case Kind.BOOLEAN:
      return '' + node.value;

    case Kind.NULL:
      return 'null';

    case Kind.INT:
    case Kind.FLOAT:
    case Kind.ENUM:
    case Kind.NAME:
      return node.value;

    case Kind.LIST:
      return '[' + node.values.map(print).join(', ') + ']';

    case Kind.OBJECT:
      return '{' + node.fields.map(print).join(', ') + '}';

    case Kind.OBJECT_FIELD:
      return node.name.value + ': ' + print(node.value);

    case Kind.VARIABLE:
      return '$' + node.name.value;

    case Kind.DOCUMENT:
      return hasItems(node.definitions)
        ? node.definitions.map(print).join('\n\n')
        : '';

    case Kind.SELECTION_SET:
      return '{\n  ' +
        node.selections.map(print).join('\n').replace(/\n/g, '\n  ') +
        '\n}';

    case Kind.ARGUMENT:
      return node.name.value + ': ' + print(node.value);

    case Kind.FRAGMENT_SPREAD:
      out = '...' + node.name.value;
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out;

    case Kind.INLINE_FRAGMENT:
      out = '...';
      if (node.typeCondition)
        out += ' on ' + node.typeCondition.name.value;
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out + ' ' + print(node.selectionSet);

    case Kind.FRAGMENT_DEFINITION:
      out = 'fragment ' + node.name.value;
      out += ' on ' + node.typeCondition.name.value;
      if (hasItems(node.directives))
        out += ' ' + node.directives.map(print).join(' ');
      return out + ' ' + print(node.selectionSet);
      
    case Kind.DIRECTIVE:
      out = '@' + node.name.value;
      if (hasItems(node.arguments))
        out += '(' + node.arguments.map(print).join(', ') + ')';
      return out;

    case Kind.NAMED_TYPE:
      return node.name.value;

    case Kind.LIST_TYPE:
      return '[' + print(node.type) + ']';

    case Kind.NON_NULL_TYPE:
      return print(node.type) + '!';
  }
}
