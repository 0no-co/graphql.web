import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { parse as graphql_parse } from 'graphql';
import { parse, parseType, parseValue } from '../parser';
import { Kind } from '../kind';

describe('parse', () => {
  it('parses the kitchen sink document like graphql.js does', () => {
    const sink = readFileSync(__dirname + '/../../benchmark/kitchen_sink.graphql', {
      encoding: 'utf8',
    });
    const doc = parse(sink);
    expect(doc).toMatchSnapshot();
    expect(doc).toEqual(graphql_parse(sink, { noLocation: true }));
  });

  it('parses basic documents', () => {
    expect(() => parse('{')).toThrow();
    expect(() => parse('{}x  ')).toThrow();
    expect(() => parse('{ field }')).not.toThrow();
    expect(() => parse({ body: '{ field }' })).not.toThrow();
  });

  it('parses variable inline values', () => {
    expect(() => {
      return parse('{ field(complex: { a: { b: [ $var ] } }) }');
    }).not.toThrow();
  });

  it('parses constant default values', () => {
    expect(() => {
      return parse('query Foo($x: Complex = { a: { b: [ "test" ] } }) { field }');
    }).not.toThrow();
    expect(() => {
      return parse('query Foo($x: Complex = { a: { b: [ $var ] } }) { field }');
    }).toThrow();
  });

  it('parses variable definition directives', () => {
    expect(() => {
      return parse('query Foo($x: Boolean = false @bar) { field }');
    }).not.toThrow();
  });

  it('does not accept fragments spread of "on"', () => {
    expect(() => {
      return parse('{ ...on }');
    }).toThrow();
  });

  it('parses multi-byte characters', () => {
    // Note: \u0A0A could be naively interpreted as two line-feed chars.
    const ast = parse(`
      # This comment has a \u0A0A multi-byte character.
      { field(arg: "Has a \u0A0A multi-byte character.") }
    `);

    expect(ast).toHaveProperty(
      'definitions.0.selectionSet.selections.0.arguments.0.value.value',
      'Has a \u0A0A multi-byte character.'
    );
  });

  it('parses anonymous mutation operations', () => {
    expect(() => {
      return parse(`
        mutation {
          mutationField
        }
      `);
    }).not.toThrow();
  });

  it('parses anonymous subscription operations', () => {
    expect(() => {
      return parse(`
        subscription {
          subscriptionField
        }
      `);
    }).not.toThrow();
  });

  it('parses named mutation operations', () => {
    expect(() => {
      return parse(`
        mutation Foo {
          mutationField
        }
      `);
    }).not.toThrow();
  });

  it('parses named subscription operations', () => {
    expect(() => {
      return parse(`
        subscription Foo {
          subscriptionField
        }
      `);
    }).not.toThrow();
  });

  it('parses fragment definitions', () => {
    expect(() => parse('fragment { test }')).toThrow();
    expect(() => parse('fragment name { test }')).toThrow();
    expect(() => parse('fragment name on name')).toThrow();
    expect(() => parse('fragment Name on Type { field }')).not.toThrow();
  });

  it('parses fields', () => {
    expect(() => parse('{ field: }')).toThrow();
    expect(() => parse('{ alias: field() }')).toThrow();

    expect(
      parse('{ alias: field { child } }').definitions[0]
    ).toHaveProperty('selectionSet.selections.0', {
      kind: Kind.FIELD,
      directives: [],
      arguments: [],
      alias: {
        kind: Kind.NAME,
        value: 'alias',
      },
      name: {
        kind: Kind.NAME,
        value: 'field',
      },
      selectionSet: {
        kind: Kind.SELECTION_SET,
        selections: [{
          kind: Kind.FIELD,
          directives: [],
          arguments: [],
          name: {
            kind: Kind.NAME,
            value: 'child',
          },
        }]
      },
    });
  })

  it('parses arguments', () => {
    expect(() => parse('{ field() }')).toThrow();
    expect(() => parse('{ field(name) }')).toThrow();
    expect(() => parse('{ field(name:) }')).toThrow();
    expect(() => parse('{ field(name: null }')).toThrow();

    expect(parse('{ field(name: null) }').definitions[0]).toMatchObject({
      kind: Kind.OPERATION_DEFINITION,
      selectionSet: {
        kind: Kind.SELECTION_SET,
        selections: [
          {
            kind: Kind.FIELD,
            name: {
              kind: Kind.NAME,
              value: 'field',
            },
            arguments: [{
              kind: Kind.ARGUMENT,
              name: {
                kind: Kind.NAME,
                value: 'name',
              },
              value: {
                kind: Kind.NULL,
              },
            }],
          },
        ],
      },
    });
  });

  it('parses directives', () => {
    expect(() => parse('{ field @ }')).toThrow();
    expect(() => parse('{ field @(test: null) }')).toThrow();

    expect(
      parse('{ field @test(name: null) }')
    ).toHaveProperty('definitions.0.selectionSet.selections.0.directives.0', {
      kind: Kind.DIRECTIVE,
      name: {
        kind: Kind.NAME,
        value: 'test',
      },
      arguments: [{
        kind: Kind.ARGUMENT,
        name: {
          kind: Kind.NAME,
          value: 'name',
        },
        value: {
          kind: Kind.NULL,
        },
      }],
    });
  });

  it('parses inline fragments', () => {
    expect(() => parse('{ ... on Test }')).toThrow();
    expect(() => parse('{ ... {} }')).toThrow();
    expect(() => parse('{ ... }')).toThrow();

    expect(
      parse('{ ... on Test { field } }')
    ).toHaveProperty('definitions.0.selectionSet.selections.0', {
      kind: Kind.INLINE_FRAGMENT,
      directives: [],
      typeCondition: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'Test',
        },
      },
      selectionSet: expect.any(Object),
    });

    expect(
      parse('{ ... { field } }')
    ).toHaveProperty('definitions.0.selectionSet.selections.0', {
      kind: Kind.INLINE_FRAGMENT,
      directives: [],
      typeCondition: undefined,
      selectionSet: expect.any(Object),
    });
  });

  it('parses variable definitions', () => {
    expect(() => parse('query ( { test }')).toThrow();
    expect(() => parse('query ($var) { test }')).toThrow();
    expect(() => parse('query ($var:) { test }')).toThrow();
    expect(() => parse('query ($var: Int =) { test }')).toThrow();

    expect(
      parse('query ($var: Int = 1) { test }').definitions[0]
    ).toMatchObject({
      kind: Kind.OPERATION_DEFINITION,
      operation: 'query',
      directives: [],
      selectionSet: expect.any(Object),
      variableDefinitions: [{
        kind: Kind.VARIABLE_DEFINITION,
        type: {
          kind: Kind.NAMED_TYPE,
          name: {
            kind: Kind.NAME,
            value: 'Int',
          },
        },
        variable: {
          kind: Kind.VARIABLE,
          name: {
            kind: Kind.NAME,
            value: 'var',
          },
        },
        defaultValue: {
          kind: Kind.INT,
          value: '1',
        },
      }],
    });
  });

  it('creates ast', () => {
    const result = parse(`
      {
        node(id: 4) {
          id,
          name
        }
      }
    `);

    expect(result).toMatchObject({
      kind: Kind.DOCUMENT,
      definitions: [
        {
          kind: Kind.OPERATION_DEFINITION,
          operation: 'query',
          name: undefined,
          variableDefinitions: [],
          directives: [],
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections: [
              {
                kind: Kind.FIELD,
                alias: undefined,
                name: {
                  kind: Kind.NAME,
                  value: 'node',
                },
                arguments: [
                  {
                    kind: Kind.ARGUMENT,
                    name: {
                      kind: Kind.NAME,
                      value: 'id',
                    },
                    value: {
                      kind: Kind.INT,
                      value: '4',
                    },
                  },
                ],
                directives: [],
                selectionSet: {
                  kind: Kind.SELECTION_SET,
                  selections: [
                    {
                      kind: Kind.FIELD,
                      alias: undefined,
                      name: {
                        kind: Kind.NAME,
                        value: 'id',
                      },
                      arguments: [],
                      directives: [],
                      selectionSet: undefined,
                    },
                    {
                      kind: Kind.FIELD,
                      alias: undefined,
                      name: {
                        kind: Kind.NAME,
                        value: 'name',
                      },
                      arguments: [],
                      directives: [],
                      selectionSet: undefined,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });

  it('creates ast from nameless query without variables', () => {
    const result = parse(`
      query {
        node {
          id
        }
      }
    `);

    expect(result).toMatchObject({
      kind: Kind.DOCUMENT,
      definitions: [
        {
          kind: Kind.OPERATION_DEFINITION,
          operation: 'query',
          name: undefined,
          variableDefinitions: [],
          directives: [],
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections: [
              {
                kind: Kind.FIELD,
                alias: undefined,
                name: {
                  kind: Kind.NAME,
                  value: 'node',
                },
                arguments: [],
                directives: [],
                selectionSet: {
                  kind: Kind.SELECTION_SET,
                  selections: [
                    {
                      kind: Kind.FIELD,
                      alias: undefined,
                      name: {
                        kind: Kind.NAME,
                        value: 'id',
                      },
                      arguments: [],
                      directives: [],
                      selectionSet: undefined,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });

  it('allows parsing without source location information', () => {
    const result = parse('{ id }', { noLocation: true });
    expect('loc' in result).toBe(false);
  });
});

describe('parseValue', () => {
  it('parses basic values', () => {
    expect(() => parseValue('')).toThrow();
    expect(parseValue('null')).toEqual({ kind: Kind.NULL });
    expect(parseValue({ body: 'null' })).toEqual({ kind: Kind.NULL });
  });

  it('parses list values', () => {
    const result = parseValue('[123 "abc"]');
    expect(result).toEqual({
      kind: Kind.LIST,
      values: [
        {
          kind: Kind.INT,
          value: '123',
        },
        {
          kind: Kind.STRING,
          value: 'abc',
          block: false,
        },
      ],
    });
  });

  it('parses integers', () => {
    expect(parseValue('12')).toEqual({
      kind: Kind.INT,
      value: '12',
    });

    expect(parseValue('-12')).toEqual({
      kind: Kind.INT,
      value: '-12',
    });
  });

  it('parses floats', () => {
    expect(parseValue('12e2')).toEqual({
      kind: Kind.FLOAT,
      value: '12e2',
    });

    expect(parseValue('0.2E3')).toEqual({
      kind: Kind.FLOAT,
      value: '0.2E3',
    });

    expect(parseValue('-1.2e+3')).toEqual({
      kind: Kind.FLOAT,
      value: '-1.2e+3',
    });
  });

  it('parses strings', () => {
    expect(parseValue('"test"')).toEqual({
      kind: Kind.STRING,
      value: 'test',
      block: false,
    });

    expect(parseValue('"\\t\\t"')).toEqual({
      kind: Kind.STRING,
      value: '\t\t',
      block: false,
    });
  });

  it('parses objects', () => {
    expect(parseValue('{}')).toEqual({
      kind: Kind.OBJECT,
      fields: [],
    });

    expect(() => parseValue('{name}')).toThrow();
    expect(() => parseValue('{name:}')).toThrow();
    expect(() => parseValue('{name:null')).toThrow();

    expect(parseValue('{name:null}')).toEqual({
      kind: Kind.OBJECT,
      fields: [{
        kind: Kind.OBJECT_FIELD,
        name: {
          kind: Kind.NAME,
          value: 'name'
        },
        value: {
          kind: Kind.NULL,
        },
      }],
    });
  });

  it('parses lists', () => {
    expect(parseValue('[]')).toEqual({
      kind: Kind.LIST,
      values: [],
    });

    expect(() => parseValue('[')).toThrow();
    expect(() => parseValue('[null')).toThrow();

    expect(parseValue('[null]')).toEqual({
      kind: Kind.LIST,
      values: [{
        kind: Kind.NULL,
      }],
    });
  });

  it('parses block strings', () => {
    expect(parseValue('["""long""" "short"]')).toEqual({
      kind: Kind.LIST,
      values: [
        {
          kind: Kind.STRING,
          value: 'long',
          block: true,
        },
        {
          kind: Kind.STRING,
          value: 'short',
          block: false,
        },
      ],
    });

    expect(parseValue('"""\n\n  first\n  second\n"""')).toEqual({
      kind: Kind.STRING,
      value: 'first\nsecond',
      block: true,
    });
  });

  it('allows variables', () => {
    const result = parseValue('{ field: $var }');
    expect(result).toEqual({
      kind: Kind.OBJECT,
      fields: [
        {
          kind: Kind.OBJECT_FIELD,
          name: {
            kind: Kind.NAME,
            value: 'field',
          },
          value: {
            kind: Kind.VARIABLE,
            name: {
              kind: Kind.NAME,
              value: 'var',
            },
          },
        },
      ],
    });
  });

  it('correct message for incomplete variable', () => {
    expect(() => {
      return parseValue('$');
    }).toThrow();
  });

  it('correct message for unexpected token', () => {
    expect(() => {
      return parseValue(':');
    }).toThrow();
  });
});

describe('parseType', () => {
  it('parses basic types', () => {
    expect(() => parseType('')).toThrow();
    expect(() => parseType('Type')).not.toThrow();
    expect(() => parseType({ body: 'Type' })).not.toThrow();
  });

  it('throws on invalid inputs', () => {
    expect(() => parseType('!')).toThrow();
    expect(() => parseType('[String')).toThrow();
    expect(() => parseType('[String!')).toThrow();
  });

  it('parses well known types', () => {
    const result = parseType('String');
    expect(result).toEqual({
      kind: Kind.NAMED_TYPE,
      name: {
        kind: Kind.NAME,
        value: 'String',
      },
    });
  });

  it('parses custom types', () => {
    const result = parseType('MyType');
    expect(result).toEqual({
      kind: Kind.NAMED_TYPE,
      name: {
        kind: Kind.NAME,
        value: 'MyType',
      },
    });
  });

  it('parses list types', () => {
    const result = parseType('[MyType]');
    expect(result).toEqual({
      kind: Kind.LIST_TYPE,
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'MyType',
        },
      },
    });
  });

  it('parses non-null types', () => {
    const result = parseType('MyType!');
    expect(result).toEqual({
      kind: Kind.NON_NULL_TYPE,
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'MyType',
        },
      },
    });
  });

  it('parses nested types', () => {
    const result = parseType('[MyType!]');
    expect(result).toEqual({
      kind: Kind.LIST_TYPE,
      type: {
        kind: Kind.NON_NULL_TYPE,
        type: {
          kind: Kind.NAMED_TYPE,
          name: {
            kind: Kind.NAME,
            value: 'MyType',
          },
        },
      },
    });
  });
})
