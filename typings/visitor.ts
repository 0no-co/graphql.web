import type * as graphql from 'graphql';
import type * as graphqlWeb from '../src/index';

export function visitInput(input: typeof graphqlWeb.visit): typeof graphql.visit {
  return input;
}

export function visitOutput(input: typeof graphql.visit): typeof graphqlWeb.visit {
  return input;
}
