/**
 * This is a spec-compliant implementation of a GraphQL query language parser,
 * up-to-date with the October 2021 Edition. Unlike the reference implementation
 * in graphql.js it will only parse the query language, but not the schema
 * language.
 */
import { Kind } from './kind';
import { GraphQLError } from './error';
import type * as ast from './ast';

let input: string;
let idx: number;

function error(kind: Kind) {
  return new GraphQLError(`Syntax Error: Unexpected token at ${idx} in ${kind}`);
}

function advance(pattern: RegExp) {
  pattern.lastIndex = idx;
  if (pattern.test(input)) {
    const match = input.slice(idx, idx = pattern.lastIndex);
    return match;
  }
}

const leadingRe = / +(?=[^\s])/y;
export function blockString(string: string) {
  let out = '';
  let commonIndent = 0;
  let firstNonEmptyLine = 0;
  let lastNonEmptyLine = -1;
  const lines = string.split('\n');
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

const ignoredRe = /(?:[\s,]*|#[^\n\r]*)*/y;
function ignored() {
  ignoredRe.lastIndex = idx;
  ignoredRe.test(input);
  idx = ignoredRe.lastIndex;
}

const nameRe = /[_\w][_\d\w]*/y;
function name(): ast.NameNode | undefined {
  let match: string | undefined;
  if (match = advance(nameRe)) {
    return {
      kind: Kind.NAME,
      value: match,
    };
  }
}

const nullRe = /null/y;
const boolRe = /true|false/y;
const variableRe = /\$[_\w][_\d\w]*/y;
const intRe = /[-]?\d+/y;
const floatRe = /(?:[-]?\d+)?(?:\.\d+)(?:[eE][+-]?\d+)?/y;
const complexStringRe = /\\/g;
const blockStringRe = /"""(?:[\s\S]+(?="""))?"""/y;
const stringRe = /"(?:[^"\r\n]+)?"/y;

function value(constant: true): ast.ConstValueNode;
function value(constant: boolean): ast.ValueNode;

function value(constant: boolean): ast.ValueNode | undefined {
  let out: ast.ValueNode | undefined;
  let match: string | undefined;
  if (advance(nullRe)) {
    out = { kind: Kind.NULL };
  } else if (match = advance(boolRe)) {
    out = {
      kind: Kind.BOOLEAN,
      value: match === 'true',
    };
  } else if (!constant && (match = advance(variableRe))) {
    out = {
      kind: Kind.VARIABLE,
      name: {
        kind: Kind.NAME,
        value: match.slice(1),
      },
    };
  } else if (match = advance(floatRe)) {
    out = {
      kind: Kind.FLOAT,
      value: match,
    };
  } else if (match = advance(intRe)) {
    out = {
      kind: Kind.INT,
      value: match,
    };
  } else if (match = advance(nameRe)) {
    out = {
      kind: Kind.ENUM,
      value: match,
    };
  } else if (match = advance(blockStringRe)) {
    out = {
      kind: Kind.STRING,
      value: blockString(match.slice(3, -3)),
      block: true,
    };
  } else if (match = advance(stringRe)) {
    out = {
      kind: Kind.STRING,
      value: complexStringRe.test(match)
        ? JSON.parse(match) as string
        : match.slice(1, -1),
      block: false,
    };
  } else if (out = list(constant) || object(constant)) {
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
    while (match = value(constant))
      values.push(match);
    if (input.charCodeAt(idx++) !== 93 /*']'*/)
      throw error(Kind.LIST);
    ignored();
    return {
      kind: Kind.LIST,
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
    while (_name = name()) {
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/)
        throw error(Kind.OBJECT_FIELD);
      ignored();
      const _value = value(constant);
      if (!_value)
        throw error(Kind.OBJECT_FIELD);
      fields.push({
        kind: Kind.OBJECT_FIELD,
        name: _name,
        value: _value,
      });
    }
    if (input.charCodeAt(idx++) !== 125 /*'}'*/)
      throw error(Kind.OBJECT);
    ignored();
    return {
      kind: Kind.OBJECT,
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
    while (_name = name()) {
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/)
        throw error(Kind.ARGUMENT);
      ignored();
      const _value = value(constant);
      if (!_value)
        throw error(Kind.ARGUMENT);
      args.push({
        kind: Kind.ARGUMENT,
        name: _name,
        value: _value,
      });
    }
    if (!args.length || input.charCodeAt(idx++) !== 41 /*')'*/)
      throw error(Kind.ARGUMENT);
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
    if (!_name)
      throw error(Kind.DIRECTIVE);
    ignored();
    directives.push({
      kind: Kind.DIRECTIVE,
      name: _name,
      arguments: arguments_(constant),
    });
  }
  return directives;
}

function field(): ast.FieldNode | undefined {
  ignored();
  let _name = name();
  if (_name) {
    ignored();
    let _alias: ast.NameNode | undefined;
    if (input.charCodeAt(idx) === 58 /*':'*/) {
      idx++;
      ignored();
      _alias = _name;
      _name = name();
      if (!_name)
        throw error(Kind.FIELD);
      ignored();
    }
    return {
      kind: Kind.FIELD,
      alias: _alias,
      name: _name,
      arguments: arguments_(false),
      directives: directives(false),
      selectionSet: selectionSet(),
    };
  }
}

function type(): ast.TypeNode | undefined {
  let match: ast.NameNode | ast.TypeNode | undefined;
  ignored();
  if (input.charCodeAt(idx) === 91 /*'['*/) {
    idx++;
    ignored();
    const _type = type();
    if (!_type || input.charCodeAt(idx++) !== 93 /*']'*/)
      throw error(Kind.LIST_TYPE);
    match = {
      kind: Kind.LIST_TYPE,
      type: _type,
    };
  } else if (match = name()) {
    match = {
      kind: Kind.NAMED_TYPE,
      name: match,
    };
  } else {
    throw error(Kind.NAMED_TYPE);
  }

  ignored();
  if (input.charCodeAt(idx) === 33 /*'!'*/) {
    idx++;
    ignored();
    return {
      kind: Kind.NON_NULL_TYPE,
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
    if (!_name)
      throw error(Kind.NAMED_TYPE);
    ignored();
    return {
      kind: Kind.NAMED_TYPE,
      name: _name,
    };
  }
}

const fragmentSpreadRe = /\.\.\./y;

function fragmentSpread(): ast.FragmentSpreadNode | ast.InlineFragmentNode | undefined {
  ignored();
  if (advance(fragmentSpreadRe)) {
    ignored();
    const _idx = idx;
    let _name: ast.NameNode | undefined;
    if ((_name = name()) && _name.value !== 'on') {
      return {
        kind: Kind.FRAGMENT_SPREAD,
        name: _name,
        directives: directives(false),
      };
    } else {
      idx = _idx;
      const _typeCondition = typeCondition();
      const _directives = directives(false);
      const _selectionSet = selectionSet();
      if (!_selectionSet)
        throw error(Kind.INLINE_FRAGMENT);
      return {
        kind: Kind.INLINE_FRAGMENT,
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
    while (match = fragmentSpread() || field())
      selections.push(match);
    if (!selections.length || input.charCodeAt(idx++) !== 125 /*'}'*/)
      throw error(Kind.SELECTION_SET);
    ignored();
    return {
      kind: Kind.SELECTION_SET,
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
    while (match = advance(variableRe)) {
      ignored();
      if (input.charCodeAt(idx++) !== 58 /*':'*/)
        throw error(Kind.VARIABLE_DEFINITION);
      const _type = type();
      if (!_type)
        throw error(Kind.VARIABLE_DEFINITION);
      let _defaultValue: ast.ValueNode | undefined;
      if (input.charCodeAt(idx) === 61 /*'='*/) {
        idx++;
        ignored();
        _defaultValue = value(true);
        if (!_defaultValue)
          throw error(Kind.VARIABLE_DEFINITION);
      }
      ignored();
      vars.push({
        kind: Kind.VARIABLE_DEFINITION,
        variable: {
          kind: Kind.VARIABLE,
          name: {
            kind: Kind.NAME,
            value: match.slice(1),
          },
        },
        type: _type,
        defaultValue: _defaultValue as ast.ConstValueNode,
        directives: directives(true),
      });
    }
    if (input.charCodeAt(idx++) !== 41 /*')'*/)
      throw error(Kind.VARIABLE_DEFINITION);
    ignored();
  }
  return vars;
}

const fragmentDefinitionRe = /fragment/y;
function fragmentDefinition(): ast.FragmentDefinitionNode | undefined {
  if (advance(fragmentDefinitionRe)) {
    ignored();
    const _name = name();
    if (!_name)
      throw error(Kind.FRAGMENT_DEFINITION);
    ignored();
    const _typeCondition = typeCondition();
    if (!_typeCondition)
      throw error(Kind.FRAGMENT_DEFINITION);
    const _directives = directives(false);
    const _selectionSet = selectionSet();
    if (!_selectionSet)
      throw error(Kind.FRAGMENT_DEFINITION);
    return {
      kind: Kind.FRAGMENT_DEFINITION,
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
  if (_operation = advance(operationDefinitionRe)) {
    ignored();
    _name = name();
    _variableDefinitions = variableDefinitions();
    _directives = directives(false);
  }
  const _selectionSet = selectionSet();
  if (_selectionSet) {
    return {
      kind: Kind.OPERATION_DEFINITION,
      operation: (_operation || 'query') as ast.OperationTypeNode,
      name: _name,
      variableDefinitions: _variableDefinitions,
      directives: _directives,
      selectionSet: _selectionSet,
    };
  }
}

function document(): ast.DocumentNode {
  let match: ast.DefinitionNode | void;
  ignored();
  const definitions: ast.DefinitionNode[] = [];
  while (match = fragmentDefinition() || operationDefinition())
    definitions.push(match);
  if (idx !== input.length)
    throw error(Kind.DOCUMENT);
  return {
    kind: Kind.DOCUMENT,
    definitions,
  };
}

export function parse(string: string): ast.DocumentNode {
  input = string;
  idx = 0;
  return document();
}

export function parseValue(string: string): ast.ValueNode | undefined {
  input = string;
  idx = 0;
  ignored();
  return value(false);
}

export function parseType(string: string): ast.TypeNode | undefined {
  input = string;
  idx = 0;
  return type();
}
