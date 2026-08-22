import { describe, it, expect } from 'vitest';
import * as graphql17 from 'graphql17';

import { parse } from '../parser';
import { print } from '../printer';
import { visit } from '../visitor';
import type {
  FragmentArgumentNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  OperationDefinitionNode,
} from '../ast';
import type { ASTVisitor } from '../visitor';

const spreadOf = (doc: ReturnType<typeof parse>) =>
  (doc.definitions[0] as OperationDefinitionNode).selectionSet
    .selections[0] as FragmentSpreadNode as FragmentSpreadNode;

describe('fragment arguments', () => {
  it('parses fragment argument definitions', () => {
    const doc = parse(
      `fragment Fields($size: Int! = 64, $tag: String) on Product { image(size: $size) }`,
      { noLocation: true }
    );

    const fragment = doc.definitions[0] as FragmentDefinitionNode;
    expect(fragment.variableDefinitions).toHaveLength(2);
    expect(fragment.variableDefinitions![0].variable.name.value).toBe('size');
    expect(fragment.variableDefinitions![0].defaultValue).toEqual({
      kind: 'IntValue',
      value: '64',
    });
    expect(fragment.variableDefinitions![1].variable.name.value).toBe('tag');
    expect(fragment.typeCondition.name.value).toBe('Product');
  });

  it('parses fragments without argument definitions', () => {
    const doc = parse(`fragment Fields on Product { name }`, { noLocation: true });
    const fragment = doc.definitions[0] as FragmentDefinitionNode;
    expect(fragment.variableDefinitions).toBe(undefined);
  });

  it('parses fragment arguments on spreads', () => {
    const doc = parse(`{ ...Fields(size: 64, tag: $tag, meta: { locale: "en" }) }`, {
      noLocation: true,
    });

    expect(spreadOf(doc).arguments).toEqual([
      {
        kind: 'FragmentArgument',
        name: { kind: 'Name', value: 'size' },
        value: { kind: 'IntValue', value: '64' },
      },
      {
        kind: 'FragmentArgument',
        name: { kind: 'Name', value: 'tag' },
        value: { kind: 'Variable', name: { kind: 'Name', value: 'tag' } },
      },
      {
        kind: 'FragmentArgument',
        name: { kind: 'Name', value: 'meta' },
        value: {
          kind: 'ObjectValue',
          fields: [
            {
              kind: 'ObjectField',
              name: { kind: 'Name', value: 'locale' },
              value: { kind: 'StringValue', value: 'en', block: false },
            },
          ],
        },
      },
    ]);
  });

  it('parses fragment arguments before directives', () => {
    const doc = parse(`{ ...Fields(size: 64) @include(if: $visible) }`, { noLocation: true });
    const spread = spreadOf(doc);
    expect(spread.arguments).toHaveLength(1);
    expect(spread.directives).toHaveLength(1);
    expect(spread.directives![0].name.value).toBe('include');
  });

  it('parses fragment arguments on spreads inside type conditions', () => {
    const doc = parse(`{ ... on Product { ...Fields(size: 64) } }`, { noLocation: true });
    expect(print(doc)).toBe('{\n  ... on Product {\n    ...Fields(size: 64)\n  }\n}');
  });

  it('parses spreads without arguments', () => {
    const doc = parse(`{ ...Fields }`, { noLocation: true });
    expect(spreadOf(doc).arguments).toBe(undefined);
  });

  it('rejects fragment arguments without values', () => {
    expect(() => parse(`{ ...Fields(size) }`)).toThrow(
      'Syntax Error: Unexpected token at 17 in FragmentArgument'
    );
  });

  it('prints fragment arguments', () => {
    const source =
      'query Page($size: Int!) {\n' +
      '  product {\n' +
      '    ...Fields(size: $size, tag: "hero")\n' +
      '  }\n' +
      '}\n' +
      '\n' +
      'fragment Fields($size: Int! = 64, $tag: String) on Product {\n' +
      '  image(size: $size)\n' +
      '}';

    expect(print(parse(source, { noLocation: true }))).toBe(source);
  });

  it('visits fragment arguments', () => {
    const doc = parse(`{ ...Fields(size: 64) }`, { noLocation: true });
    const visited: string[] = [];
    // `ASTVisitor` only lists `FragmentArgument` when the installed `graphql` version
    // models fragment arguments, which is GraphQL 17 and later.
    visit(doc, {
      FragmentArgument(node: FragmentArgumentNode) {
        visited.push(node.name.value);
      },
    } as ASTVisitor);
    expect(visited).toEqual(['size']);
  });

  it('matches the graphql@17 AST', () => {
    const source =
      'query Page($size: Int!) {\n' +
      '  product {\n' +
      '    ...Fields(size: $size) @include(if: true)\n' +
      '  }\n' +
      '}\n' +
      '\n' +
      'fragment Fields($size: Int! = 64) on Product {\n' +
      '  image(size: $size)\n' +
      '}';

    const webDocument = parse(source, { noLocation: true });
    const graphqlDocument = graphql17.parse(source, {
      noLocation: true,
      experimentalFragmentArguments: true,
    });

    expect(webDocument).toEqual(graphqlDocument);
    expect(print(webDocument)).toBe(graphql17.print(graphqlDocument));
    expect(
      graphql17.parse(print(webDocument), { noLocation: true, experimentalFragmentArguments: true })
    ).toEqual(graphqlDocument);
  });
});
