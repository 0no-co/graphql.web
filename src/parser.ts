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
function name(): ast.NameNode | undefined {
  let match: string | undefined;
  if ((match = advance(nameRe))) {
    return {
      kind: 'Name' as Kind.NAME,
      value: match,
    };
  }
}

const valueRe = new RegExp(
  '(?:' +
    '(null|true|false)|' + // boolean and null
    '\\$(' +
    nameRe.source +
    ')|' + // variable
    '(-?\\d+)((?:\\.\\d+)?[eE][+-]?\\d+|\\.\\d+)?|' + // int part and float part
    '("""(?:"""|(?:[\\s\\S]*?[^\\\\])"""))|' + // block string
    '("(?:"|[^\\r\\n]*?[^\\\\]"))|' + // string
    '(' +
    nameRe.source + // enum
    '))',
  'y'
);

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
  let match: string | ast.NameNode | undefined;
  let exec: ValueExec | null;
  valueRe.lastIndex = idx;
  if (input.charCodeAt(idx) === 91 /*'['*/) {
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
    idx++;
    ignored();
    const fields: ast.ObjectFieldNode[] = [];
    while (input.charCodeAt(idx) !== 125 /*'}'*/) {
      if ((match = name()) == null) throw error('ObjectField');
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('ObjectField');
      ignored();
      fields.push({
        kind: 'ObjectField' as Kind.OBJECT_FIELD,
        name: match,
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
  ignored();
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    const args: ast.ArgumentNode[] = [];
    idx++;
    ignored();
    let _name: ast.NameNode | undefined;
    let _value: ast.ValueNode | undefined;
    do {
      if ((_name = name()) == null) throw error('Argument');
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('Argument');
      ignored();
      if ((_value = value(constant)) == null) throw error('Argument');
      args.push({
        kind: 'Argument' as Kind.ARGUMENT,
        name: _name,
        value: _value,
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
  ignored();
  if (input.charCodeAt(idx) === 64 /*'@'*/) {
    const directives: ast.DirectiveNode[] = [];
    do {
      idx++;
      const _name = name();
      if (!_name) throw error('Directive');
      ignored();
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
  let match: ast.NameNode | ast.TypeNode | undefined;
  ignored();
  if (input.charCodeAt(idx) === 91 /*'['*/) {
    idx++;
    ignored();
    if ((match = type()) == null || input.charCodeAt(idx++) !== 93 /*']'*/) throw error('ListType');
    match = {
      kind: 'ListType' as Kind.LIST_TYPE,
      type: match,
    };
  } else if ((match = name())) {
    match = {
      kind: 'NamedType' as Kind.NAMED_TYPE,
      name: match,
    };
  } else {
    throw error('NamedType');
  }

  ignored();
  if (input.charCodeAt(idx) === 33 /*'!'*/) {
    idx++;
    ignored();
    return {
      kind: 'NonNullType' as Kind.NON_NULL_TYPE,
      type: match,
    };
  } else {
    return match;
  }
}

const selectionRe = new RegExp(
  '(?:' +
    '(\\.\\.\\.)|' + // fragment spread
    '(' +
    nameRe.source + // field
    '))',
  'y'
);

const enum SelectionGroup {
  Spread = 1,
  Name = 2,
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
          ignored();
          selections.push({
            kind: 'FragmentSpread' as Kind.FRAGMENT_SPREAD,
            name: { kind: 'Name' as Kind.NAME, value: match },
            directives: directives(false),
          });
        } else {
          ignored();
          if (match === 'on') {
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
        let _alias: ast.NameNode | undefined;
        let _name: ast.NameNode | undefined = {
          kind: 'Name' as Kind.NAME,
          value: match,
        };
        ignored();
        if (input.charCodeAt(idx) === 58 /*':'*/) {
          idx++;
          ignored();
          _alias = _name;
          if ((_name = name()) == null) throw error('Field');
          ignored();
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
    let _name: ast.NameNode | undefined;
    do {
      if (input.charCodeAt(idx++) !== 36 /*'$'*/) throw error('Variable');
      if ((_name = name()) == null) throw error('Variable');
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('VariableDefinition');
      const _type = type();
      let _defaultValue: ast.ConstValueNode | undefined;
      if (input.charCodeAt(idx) === 61 /*'='*/) {
        idx++;
        ignored();
        if ((_defaultValue = value(true)) == null) throw error('VariableDefinition');
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
  let _name: string | undefined;
  let _condition: string | undefined;
  if ((_name = advance(nameRe)) == null) throw error('FragmentDefinition');
  ignored();
  if (advance(nameRe) !== 'on') throw error('FragmentDefinition');
  ignored();
  if ((_condition = advance(nameRe)) == null) throw error('FragmentDefinition');
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
  let _name: ast.NameNode | undefined;
  let _variableDefinitions: ast.VariableDefinitionNode[] | undefined;
  let _directives: ast.DirectiveNode[] | undefined;
  if (operation) {
    ignored();
    _name = name();
    _variableDefinitions = variableDefinitions();
    _directives = directives(false);
  }
  if (input.charCodeAt(idx) === 123 /*'{'*/) {
    idx++;
    ignored();
    return {
      kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
      operation: operation || ('query' as OperationTypeNode.QUERY),
      name: _name,
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
  while (idx < input.length) {
    if ((match = advance(definitionRe)) === 'fragment') {
      ignored();
      definitions.push(fragmentDefinition());
    } else if ((definition = operationDefinition(match as OperationTypeNode)) != null) {
      definitions.push(definition);
    } else {
      break;
    }
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
  const _value = value(false);
  if (!_value) throw error('ValueNode');
  return _value;
}

export function parseType(
  string: string | Source,
  _options?: ParseOptions | undefined
): ast.TypeNode {
  input = typeof string.body === 'string' ? string.body : string;
  idx = 0;
  return type();
}
