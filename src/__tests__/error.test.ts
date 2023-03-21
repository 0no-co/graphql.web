import { describe, it, expect } from 'vitest';

import { Kind } from '../kind';
import { GraphQLError as graphql_GraphQLError } from 'graphql';
import { GraphQLError } from '../error';

describe('GraphQLError', () => {
  it('sorts input arguments into properties', () => {
    const inputs = ['message', [], { body: '' }, [], [], new Error(), {}] as const;

    const error = new GraphQLError(...inputs);
    expect(error).toMatchInlineSnapshot('[GraphQLError: message]');
    expect(error).toEqual(new (graphql_GraphQLError as any)(...inputs));
  });

  it('normalizes incoming nodes to arrays', () => {
    const error = new GraphQLError('message', { kind: Kind.NULL });
    expect(error.nodes).toEqual([{ kind: Kind.NULL }]);
  });

  it('allows toJSON and toString calls', () => {
    const error = new GraphQLError('message');
    expect(error.toString()).toEqual('message');
    expect(error.toJSON()).toEqual({
      name: 'GraphQLError',
      message: 'message',
      extensions: {},
      locations: undefined,
      nodes: undefined,
      originalError: undefined,
      path: undefined,
      positions: undefined,
      source: undefined,
    });
  });

  it('normalizes extensions as expected', () => {
    const inputs = (extensions: any, originalError = new Error()) =>
      ['message', [], { body: '' }, [], [], originalError, extensions] as const;

    expect(new GraphQLError(...inputs(undefined)).extensions).toEqual({});
    expect(new GraphQLError(...inputs({ test: true })).extensions).toEqual({ test: true });

    expect(
      new GraphQLError(...inputs({ test: true }, { extensions: { override: true } } as any))
        .extensions
    ).toEqual({ test: true });

    expect(
      new GraphQLError(...inputs(undefined, { extensions: { override: true } } as any)).extensions
    ).toEqual({ override: true });
  });
});
