/**
 * This is a spec-compliant implementation of a GraphQL query language parser,
 * up-to-date with the October 2021 Edition. Unlike the reference implementation
 * in graphql.js it will only parse the query language, but not the schema
 * language.
 */
import type { Kind, OperationTypeNode } from './kind';
import { GraphQLError } from './error';
import type { Location, Source } from './types';
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

function name(): ast.NameNode {
  const start = idx;
  for (
    let char = input.charCodeAt(idx++) | 0;
    (char >= 48 /*'0'*/ && char <= 57) /*'9'*/ ||
    (char >= 65 /*'A'*/ && char <= 90) /*'Z'*/ ||
    char === 95 /*'_'*/ ||
    (char >= 97 /*'a'*/ && char <= 122) /*'z'*/;
    char = input.charCodeAt(idx++) | 0
  );
  if (start === idx - 1) throw error('Name');
  const value = input.slice(start, --idx);
  ignored();
  return {
    kind: 'Name' as Kind.NAME,
    value,
  };
}

const restBlockStringRe = /(?:"""|(?:[\s\S]*?[^\\])""")/y;
const floatPartRe = /(?:(?:\.\d+)?[eE][+-]?\d+|\.\d+)/y;

function value(constant: true): ast.ConstValueNode;
function value(constant: boolean): ast.ValueNode;

function value(constant: boolean): ast.ValueNode {
  let match: string | undefined;
  switch (input.charCodeAt(idx)) {
    case 91: // '['
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

    case 123: // '{'
      idx++;
      ignored();
      const fields: ast.ObjectFieldNode[] = [];
      while (input.charCodeAt(idx) !== 125 /*'}'*/) {
        const _name = name();
        if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('ObjectField');
        ignored();
        fields.push({
          kind: 'ObjectField' as Kind.OBJECT_FIELD,
          name: _name,
          value: value(constant),
        });
      }
      idx++;
      ignored();
      return {
        kind: 'ObjectValue' as Kind.OBJECT,
        fields,
      };

    case 36: // '$'
      idx++;
      return {
        kind: 'Variable' as Kind.VARIABLE,
        name: name(),
      };

    case 34: // '"'
      if (input.charCodeAt(idx + 1) === 34 && input.charCodeAt(idx + 2) === 34) {
        idx += 3;
        if ((match = advance(restBlockStringRe)) == null) throw error('StringValue');
        ignored();
        return {
          kind: 'StringValue' as Kind.STRING,
          value: blockString(match.slice(0, -3)),
          block: true,
        };
      } else {
        const start = idx;
        idx++;
        let char: number;
        let isComplex = false;
        for (
          char = input.charCodeAt(idx++) | 0;
          (char === 92 /*'\\'*/ && (idx++, (isComplex = true))) ||
          (char !== 10 /*'\n'*/ && char !== 13 /*'\r'*/ && char !== 34) /*'"'*/;
          char = input.charCodeAt(idx++) | 0
        );
        if (char !== 34) throw error('StringValue');
        match = input.slice(start, idx);
        ignored();
        return {
          kind: 'StringValue' as Kind.STRING,
          value: isComplex ? (JSON.parse(match) as string) : match.slice(1, -1),
          block: false,
        };
      }

    case 45: // '-'
    case 48: // '0'
    case 49: // '1'
    case 50: // '2'
    case 51: // '3'
    case 52: // '4'
    case 53: // '5'
    case 54: // '6'
    case 55: // '7'
    case 56: // '8'
    case 57: // '9'
      const start = idx++;
      let char: number;
      while ((char = input.charCodeAt(idx++) | 0) >= 48 /*'0'*/ && char <= 57 /*'9'*/);
      const intPart = input.slice(start, --idx);
      if (char === 46 /*'.'*/ || char === 69 /*'E'*/ || char === 101 /*'e'*/) {
        if ((match = advance(floatPartRe)) != null) throw error('FloatValue');
        ignored();
        return {
          kind: 'FloatValue' as Kind.FLOAT,
          value: intPart + match,
        };
      } else {
        ignored();
        return {
          kind: 'IntValue' as Kind.INT,
          value: intPart,
        };
      }

    case 110: // 'n'
      if (
        input.charCodeAt(idx + 1) === 117 &&
        input.charCodeAt(idx + 2) === 108 &&
        input.charCodeAt(idx + 3) === 108
      ) {
        idx += 4;
        ignored();
        return { kind: 'NullValue' as Kind.NULL };
      }

    case 116: // 't'
      if (
        input.charCodeAt(idx + 1) === 114 &&
        input.charCodeAt(idx + 2) === 117 &&
        input.charCodeAt(idx + 3) === 101
      ) {
        idx += 4;
        ignored();
        return { kind: 'BooleanValue' as Kind.BOOLEAN, value: true };
      }

    case 102: // 'f'
      if (
        input.charCodeAt(idx + 1) === 97 &&
        input.charCodeAt(idx + 2) === 108 &&
        input.charCodeAt(idx + 3) === 115 &&
        input.charCodeAt(idx + 4) === 101
      ) {
        idx += 5;
        ignored();
        return { kind: 'BooleanValue' as Kind.BOOLEAN, value: false };
      }

    default:
      return {
        kind: 'EnumValue' as Kind.ENUM,
        value: name().value,
      };
  }
}

function arguments_(constant: boolean): ast.ArgumentNode[] | undefined {
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    const args: ast.ArgumentNode[] = [];
    idx++;
    ignored();
    let _name: ast.NameNode;
    do {
      _name = name();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('Argument');
      ignored();
      args.push({
        kind: 'Argument' as Kind.ARGUMENT,
        name: _name,
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
    let _name: ast.NameNode;
    do {
      idx++;
      _name = name();
      directives.push({
        kind: 'Directive' as Kind.DIRECTIVE,
        name: _name,
        arguments: arguments_(constant),
      });
    } while (input.charCodeAt(idx) === 64 /*'@'*/);
    return directives;
  }
}

function type(): ast.TypeNode {
  let lists = 0;
  while (input.charCodeAt(idx) === 91 /*'['*/) {
    lists++;
    idx++;
    ignored();
  }
  let type: ast.TypeNode = {
    kind: 'NamedType' as Kind.NAMED_TYPE,
    name: name(),
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

function selectionSet(): ast.SelectionSetNode {
  const selections: ast.SelectionNode[] = [];
  do {
    if (
      input.charCodeAt(idx) === 46 /*'.'*/ &&
      input.charCodeAt(idx + 1) === 46 /*'.'*/ &&
      input.charCodeAt(idx + 2) === 46 /*'.'*/
    ) {
      idx += 3;
      ignored();
      switch (input.charCodeAt(idx)) {
        case 64 /*'@'*/:
          const _directives = directives(false);
          if (input.charCodeAt(idx) !== 123 /*'{'*/) throw error('InlineFragment');
          selections.push({
            kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
            typeCondition: undefined,
            directives: _directives,
            selectionSet: selectionSet(),
          });
          break;

        case 111 /*'o'*/:
          if (input.charCodeAt(idx + 1) === 110 /*'n'*/) {
            idx += 2;
            ignored();
            const _condition = name();
            const _directives = directives(false);
            if (input.charCodeAt(idx) !== 123 /*'{'*/) throw error('InlineFragment');
            selections.push({
              kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
              typeCondition: {
                kind: 'NAMED_TYPE' as Kind.NAMED_TYPE,
                name: _condition,
              },
              directives: _directives,
              selectionSet: selectionSet(),
            });
          } else {
            selections.push({
              kind: 'FragmentSpread' as Kind.FRAGMENT_SPREAD,
              name: name(),
              directives: directives(false),
            });
          }
          break;

        case 123 /*'{'*/:
          idx++;
          ignored();
          selections.push({
            kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
            typeCondition: undefined,
            directives: undefined,
            selectionSet: selectionSet(),
          });
          break;

        default:
          idx++;
          ignored();
          selections.push({
            kind: 'FragmentSpread' as Kind.FRAGMENT_SPREAD,
            name: name(),
            directives: directives(false),
          });
      }
    } else {
      let _name = name();
      let _alias: ast.NameNode | undefined;
      if (input.charCodeAt(idx) === 58 /*':'*/) {
        idx++;
        ignored();
        _alias = _name;
        _name = name();
      }
      const _arguments = arguments_(false);
      const _directives = directives(false);
      let _selectionSet: ast.SelectionSetNode | undefined;
      if (input.charCodeAt(idx) === 123 /*'{'*/) {
        idx++;
        ignored();
        _selectionSet = selectionSet();
      }
      selections.push({
        kind: 'Field' as Kind.FIELD,
        alias: _alias,
        name: _name,
        arguments: _arguments,
        directives: _directives,
        selectionSet: _selectionSet,
      });
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
    let _name: ast.NameNode;
    do {
      if (input.charCodeAt(idx++) !== 36 /*'$'*/) throw error('Variable');
      _name = name();
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
          name: _name,
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
  const _name = name();
  if (input.charCodeAt(idx++) !== 111 /*'o'*/ || input.charCodeAt(idx++) !== 110 /*'n'*/)
    throw error('FragmentDefinition');
  ignored();
  const _condition = name();
  const _directives = directives(false);
  if (input.charCodeAt(idx++) !== 123 /*'{'*/) throw error('FragmentDefinition');
  ignored();
  return {
    kind: 'FragmentDefinition' as Kind.FRAGMENT_DEFINITION,
    name: _name,
    typeCondition: {
      kind: 'NamedType' as Kind.NAMED_TYPE,
      name: _condition,
    },
    directives: _directives,
    selectionSet: selectionSet(),
  };
}

function operationDefinition(operation: OperationTypeNode): ast.OperationDefinitionNode {
  let char: number;
  let _name: ast.NameNode | undefined;
  if (
    (char = input.charCodeAt(idx)) !== 40 /*'('*/ &&
    char !== 64 /*'@'*/ &&
    char !== 123 /*'{'*/
  ) {
    _name = name();
  }
  const _variableDefinitions = variableDefinitions();
  const _directives = directives(false);
  if (input.charCodeAt(idx++) !== 123 /*'{'*/) throw error('OperationDefinition');
  ignored();
  return {
    kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
    operation,
    name: _name,
    variableDefinitions: _variableDefinitions,
    directives: _directives,
    selectionSet: selectionSet(),
  };
}

function document(input: string, noLoc: boolean): ast.DocumentNode {
  ignored();
  const definitions: ast.ExecutableDefinitionNode[] = [];
  do {
    if (input.charCodeAt(idx) === 123 /*'{'*/) {
      idx++;
      ignored();
      definitions.push({
        kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
        operation: 'query' as OperationTypeNode.QUERY,
        name: undefined,
        variableDefinitions: undefined,
        directives: undefined,
        selectionSet: selectionSet(),
      });
    } else {
      const definition = name().value;
      switch (definition) {
        case 'fragment':
          definitions.push(fragmentDefinition());
          break;
        case 'query':
        case 'mutation':
        case 'subscription':
          definitions.push(operationDefinition(definition as OperationTypeNode));
          break;
        default:
          throw error('Document');
      }
    }
  } while (idx < input.length);

  if (!noLoc) {
    let loc: Location | undefined;
    return {
      kind: 'Document' as Kind.DOCUMENT,
      definitions,
      /* v8 ignore start */
      set loc(_loc: Location) {
        loc = _loc;
      },
      /* v8 ignore stop */
      // @ts-ignore
      get loc() {
        if (!loc) {
          loc = {
            start: 0,
            end: input.length,
            startToken: undefined,
            endToken: undefined,
            source: {
              body: input,
              name: 'graphql.web',
              locationOffset: { line: 1, column: 1 },
            },
          };
        }
        return loc;
      },
    };
  }

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
  options?: ParseOptions | undefined
): ast.DocumentNode {
  input = typeof string.body === 'string' ? string.body : string;
  idx = 0;
  return document(input, options && options.noLocation);
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
