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
function ignored(): number {
  let char: number;
  for (
    char = input.charCodeAt(idx++) | 0;
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
  return char;
}

function name(): string {
  ignored();
  const start = idx;
  for (
    let char = input.charCodeAt(idx) | 0;
    (char >= 48 /*'0'*/ && char <= 57) /*'9'*/ ||
    (char >= 65 /*'A'*/ && char <= 90) /*'Z'*/ ||
    char === 95 /*'_'*/ ||
    (char >= 97 /*'a'*/ && char <= 122) /*'z'*/;
    char = input.charCodeAt(++idx) | 0
  );
  if (start === idx) throw error('Name');
  return input.slice(start, idx);
}

function nameNode(): ast.NameNode {
  return {
    kind: 'Name' as Kind.NAME,
    value: name(),
  };
}

const restBlockStringRe = /(?:"""|(?:[\s\S]*?[^\\])""")/y;
const floatPartRe = /(?:(?:\.\d+)?[eE][+-]?\d+|\.\d+)/y;

function value(constant: true): ast.ConstValueNode;
function value(constant: boolean): ast.ValueNode;

function value(constant: boolean): ast.ValueNode {
  let match: string | undefined;
  switch (ignored()) {
    case 91: // '['
      idx++;
      const values: ast.ValueNode[] = [];
      while (ignored() !== 93 /*']'*/) values.push(value(constant));
      idx++;
      return {
        kind: 'ListValue' as Kind.LIST,
        values,
      };

    case 123: // '{'
      idx++;
      const fields: ast.ObjectFieldNode[] = [];
      while (ignored() !== 125 /*'}'*/) {
        const name = nameNode();
        if (ignored() !== 58 /*':'*/) throw error('ObjectField');
        idx++;
        fields.push({
          kind: 'ObjectField' as Kind.OBJECT_FIELD,
          name,
          value: value(constant),
        });
      }
      idx++;
      return {
        kind: 'ObjectValue' as Kind.OBJECT,
        fields,
      };

    case 36: // '$'
      if (constant) throw error('Variable');
      idx++;
      return {
        kind: 'Variable' as Kind.VARIABLE,
        name: nameNode(),
      };

    case 34: // '"'
      if (input.charCodeAt(idx + 1) === 34 && input.charCodeAt(idx + 2) === 34) {
        idx += 3;
        if ((match = advance(restBlockStringRe)) == null) throw error('StringValue');
        return {
          kind: 'StringValue' as Kind.STRING,
          value: blockString(match.slice(0, -3)),
          block: true,
        };
      } else {
        const start = idx++;
        let char: number;
        let isComplex = false;
        for (
          char = input.charCodeAt(idx++) | 0;
          (char === 92 /*'\\'*/ && (idx++, (isComplex = true))) ||
          (char !== 10 /*'\n'*/ && char !== 13 /*'\r'*/ && char !== 34 /*'"'*/ && char);
          char = input.charCodeAt(idx++) | 0
        );
        if (char !== 34) throw error('StringValue');
        match = input.slice(start, idx);
        return {
          kind: 'StringValue' as Kind.STRING,
          value: isComplex
            ? (JSON.parse(input.slice(start, idx)) as string)
            : input.slice(start + 1, idx - 1),
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
      if (
        (char = input.charCodeAt(idx)) === 46 /*'.'*/ ||
        char === 69 /*'E'*/ ||
        char === 101 /*'e'*/
      ) {
        if ((match = advance(floatPartRe)) == null) throw error('FloatValue');
        return {
          kind: 'FloatValue' as Kind.FLOAT,
          value: intPart + match,
        };
      } else {
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
        return { kind: 'NullValue' as Kind.NULL };
      } else {
        break;
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
      } else {
        break;
      }

    case 102: // 'f'
      if (
        input.charCodeAt(idx + 1) === 97 &&
        input.charCodeAt(idx + 2) === 108 &&
        input.charCodeAt(idx + 3) === 115 &&
        input.charCodeAt(idx + 4) === 101
      ) {
        idx += 5;
        return { kind: 'BooleanValue' as Kind.BOOLEAN, value: false };
      } else {
        break;
      }
  }

  return {
    kind: 'EnumValue' as Kind.ENUM,
    value: name(),
  };
}

function arguments_(constant: boolean): ast.ArgumentNode[] | undefined {
  if (ignored() === 40 /*'('*/) {
    const args: ast.ArgumentNode[] = [];
    idx++;
    do {
      const name = nameNode();
      if (ignored() !== 58 /*':'*/) throw error('Argument');
      idx++;
      args.push({
        kind: 'Argument' as Kind.ARGUMENT,
        name,
        value: value(constant),
      });
    } while (ignored() !== 41 /*')'*/);
    idx++;
    return args;
  }
}

function directives(constant: true): ast.ConstDirectiveNode[] | undefined;
function directives(constant: boolean): ast.DirectiveNode[] | undefined;

function directives(constant: boolean): ast.DirectiveNode[] | undefined {
  if (ignored() === 64 /*'@'*/) {
    const directives: ast.DirectiveNode[] = [];
    do {
      idx++;
      directives.push({
        kind: 'Directive' as Kind.DIRECTIVE,
        name: nameNode(),
        arguments: arguments_(constant),
      });
    } while (ignored() === 64 /*'@'*/);
    return directives;
  }
}

function type(): ast.TypeNode {
  let lists = 0;
  while (ignored() === 91 /*'['*/) {
    idx++;
    lists++;
  }
  let type: ast.TypeNode = {
    kind: 'NamedType' as Kind.NAMED_TYPE,
    name: nameNode(),
  };
  do {
    if (ignored() === 33 /*'!'*/) {
      idx++;
      type = {
        kind: 'NonNullType' as Kind.NON_NULL_TYPE,
        type: type as ast.NamedTypeNode | ast.ListTypeNode,
      } satisfies ast.NonNullTypeNode;
    }
    if (lists) {
      if (ignored() !== 93 /*']'*/) throw error('NamedType');
      idx++;
      type = {
        kind: 'ListType' as Kind.LIST_TYPE,
        type: type as ast.NamedTypeNode | ast.ListTypeNode,
      } satisfies ast.ListTypeNode;
    }
  } while (lists--);
  return type;
}

function selectionSetStart(): ast.SelectionSetNode {
  if (ignored() !== 123 /*'{'*/) throw error('SelectionSet');
  idx++;
  return selectionSet();
}

function selectionSet(): ast.SelectionSetNode {
  const selections: ast.SelectionNode[] = [];
  do {
    if (ignored() === 46 /*'.'*/) {
      if (input.charCodeAt(++idx) !== 46 /*'.'*/ || input.charCodeAt(++idx) !== 46 /*'.'*/)
        throw error('SelectionSet');
      idx++;
      switch (ignored()) {
        case 64 /*'@'*/:
          selections.push({
            kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
            typeCondition: undefined,
            directives: directives(false),
            selectionSet: selectionSetStart(),
          });
          break;

        case 111 /*'o'*/:
          if (input.charCodeAt(idx + 1) === 110 /*'n'*/) {
            idx += 2;
            selections.push({
              kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
              typeCondition: {
                kind: 'NamedType' as Kind.NAMED_TYPE,
                name: nameNode(),
              },
              directives: directives(false),
              selectionSet: selectionSetStart(),
            });
          } else {
            selections.push({
              kind: 'FragmentSpread' as Kind.FRAGMENT_SPREAD,
              name: nameNode(),
              directives: directives(false),
            });
          }
          break;

        case 123 /*'{'*/:
          idx++;
          selections.push({
            kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
            typeCondition: undefined,
            directives: undefined,
            selectionSet: selectionSet(),
          });
          break;

        default:
          selections.push({
            kind: 'FragmentSpread' as Kind.FRAGMENT_SPREAD,
            name: nameNode(),
            directives: directives(false),
          });
      }
    } else {
      let name = nameNode();
      let alias: ast.NameNode | undefined;
      if (ignored() === 58 /*':'*/) {
        idx++;
        alias = name;
        name = nameNode();
      }
      const _arguments = arguments_(false);
      const _directives = directives(false);
      let _selectionSet: ast.SelectionSetNode | undefined;
      if (ignored() === 123 /*'{'*/) {
        idx++;
        _selectionSet = selectionSet();
      }
      selections.push({
        kind: 'Field' as Kind.FIELD,
        alias,
        name,
        arguments: _arguments,
        directives: _directives,
        selectionSet: _selectionSet,
      });
    }
  } while (ignored() !== 125 /*'}'*/);
  idx++;
  return {
    kind: 'SelectionSet' as Kind.SELECTION_SET,
    selections,
  };
}

function variableDefinitions(): ast.VariableDefinitionNode[] | undefined {
  if (ignored() === 40 /*'('*/) {
    const vars: ast.VariableDefinitionNode[] = [];
    idx++;
    do {
      if (ignored() !== 36 /*'$'*/) throw error('Variable');
      idx++;
      const name = nameNode();
      if (ignored() !== 58 /*':'*/) throw error('VariableDefinition');
      idx++;
      const _type = type();
      let _defaultValue: ast.ConstValueNode | undefined;
      if (ignored() === 61 /*'='*/) {
        idx++;
        _defaultValue = value(true);
      }
      vars.push({
        kind: 'VariableDefinition' as Kind.VARIABLE_DEFINITION,
        variable: {
          kind: 'Variable' as Kind.VARIABLE,
          name,
        },
        type: _type,
        defaultValue: _defaultValue,
        directives: directives(true),
      });
    } while (ignored() !== 41 /*')'*/);
    idx++;
    return vars;
  }
}

function fragmentDefinition(): ast.FragmentDefinitionNode {
  const name = nameNode();
  if (ignored() !== 111 /*'o'*/ || input.charCodeAt(++idx) !== 110 /*'n'*/)
    throw error('FragmentDefinition');
  idx++;
  return {
    kind: 'FragmentDefinition' as Kind.FRAGMENT_DEFINITION,
    name,
    typeCondition: {
      kind: 'NamedType' as Kind.NAMED_TYPE,
      name: nameNode(),
    },
    directives: directives(false),
    selectionSet: selectionSetStart(),
  };
}

function document(input: string, noLoc: boolean): ast.DocumentNode {
  const definitions: ast.ExecutableDefinitionNode[] = [];
  do {
    switch (ignored()) {
      case 123: // '{'
        idx++;
        definitions.push({
          kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
          operation: 'query' as OperationTypeNode.QUERY,
          name: undefined,
          variableDefinitions: undefined,
          directives: undefined,
          selectionSet: selectionSet(),
        });
        break;

      default:
        const definition = name();
        switch (definition) {
          case 'fragment':
            definitions.push(fragmentDefinition());
            break;
          case 'query':
          case 'mutation':
          case 'subscription':
            let char: number;
            let name: ast.NameNode | undefined;
            if ((char = ignored()) !== 40 /*'('*/ && char !== 64 /*'@'*/ && char !== 123 /*'{'*/) {
              name = nameNode();
            }
            definitions.push({
              kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
              operation: definition as OperationTypeNode,
              name,
              variableDefinitions: variableDefinitions(),
              directives: directives(false),
              selectionSet: selectionSetStart(),
            });
            break;
          default:
            throw error('Document');
        }
    }
  } while (ignored() !== 0);

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
  input = string.body ? string.body : string;
  idx = 0;
  return document(input, options && options.noLocation);
}

export function parseValue(
  string: string | Source,
  _options?: ParseOptions | undefined
): ast.ValueNode {
  input = string.body ? string.body : string;
  idx = 0;
  ignored();
  return value(false);
}

export function parseType(
  string: string | Source,
  _options?: ParseOptions | undefined
): ast.TypeNode {
  input = string.body ? string.body : string;
  idx = 0;
  return type();
}
