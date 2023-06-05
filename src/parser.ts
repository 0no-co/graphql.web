/**
 * This is a spec-compliant implementation of a GraphQL query language parser,
 * up-to-date with the October 2021 Edition. Unlike the reference implementation
 * in graphql.js it will only parse the query language, but not the schema
 * language.
 */
import { Kind, OperationTypeNode } from './kind';
import { GraphQLError } from './error';
import { Source } from './types';
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

const nameRe = /[_\w][_\d\w]*/y;
function name(): ast.NameNode | undefined {
  let match: string | undefined;
  if ((match = advance(nameRe))) {
    return {
      kind: 'Name' as Kind.NAME,
      value: match,
    };
  }
}

// NOTE(Safari10 Quirk): This needs to be wrapped in a non-capturing group
const constRe = /(?:null|true|false)/y;

const variableRe = /\$[_\w][_\d\w]*/y;
const intRe = /-?\d+/y;
const floatPartRe = /(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const complexStringRe = /\\/g;
const blockStringRe = /"""(?:[\s\S]+(?="""))?"""/y;
const stringRe = /"(?:[^"\r\n]+)?"/y;

function value(constant: true): ast.ConstValueNode;
function value(constant: boolean): ast.ValueNode;

function value(constant: boolean): ast.ValueNode | undefined {
  let out: ast.ValueNode | undefined;
  let match: string | undefined;
  if ((match = advance(constRe))) {
    out =
      match === 'null'
        ? {
            kind: 'NullValue' as Kind.NULL,
          }
        : {
            kind: 'BooleanValue' as Kind.BOOLEAN,
            value: match === 'true',
          };
  } else if (!constant && (match = advance(variableRe))) {
    out = {
      kind: 'Variable' as Kind.VARIABLE,
      name: {
        kind: 'Name' as Kind.NAME,
        value: match.slice(1),
      },
    };
  } else if ((match = advance(intRe))) {
    const intPart = match;
    if ((match = advance(floatPartRe))) {
      out = {
        kind: 'FloatValue' as Kind.FLOAT,
        value: intPart + match,
      };
    } else {
      out = {
        kind: 'IntValue' as Kind.INT,
        value: intPart,
      };
    }
  } else if ((match = advance(nameRe))) {
    out = {
      kind: 'EnumValue' as Kind.ENUM,
      value: match,
    };
  } else if ((match = advance(blockStringRe))) {
    out = {
      kind: 'StringValue' as Kind.STRING,
      value: blockString(match.slice(3, -3)),
      block: true,
    };
  } else if ((match = advance(stringRe))) {
    out = {
      kind: 'StringValue' as Kind.STRING,
      value: complexStringRe.test(match) ? (JSON.parse(match) as string) : match.slice(1, -1),
      block: false,
    };
  } else if ((out = list(constant) || object(constant))) {
    return out;
  }

  ignored();
  return out;
}

function list(constant: boolean): ast.ListValueNode | undefined {
  let match: ast.ValueNode | undefined;
  if (input.charCodeAt(idx) === 91 /*'['*/) {
    idx++;
    ignored();
    const values: ast.ValueNode[] = [];
    while ((match = value(constant))) values.push(match);
    if (input.charCodeAt(idx++) !== 93 /*']'*/) throw error('ListValue');
    ignored();
    return {
      kind: 'ListValue' as Kind.LIST,
      values,
    };
  }
}

function object(constant: boolean): ast.ObjectValueNode | undefined {
  if (input.charCodeAt(idx) === 123 /*'{'*/) {
    idx++;
    ignored();
    const fields: ast.ObjectFieldNode[] = [];
    let _name: ast.NameNode | undefined;
    while ((_name = name())) {
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('ObjectField' as Kind.OBJECT_FIELD);
      ignored();
      const _value = value(constant);
      if (!_value) throw error('ObjectField');
      fields.push({
        kind: 'ObjectField' as Kind.OBJECT_FIELD,
        name: _name,
        value: _value,
      });
    }
    if (input.charCodeAt(idx++) !== 125 /*'}'*/) throw error('ObjectValue');
    ignored();
    return {
      kind: 'ObjectValue' as Kind.OBJECT,
      fields,
    };
  }
}

function arguments_(constant: boolean): ast.ArgumentNode[] {
  const args: ast.ArgumentNode[] = [];
  ignored();
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    idx++;
    ignored();
    let _name: ast.NameNode | undefined;
    while ((_name = name())) {
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('Argument');
      ignored();
      const _value = value(constant);
      if (!_value) throw error('Argument');
      args.push({
        kind: 'Argument' as Kind.ARGUMENT,
        name: _name,
        value: _value,
      });
    }
    if (!args.length || input.charCodeAt(idx++) !== 41 /*')'*/) throw error('Argument');
    ignored();
  }
  return args;
}

function directives(constant: true): ast.ConstDirectiveNode[];
function directives(constant: boolean): ast.DirectiveNode[];

function directives(constant: boolean): ast.DirectiveNode[] {
  const directives: ast.DirectiveNode[] = [];
  ignored();
  while (input.charCodeAt(idx) === 64 /*'@'*/) {
    idx++;
    const _name = name();
    if (!_name) throw error('Directive');
    ignored();
    directives.push({
      kind: 'Directive' as Kind.DIRECTIVE,
      name: _name,
      arguments: arguments_(constant),
    });
  }
  return directives;
}

function field(): ast.FieldNode | undefined {
  let _name = name();
  if (_name) {
    ignored();
    let _alias: ast.NameNode | undefined;
    if (input.charCodeAt(idx) === 58 /*':'*/) {
      idx++;
      ignored();
      _alias = _name;
      _name = name();
      if (!_name) throw error('Field');
      ignored();
    }
    return {
      kind: 'Field' as Kind.FIELD,
      alias: _alias,
      name: _name,
      arguments: arguments_(false),
      directives: directives(false),
      selectionSet: selectionSet(),
    };
  }
}

function type(): ast.TypeNode {
  let match: ast.NameNode | ast.TypeNode | undefined;
  ignored();
  if (input.charCodeAt(idx) === 91 /*'['*/) {
    idx++;
    ignored();
    const _type = type();
    if (!_type || input.charCodeAt(idx++) !== 93 /*']'*/) throw error('ListType');
    match = {
      kind: 'ListType' as Kind.LIST_TYPE,
      type: _type,
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

const typeConditionRe = /on/y;
function typeCondition(): ast.NamedTypeNode | undefined {
  if (advance(typeConditionRe)) {
    ignored();
    const _name = name();
    if (!_name) throw error('NamedType');
    ignored();
    return {
      kind: 'NamedType' as Kind.NAMED_TYPE,
      name: _name,
    };
  }
}

const fragmentSpreadRe = /\.\.\./y;

function fragmentSpread(): ast.FragmentSpreadNode | ast.InlineFragmentNode | undefined {
  if (advance(fragmentSpreadRe)) {
    ignored();
    const _idx = idx;
    let _name: ast.NameNode | undefined;
    if ((_name = name()) && _name.value !== 'on') {
      return {
        kind: 'FragmentSpread' as Kind.FRAGMENT_SPREAD,
        name: _name,
        directives: directives(false),
      };
    } else {
      idx = _idx;
      const _typeCondition = typeCondition();
      const _directives = directives(false);
      const _selectionSet = selectionSet();
      if (!_selectionSet) throw error('InlineFragment');
      return {
        kind: 'InlineFragment' as Kind.INLINE_FRAGMENT,
        typeCondition: _typeCondition,
        directives: _directives,
        selectionSet: _selectionSet,
      };
    }
  }
}

function selectionSet(): ast.SelectionSetNode | undefined {
  let match: ast.SelectionNode | undefined;
  ignored();
  if (input.charCodeAt(idx) === 123 /*'{'*/) {
    idx++;
    ignored();
    const selections: ast.SelectionNode[] = [];
    while ((match = fragmentSpread() || field())) selections.push(match);
    if (!selections.length || input.charCodeAt(idx++) !== 125 /*'}'*/) throw error('SelectionSet');
    ignored();
    return {
      kind: 'SelectionSet' as Kind.SELECTION_SET,
      selections,
    };
  }
}

function variableDefinitions(): ast.VariableDefinitionNode[] {
  let match: string | undefined;
  const vars: ast.VariableDefinitionNode[] = [];
  ignored();
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    idx++;
    ignored();
    while ((match = advance(variableRe))) {
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('VariableDefinition');
      const _type = type();
      let _defaultValue: ast.ValueNode | undefined;
      if (input.charCodeAt(idx) === 61 /*'='*/) {
        idx++;
        ignored();
        _defaultValue = value(true);
        if (!_defaultValue) throw error('VariableDefinition');
      }
      ignored();
      vars.push({
        kind: 'VariableDefinition' as Kind.VARIABLE_DEFINITION,
        variable: {
          kind: 'Variable' as Kind.VARIABLE,
          name: {
            kind: 'Name' as Kind.NAME,
            value: match.slice(1),
          },
        },
        type: _type,
        defaultValue: _defaultValue as ast.ConstValueNode,
        directives: directives(true),
      });
    }
    if (input.charCodeAt(idx++) !== 41 /*')'*/) throw error('VariableDefinition');
    ignored();
  }
  return vars;
}

const fragmentDefinitionRe = /fragment/y;
function fragmentDefinition(): ast.FragmentDefinitionNode | undefined {
  if (advance(fragmentDefinitionRe)) {
    ignored();
    const _name = name();
    if (!_name) throw error('FragmentDefinition');
    ignored();
    const _typeCondition = typeCondition();
    if (!_typeCondition) throw error('FragmentDefinition');
    const _directives = directives(false);
    const _selectionSet = selectionSet();
    if (!_selectionSet) throw error('FragmentDefinition');
    return {
      kind: 'FragmentDefinition' as Kind.FRAGMENT_DEFINITION,
      name: _name,
      typeCondition: _typeCondition,
      directives: _directives,
      selectionSet: _selectionSet,
    };
  }
}

const operationDefinitionRe = /query|mutation|subscription/y;
function operationDefinition(): ast.OperationDefinitionNode | undefined {
  let _operation: string | undefined;
  let _name: ast.NameNode | undefined;
  let _variableDefinitions: ast.VariableDefinitionNode[] = [];
  let _directives: ast.DirectiveNode[] = [];
  if ((_operation = advance(operationDefinitionRe))) {
    ignored();
    _name = name();
    _variableDefinitions = variableDefinitions();
    _directives = directives(false);
  }
  const _selectionSet = selectionSet();
  if (_selectionSet) {
    return {
      kind: 'OperationDefinition' as Kind.OPERATION_DEFINITION,
      operation: (_operation || 'query') as OperationTypeNode,
      name: _name,
      variableDefinitions: _variableDefinitions,
      directives: _directives,
      selectionSet: _selectionSet,
    };
  }
}

function document(): ast.DocumentNode {
  let match: ast.ExecutableDefinitionNode | void;
  ignored();
  const definitions: ast.ExecutableDefinitionNode[] = [];
  while ((match = fragmentDefinition() || operationDefinition())) definitions.push(match);
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
