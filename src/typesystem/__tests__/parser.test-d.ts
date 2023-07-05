import { test, assertType } from 'vitest'

import {
  TakeValue,
  TakeVarDefinition,
  TakeSelectionSetContinue,
} from '../parser';

test('parses variable inline values', () => {
  const actual: TakeValue<'{ a: { b: [ $var ] } }', false> = {} as any;
  assertType<[{
    kind: 'ObjectValue',
    fields: [{
      kind: 'ObjectField',
      name: {
        kind: 'Name',
        value: 'a',
      },
      value: {
        kind: 'ObjectValue',
        fields: [{
          kind: 'ObjectField',
          name: {
            kind: 'Name',
            value: 'b',
          },
          value: {
            kind: 'ListValue',
            values: [{
              kind: 'Variable',
              name: {
                kind: 'Name',
                value: 'var',
              },
            }],
          },
        }],
      },
    }],
  }, '']>(actual);
});

test('parses constant default values', () => {
  const actualPass: TakeVarDefinition<'$x: Complex = "42"'> = {} as any;
  const actualFail: TakeVarDefinition<'$x: Complex = $var'> = {} as any;

  assertType<[{
    kind: 'VariableDefinition',
    variable: {
      kind: 'Variable',
      name: {
        kind: 'Name',
        value: 'x',
      },
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'Complex',
      },
    },
    defaultValue: {
      kind: 'StringValue',
      value: string,
    },
    directives: [],
  }, '']>(actualPass);

  assertType<void>(actualFail);
});

test('parses variable definition directives', () => {
  const actual: TakeVarDefinition<'$x: Boolean = false @bar'> = {} as any;

  assertType<[{
    kind: 'VariableDefinition',
    variable: {
      kind: 'Variable',
      name: {
        kind: 'Name',
        value: 'x',
      },
    },
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'Boolean',
      },
    },
    defaultValue: {
      kind: 'BooleanValue',
      value: boolean,
    },
    directives: [{
      kind: 'Directive',
      name: {
        kind: 'Name',
        value: 'bar',
      },
      arguments: [],
    }],
  }, '']>(actual);
});

test('does not accept fragment spread of "on"', () => {
  const actualPass: TakeSelectionSetContinue<'{ ...On }'> = {} as any;
  const actualFail: TakeSelectionSetContinue<'{ ...on }'> = {} as any;

  assertType<[{
    kind: 'SelectionSet',
    selections: [{
      kind: 'FragmentSpread',
      directives: [],
      name: {
        kind: 'Name',
        value: 'On',
      },
    }],
  }, '']>(actualPass);

  assertType<void>(actualFail);
});
