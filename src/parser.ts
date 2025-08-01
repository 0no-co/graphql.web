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
    if (char === 35 /*'#'*/)
      while ((char = input.charCodeAt(idx++) | 0) && char !== 10 && char !== 13);
  }
  idx--;
}

function name(): string {
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
  return value;
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
        const name = nameNode();
        if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('ObjectField');
        ignored();
        fields.push({
          kind: 'ObjectField' as Kind.OBJECT_FIELD,
          name,
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
          (char !== 10 /*'\n'*/ && char !== 13 /*'\r'*/ && char !== 34 /*'"'*/ && char);
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
      if (
        (char = input.charCodeAt(idx)) === 46 /*'.'*/ ||
        char === 69 /*'E'*/ ||
        char === 101 /*'e'*/
      ) {
        if ((match = advance(floatPartRe)) == null) throw error('FloatValue');
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
      } else break;

    case 116: // 't'
      if (
        input.charCodeAt(idx + 1) === 114 &&
        input.charCodeAt(idx + 2) === 117 &&
        input.charCodeAt(idx + 3) === 101
      ) {
        idx += 4;
        ignored();
        return { kind: 'BooleanValue' as Kind.BOOLEAN, value: true };
      } else break;

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
      } else break;
  }

  return {
    kind: 'EnumValue' as Kind.ENUM,
    value: name(),
  };
}

function arguments_(constant: boolean): ast.ArgumentNode[] | undefined {
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    const args: ast.ArgumentNode[] = [];
    idx++;
    ignored();
    do {
      const name = nameNode();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('Argument');
      ignored();
      args.push({
        kind: 'Argument' as Kind.ARGUMENT,
        name,
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
    do {
      idx++;
      directives.push({
        kind: 'Directive' as Kind.DIRECTIVE,
        name: nameNode(),
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
    name: nameNode(),
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

function selectionSetStart(): ast.SelectionSetNode {
  if (input.charCodeAt(idx++) !== 123 /*'{'*/) throw error('SelectionSet');
  ignored();
  return selectionSet();
}

function selectionSet(): ast.SelectionSetNode {
  const selections: ast.SelectionNode[] = [];
  do {
    if (input.charCodeAt(idx) === 46 /*'.'*/) {
      if (input.charCodeAt(++idx) !== 46 /*'.'*/ || input.charCodeAt(++idx) !== 46 /*'.'*/)
        throw error('SelectionSet');
      idx++;
      ignored();
      switch (input.charCodeAt(idx)) {
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
            ignored();
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
          ignored();
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
      if (input.charCodeAt(idx) === 58 /*':'*/) {
        idx++;
        ignored();
        alias = name;
        name = nameNode();
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
        alias,
        name,
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
    do {
      let _description: ast.StringValueNode | undefined;
      if (input.charCodeAt(idx) === 34 /*'"'*/) {
        _description = value(true) as ast.StringValueNode;
      }
      if (input.charCodeAt(idx++) !== 36 /*'$'*/) throw error('Variable');
      const name = nameNode();
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
      const varDef: ast.VariableDefinitionNode = {
        kind: 'VariableDefinition' as Kind.VARIABLE_DEFINITION,
        variable: {
          kind: 'Variable' as Kind.VARIABLE,
          name,
        },
        type: _type,
        defaultValue: _defaultValue,
        directives: directives(true),
      };
      if (_description) {
        varDef.description = _description;
      }
      vars.push(varDef);
    } while (input.charCodeAt(idx) !== 41 /*')'*/);
    idx++;
    ignored();
    return vars;
  }
}

function fragmentDefinition(description?: ast.StringValueNode): ast.FragmentDefinitionNode {
  const name = nameNode();
  if (input.charCodeAt(idx++) !== 111 /*'o'*/ || input.charCodeAt(idx++) !== 110 /*'n'*/)
    throw error('FragmentDefinition');
  ignored();
  const fragDef: ast.FragmentDefinitionNode = {
    kind: 'FragmentDefinition' as Kind.FRAGMENT_DEFINITION,
    name,
    typeCondition: {
      kind: 'NamedType' as Kind.NAMED_TYPE,
      name: nameNode(),
    },
    directives: directives(false),
    selectionSet: selectionSetStart(),
  };
  if (description) {
    fragDef.description = description;
  }
  return fragDef;
}

function definitions(): ast.DefinitionNode[] {
  const _definitions: ast.ExecutableDefinitionNode[] = [];
  do {
    let _description: ast.StringValueNode | undefined;
    if (input.charCodeAt(idx) === 34 /*'"'*/) {
      _description = value(true) as ast.StringValueNode;
    }
    if (input.charCodeAt(idx) === 123 /*'{'*/) {
      // Anonymous operations can't have descriptions
      if (_description) throw error('Document');
      idx++;
      ignored();
      _definitions.push({
        kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
        operation: 'query' as OperationTypeNode.QUERY,
        name: undefined,
        variableDefinitions: undefined,
        directives: undefined,
        selectionSet: selectionSet(),
      });
    } else {
      const definition = name();
      switch (definition) {
        case 'fragment':
          _definitions.push(fragmentDefinition(_description));
          break;
        case 'query':
        case 'mutation':
        case 'subscription':
          let char: number;
          let name: ast.NameNode | undefined;
          if (
            (char = input.charCodeAt(idx)) !== 40 /*'('*/ &&
            char !== 64 /*'@'*/ &&
            char !== 123 /*'{'*/
          ) {
            name = nameNode();
          }
          const opDef: ast.OperationDefinitionNode = {
            kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
            operation: definition as OperationTypeNode,
            name,
            variableDefinitions: variableDefinitions(),
            directives: directives(false),
            selectionSet: selectionSetStart(),
          };
          if (_description) {
            opDef.description = _description;
          }
          _definitions.push(opDef);
          break;
        default:
          throw error('Document');
      }
    }
  } while (idx < input.length);
  return _definitions;
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
  ignored();
  if (options && options.noLocation) {
    return {
      kind: 'Document' as Kind.DOCUMENT,
      definitions: definitions(),
    };
  } else {
    return {
      kind: 'Document' as Kind.DOCUMENT,
      definitions: definitions(),
      loc: {
        start: 0,
        end: input.length,
        startToken: undefined,
        endToken: undefined,
        source: {
          body: input,
          name: 'graphql.web',
          locationOffset: { line: 1, column: 1 },
        },
      },
    } as Location;
  }
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
