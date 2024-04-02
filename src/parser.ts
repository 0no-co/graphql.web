/**
 * This is a spec-compliant implementation of a GraphQL query language parser,
 * up-to-date with the October 2021 Edition. Unlike the reference implementation
 * in graphql.js it will only parse the query language, but not the schema
 * language.
 */
import type { Kind, OperationTypeNode } from './kind';
import { GraphQLError } from './error';
import type { Source } from './types';
import type * as ast from './ast';

let input: string;
let idx: number;

function error(kind: string) {
  return new GraphQLError(`Syntax Error: Unexpected token at ${idx} in ${kind}`);
}

function advance(pattern: RegExp) {
  pattern.lastIndex = idx;
  if (pattern.test(input)) {
    const match = input.slice(idx, (idx = pattern.lastIndex));
    return match;
  }
}

const leadingRe = / +(?=[^\s])/y;
function blockString(string: string) {
  const lines = string.split('\n');
  let out = '';
  let commonIndent = 0;
  let firstNonEmptyLine = 0;
  let lastNonEmptyLine = lines.length - 1;
  for (let i = 0; i < lines.length; i++) {
    leadingRe.lastIndex = 0;
    if (leadingRe.test(lines[i])) {
      if (i && (!commonIndent || leadingRe.lastIndex < commonIndent))
        commonIndent = leadingRe.lastIndex;
      firstNonEmptyLine = firstNonEmptyLine || i;
      lastNonEmptyLine = i;
    }
  }
  for (let i = firstNonEmptyLine; i <= lastNonEmptyLine; i++) {
    if (i !== firstNonEmptyLine) out += '\n';
    out += lines[i].slice(commonIndent).replace(/\\"""/g, '"""');
  }
  return out;
}

// Note: This is equivalent to: /(?:[\s,]*|#[^\n\r]*)*/y
function ignored() {
  for (
    let char = input.charCodeAt(idx++) | 0;
    char === 9 /*'\t'*/ ||
    char === 10 /*'\n'*/ ||
    char === 13 /*'\r'*/ ||
    char === 32 /*' '*/ ||
    char === 35 /*'#'*/ ||
    char === 44 /*','*/ ||
    char === 65279 /*'\ufeff'*/;
    char = input.charCodeAt(idx++) | 0
  ) {
    if (char === 35 /*'#'*/) while ((char = input.charCodeAt(idx++)) !== 10 && char !== 13);
  }
  idx--;
}

const nameRe = /[_A-Za-z]\w*/y;

// NOTE: This should be compressed by our build step
// This merges all possible value parsing into one regular expression
const valueRe = new RegExp(
  '(?:' +
    // `null`, `true`, and `false` literals (BooleanValue & NullValue)
    '(null|true|false)|' +
    // Variables starting with `$` then having a name (VariableNode)
    '\\$(' +
    nameRe.source +
    ')|' +
    // Numbers, starting with int then optionally following with a float part (IntValue and FloatValue)
    '(-?\\d+)((?:\\.\\d+)?[eE][+-]?\\d+|\\.\\d+)?|' +
    // Block strings starting with `"""` until the next unescaped `"""` (StringValue)
    '("""(?:"""|(?:[\\s\\S]*?[^\\\\])"""))|' +
    // Strings starting with `"` must be on one line (StringValue)
    '("(?:"|[^\\r\\n]*?[^\\\\]"))|' + // string
    // Enums are simply names except for our literals (EnumValue)
    '(' +
    nameRe.source +
    '))',
  'y'
);

// NOTE: Each of the groups above end up in the RegExpExecArray at the specified indices (starting with 1)
const enum ValueGroup {
  Const = 1,
  Var,
  Int,
  Float,
  BlockString,
  String,
  Enum,
}

type ValueExec = RegExpExecArray & {
  [Prop in ValueGroup]: string | undefined;
};

const complexStringRe = /\\/g;

function value(constant: true): ast.ConstValueNode;
function value(constant: boolean): ast.ValueNode;

function value(constant: boolean): ast.ValueNode {
  let match: string | undefined;
  let exec: ValueExec | null;
  valueRe.lastIndex = idx;
  if (input.charCodeAt(idx) === 91 /*'['*/) {
    // Lists are checked ahead of time with `[` chars
    idx++;
    ignored();
    const values: ast.ValueNode[] = [];
    while (input.charCodeAt(idx) !== 93 /*']'*/) values.push(value(constant));
    idx++;
    ignored();
    return {
      kind: 'ListValue' as Kind.LIST,
      values,
    };
  } else if (input.charCodeAt(idx) === 123 /*'{'*/) {
    // Objects are checked ahead of time with `{` chars
    idx++;
    ignored();
    const fields: ast.ObjectFieldNode[] = [];
    while (input.charCodeAt(idx) !== 125 /*'}'*/) {
      if ((match = advance(nameRe)) == null) throw error('ObjectField');
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('ObjectField');
      ignored();
      fields.push({
        kind: 'ObjectField' as Kind.OBJECT_FIELD,
        name: { kind: 'Name' as Kind.NAME, value: match },
        value: value(constant),
      });
    }
    idx++;
    ignored();
    return {
      kind: 'ObjectValue' as Kind.OBJECT,
      fields,
    };
  } else if ((exec = valueRe.exec(input) as ValueExec) != null) {
    // Starting from here, the merged `valueRe` is used
    idx = valueRe.lastIndex;
    ignored();
    if ((match = exec[ValueGroup.Const]) != null) {
      return match === 'null'
        ? { kind: 'NullValue' as Kind.NULL }
        : {
            kind: 'BooleanValue' as Kind.BOOLEAN,
            value: match === 'true',
          };
    } else if ((match = exec[ValueGroup.Var]) != null) {
      if (constant) {
        throw error('Variable');
      } else {
        return {
          kind: 'Variable' as Kind.VARIABLE,
          name: {
            kind: 'Name' as Kind.NAME,
            value: match,
          },
        };
      }
    } else if ((match = exec[ValueGroup.Int]) != null) {
      let floatPart: string | undefined;
      if ((floatPart = exec[ValueGroup.Float]) != null) {
        return {
          kind: 'FloatValue' as Kind.FLOAT,
          value: match + floatPart,
        };
      } else {
        return {
          kind: 'IntValue' as Kind.INT,
          value: match,
        };
      }
    } else if ((match = exec[ValueGroup.BlockString]) != null) {
      return {
        kind: 'StringValue' as Kind.STRING,
        value: blockString(match.slice(3, -3)),
        block: true,
      };
    } else if ((match = exec[ValueGroup.String]) != null) {
      return {
        kind: 'StringValue' as Kind.STRING,
        // When strings don't contain escape codes, a simple slice will be enough, otherwise
        // `JSON.parse` matches GraphQL's string parsing perfectly
        value: complexStringRe.test(match) ? (JSON.parse(match) as string) : match.slice(1, -1),
        block: false,
      };
    } else if ((match = exec[ValueGroup.Enum]) != null) {
      return {
        kind: 'EnumValue' as Kind.ENUM,
        value: match,
      };
    }
  }

  throw error('Value');
}

function arguments_(constant: boolean): ast.ArgumentNode[] | undefined {
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    const args: ast.ArgumentNode[] = [];
    idx++;
    ignored();
    let _name: string | undefined;
    do {
      if ((_name = advance(nameRe)) == null) throw error('Argument');
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('Argument');
      ignored();
      args.push({
        kind: 'Argument' as Kind.ARGUMENT,
        name: { kind: 'Name' as Kind.NAME, value: _name },
        value: value(constant),
      });
    } while (input.charCodeAt(idx) !== 41 /*')'*/);
    idx++;
    ignored();
    return args;
  }
}

function directives(constant: true): ast.ConstDirectiveNode[] | undefined;
function directives(constant: boolean): ast.DirectiveNode[] | undefined;

function directives(constant: boolean): ast.DirectiveNode[] | undefined {
  if (input.charCodeAt(idx) === 64 /*'@'*/) {
    const directives: ast.DirectiveNode[] = [];
    let _name: string | undefined;
    do {
      idx++;
      if ((_name = advance(nameRe)) == null) throw error('Directive');
      ignored();
      directives.push({
        kind: 'Directive' as Kind.DIRECTIVE,
        name: { kind: 'Name' as Kind.NAME, value: _name },
        arguments: arguments_(constant),
      });
    } while (input.charCodeAt(idx) === 64 /*'@'*/);
    return directives;
  }
}

function type(): ast.TypeNode {
  let match: string | undefined;
  let lists = 0;
  while (input.charCodeAt(idx) === 91 /*'['*/) {
    lists++;
    idx++;
    ignored();
  }
  if ((match = advance(nameRe)) == null) throw error('NamedType');
  ignored();
  let type: ast.TypeNode = {
    kind: 'NamedType' as Kind.NAMED_TYPE,
    name: { kind: 'Name' as Kind.NAME, value: match },
  };
  do {
    if (input.charCodeAt(idx) === 33 /*'!'*/) {
      idx++;
      ignored();
      type = {
        kind: 'NonNullType' as Kind.NON_NULL_TYPE,
        type: type as ast.NamedTypeNode | ast.ListTypeNode,
      } satisfies ast.NonNullTypeNode;
    }
    if (lists) {
      if (input.charCodeAt(idx++) !== 93 /*']'*/) throw error('NamedType');
      ignored();
      type = {
        kind: 'ListType' as Kind.LIST_TYPE,
        type: type as ast.NamedTypeNode | ast.ListTypeNode,
      } satisfies ast.ListTypeNode;
    }
  } while (lists--);
  return type;
}

// NOTE: This should be compressed by our build step
// This merges the two possible selection parsing branches into one regular expression
const selectionRe = new RegExp(
  '(?:' +
    // fragment spreads (FragmentSpread or InlineFragment nodes)
    '(\\.{3})|' +
    // field aliases or names (FieldNode)
    '(' +
    nameRe.source +
    '))',
  'y'
);

// NOTE: Each of the groups above end up in the RegExpExecArray at the indices 1&2
const enum SelectionGroup {
  Spread = 1,
  Name,
}

type SelectionExec = RegExpExecArray & {
  [Prop in SelectionGroup]: string | undefined;
};

function selectionSet(): ast.SelectionSetNode {
  const selections: ast.SelectionNode[] = [];
  let match: string | undefined;
  let exec: SelectionExec | null;
  do {
    selectionRe.lastIndex = idx;
    if ((exec = selectionRe.exec(input) as SelectionExec) != null) {
      idx = selectionRe.lastIndex;
      if (exec[SelectionGroup.Spread] != null) {
        ignored();
        let match = advance(nameRe);
        if (match != null && match !== 'on') {
          // A simple `...Name` spread with optional directives
          ignored();
          selections.push({
            kind: 'FragmentSpread' as Kind.FRAGMENT_SPREAD,
            name: { kind: 'Name' as Kind.NAME, value: match },
            directives: directives(false),
          });
        } else {
          ignored();
          if (match === 'on') {
            // An inline `... on Name` spread; if this doesn't match, the type condition has been omitted
            if ((match = advance(nameRe)) == null) throw error('NamedType');
            ignored();
          }
          const _directives = directives(false);
          if (input.charCodeAt(idx++) !== 123 /*'{'*/) throw error('InlineFragment');
          ignored();
          selections.push({
            kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
            typeCondition: match
              ? {
                  kind: 'NamedType' as Kind.NAMED_TYPE,
                  name: { kind: 'Name' as Kind.NAME, value: match },
                }
              : undefined,
            directives: _directives,
            selectionSet: selectionSet(),
          });
        }
      } else if ((match = exec[SelectionGroup.Name]) != null) {
        let _alias: string | undefined;
        ignored();
        // Parse the optional alias, by reassigning and then getting the name
        if (input.charCodeAt(idx) === 58 /*':'*/) {
          idx++;
          ignored();
          _alias = match;
          if ((match = advance(nameRe)) == null) throw error('Field');
          ignored();
        }
        const _arguments = arguments_(false);
        ignored();
        const _directives = directives(false);
        let _selectionSet: ast.SelectionSetNode | undefined;
        if (input.charCodeAt(idx) === 123 /*'{'*/) {
          idx++;
          ignored();
          _selectionSet = selectionSet();
        }
        selections.push({
          kind: 'Field' as Kind.FIELD,
          alias: _alias ? { kind: 'Name' as Kind.NAME, value: _alias } : undefined,
          name: { kind: 'Name' as Kind.NAME, value: match },
          arguments: _arguments,
          directives: _directives,
          selectionSet: _selectionSet,
        });
      }
    } else {
      throw error('SelectionSet');
    }
  } while (input.charCodeAt(idx) !== 125 /*'}'*/);
  idx++;
  ignored();
  return {
    kind: 'SelectionSet' as Kind.SELECTION_SET,
    selections,
  };
}

function variableDefinitions(): ast.VariableDefinitionNode[] | undefined {
  ignored();
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    const vars: ast.VariableDefinitionNode[] = [];
    idx++;
    ignored();
    let _name: string | undefined;
    do {
      if (input.charCodeAt(idx++) !== 36 /*'$'*/) throw error('Variable');
      if ((_name = advance(nameRe)) == null) throw error('Variable');
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('VariableDefinition');
      ignored();
      const _type = type();
      let _defaultValue: ast.ConstValueNode | undefined;
      if (input.charCodeAt(idx) === 61 /*'='*/) {
        idx++;
        ignored();
        _defaultValue = value(true);
      }
      ignored();
      vars.push({
        kind: 'VariableDefinition' as Kind.VARIABLE_DEFINITION,
        variable: {
          kind: 'Variable' as Kind.VARIABLE,
          name: { kind: 'Name' as Kind.NAME, value: _name },
        },
        type: _type,
        defaultValue: _defaultValue,
        directives: directives(true),
      });
    } while (input.charCodeAt(idx) !== 41 /*')'*/);
    idx++;
    ignored();
    return vars;
  }
}

function fragmentDefinition(): ast.FragmentDefinitionNode {
  let _name: string | undefined;
  let _condition: string | undefined;
  if ((_name = advance(nameRe)) == null) throw error('FragmentDefinition');
  ignored();
  if (advance(nameRe) !== 'on') throw error('FragmentDefinition');
  ignored();
  if ((_condition = advance(nameRe)) == null) throw error('FragmentDefinition');
  ignored();
  const _directives = directives(false);
  if (input.charCodeAt(idx++) !== 123 /*'{'*/) throw error('FragmentDefinition');
  ignored();
  return {
    kind: 'FragmentDefinition' as Kind.FRAGMENT_DEFINITION,
    name: { kind: 'Name' as Kind.NAME, value: _name },
    typeCondition: {
      kind: 'NamedType' as Kind.NAMED_TYPE,
      name: { kind: 'Name' as Kind.NAME, value: _condition },
    },
    directives: _directives,
    selectionSet: selectionSet(),
  };
}

const definitionRe = /(?:query|mutation|subscription|fragment)/y;

function operationDefinition(
  operation: OperationTypeNode | undefined
): ast.OperationDefinitionNode | undefined {
  let _name: string | undefined;
  let _variableDefinitions: ast.VariableDefinitionNode[] | undefined;
  let _directives: ast.DirectiveNode[] | undefined;
  if (operation) {
    ignored();
    _name = advance(nameRe);
    _variableDefinitions = variableDefinitions();
    _directives = directives(false);
  }
  if (input.charCodeAt(idx) === 123 /*'{'*/) {
    idx++;
    ignored();
    return {
      kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
      operation: operation || ('query' as OperationTypeNode.QUERY),
      name: _name ? { kind: 'Name' as Kind.NAME, value: _name } : undefined,
      variableDefinitions: _variableDefinitions,
      directives: _directives,
      selectionSet: selectionSet(),
    };
  }
}

function document(): ast.DocumentNode {
  let match: string | undefined;
  let definition: ast.OperationDefinitionNode | undefined;
  ignored();
  const definitions: ast.ExecutableDefinitionNode[] = [];
  do {
    if ((match = advance(definitionRe)) === 'fragment') {
      ignored();
      definitions.push(fragmentDefinition());
    } else if ((definition = operationDefinition(match as OperationTypeNode)) != null) {
      definitions.push(definition);
    } else {
      throw error('Document');
    }
  } while (idx < input.length);
  return {
    kind: 'Document' as Kind.DOCUMENT,
    definitions,
  };
}

type ParseOptions = {
  [option: string]: any;
};

export function parse(
  string: string | Source,
  _options?: ParseOptions | undefined
): ast.DocumentNode {
  input = typeof string.body === 'string' ? string.body : string;
  idx = 0;
  return document();
}

export function parseValue(
  string: string | Source,
  _options?: ParseOptions | undefined
): ast.ValueNode {
  input = typeof string.body === 'string' ? string.body : string;
  idx = 0;
  ignored();
  return value(false);
}

export function parseType(
  string: string | Source,
  _options?: ParseOptions | undefined
): ast.TypeNode {
  input = typeof string.body === 'string' ? string.body : string;
  idx = 0;
  return type();
}
