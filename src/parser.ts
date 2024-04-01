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
    '(null)|' + // null
    '(true|false)|' + // boolean
    '(\\$)|' + // variable
    '(-?\\d+)|' + // int or float
    '("""(?:"""|(?:[\\s\\S]*?[^\\\\])"""))|' + // block string
    '("(?:"|[^\\r\\n]*?[^\\\\]"))|' + // string
    '(' +
    nameRe.source + // enum
    '))',
  'y'
);

const enum ValueGroup {
  Null = 1,
  Bool = 2,
  Var = 3,
  Int = 4,
  BlockString = 5,
  String = 6,
  Enum = 7,
}

type ValueExec = RegExpExecArray & {
  [Prop in ValueGroup]: string | undefined;
};

const floatPartRe = /(?:\.\d+)?[eE][+-]?\d+|\.\d+/y;
const complexStringRe = /\\/g;

function value(constant: true): ast.ConstValueNode;
function value(constant: boolean): ast.ValueNode;

function value(constant: boolean): ast.ValueNode | undefined {
  let match: string | undefined;
  let exec: ValueExec | null;
  valueRe.lastIndex = idx;
  if (input.charCodeAt(idx) === 91 /*'['*/) {
    idx++;
    ignored();
    return list(constant);
  } else if (input.charCodeAt(idx) === 123 /*'{'*/) {
    idx++;
    ignored();
    return object(constant);
  } else if ((exec = valueRe.exec(input) as ValueExec) != null) {
    idx = valueRe.lastIndex;
    if (exec[ValueGroup.Null] != null) {
      ignored();
      return {
        kind: 'NullValue' as Kind.NULL,
      };
    } else if ((match = exec[ValueGroup.Bool]) != null) {
      ignored();
      return {
        kind: 'BooleanValue' as Kind.BOOLEAN,
        value: match === 'true',
      };
    } else if (exec[ValueGroup.Var] != null) {
      let nameNode: ast.NameNode | undefined;
      if (!constant && (nameNode = name())) {
        ignored();
        return {
          kind: 'Variable' as Kind.VARIABLE,
          name: nameNode,
        };
      } else {
        throw error('Variable');
      }
    } else if ((match = exec[ValueGroup.Int]) != null) {
      let floatPart: string | undefined;
      if ((floatPart = advance(floatPartRe))) {
        ignored();
        return {
          kind: 'FloatValue' as Kind.FLOAT,
          value: match + floatPart,
        };
      } else {
        ignored();
        return {
          kind: 'IntValue' as Kind.INT,
          value: match,
        };
      }
    } else if ((match = exec[ValueGroup.BlockString]) != null) {
      ignored();
      return {
        kind: 'StringValue' as Kind.STRING,
        value: blockString(match.slice(3, -3)),
        block: true,
      };
    } else if ((match = exec[ValueGroup.String]) != null) {
      ignored();
      return {
        kind: 'StringValue' as Kind.STRING,
        value: complexStringRe.test(match) ? (JSON.parse(match) as string) : match.slice(1, -1),
        block: false,
      };
    } else if ((match = exec[ValueGroup.Enum]) != null) {
      ignored();
      return {
        kind: 'EnumValue' as Kind.ENUM,
        value: match,
      };
    }
  }
}

function list(constant: boolean): ast.ListValueNode | undefined {
  let match: ast.ValueNode | undefined;
  const values: ast.ValueNode[] = [];
  while (input.charCodeAt(idx) !== 93 /*']'*/) {
    if ((match = value(constant)) != null) {
      values.push(match);
    } else {
      throw error('ListValue');
    }
  }
  idx++;
  ignored();
  return {
    kind: 'ListValue' as Kind.LIST,
    values,
  };
}

function object(constant: boolean): ast.ObjectValueNode | undefined {
  const fields: ast.ObjectFieldNode[] = [];
  let _name: ast.NameNode | undefined;
  let _value: ast.ValueNode | undefined;
  while (input.charCodeAt(idx) !== 125 /*'}'*/) {
    if ((_name = name()) == null) throw error('ObjectValue');
    ignored();
    if (input.charCodeAt(idx++) !== 58 /*':'*/) throw error('ObjectField');
    ignored();
    if ((_value = value(constant)) == null) throw error('ObjectField');
    fields.push({
      kind: 'ObjectField' as Kind.OBJECT_FIELD,
      name: _name,
      value: _value,
    });
  }
  idx++;
  ignored();
  return {
    kind: 'ObjectValue' as Kind.OBJECT,
    fields,
  };
}

function arguments_(constant: boolean): ast.ArgumentNode[] {
  const args: ast.ArgumentNode[] = [];
  ignored();
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    idx++;
    ignored();
    let _name: ast.NameNode | undefined;
    let _value: ast.ValueNode | undefined;
    while (input.charCodeAt(idx) !== 41 /*')'*/) {
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
    }
    idx++;
    ignored();
    if (!args.length) throw error('Argument');
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

function field(aliasOrName: string): ast.FieldNode | undefined {
  let _alias: ast.NameNode | undefined;
  let _name: ast.NameNode | undefined = {
    kind: 'Name' as Kind.NAME,
    value: aliasOrName,
  };
  if (input.charCodeAt(idx) === 58 /*':'*/) {
    idx++;
    ignored();
    _alias = _name;
    if ((_name = name()) == null) throw error('Field');
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

function fragmentSpread(): ast.FragmentSpreadNode | ast.InlineFragmentNode {
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

function selectionSet(): ast.SelectionSetNode | undefined {
  ignored();
  if (input.charCodeAt(idx) === 123 /*'{'*/) {
    idx++;
    ignored();
    let match: string | undefined;
    let exec: SelectionExec | null;
    let selection: ast.SelectionNode | undefined;
    const selections: ast.SelectionNode[] = [];
    while (input.charCodeAt(idx) !== 125 /*'}'*/) {
      selectionRe.lastIndex = idx;
      if ((exec = selectionRe.exec(input) as SelectionExec) != null) {
        idx = selectionRe.lastIndex;
        if (exec[SelectionGroup.Spread] != null) {
          ignored();
          selections.push(fragmentSpread());
        } else if ((match = exec[SelectionGroup.Name]) != null) {
          ignored();
          if ((selection = field(match)) != null) {
            selections.push(selection);
          } else {
            throw error('SelectionSet');
          }
        }
      } else {
        throw error('SelectionSet');
      }
    }
    idx++;
    ignored();
    if (!selections.length) throw error('SelectionSet');
    return {
      kind: 'SelectionSet' as Kind.SELECTION_SET,
      selections,
    };
  }
}

function variableDefinitions(): ast.VariableDefinitionNode[] {
  const vars: ast.VariableDefinitionNode[] = [];
  ignored();
  if (input.charCodeAt(idx) === 40 /*'('*/) {
    idx++;
    ignored();
    let _name: ast.NameNode | undefined;
    while (input.charCodeAt(idx) === 36 /*'$'*/) {
      idx++;
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

// NOTE(Safari10 Quirk): This *might* need to be wrapped in a group, but worked without it too
const operationDefinitionRe = /(?:query|mutation|subscription)/y;

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
