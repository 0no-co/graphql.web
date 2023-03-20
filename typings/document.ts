import type * as graphql from 'graphql';
import type * as graphqlWeb from '../src/index';

export function documentInput(input: graphqlWeb.DocumentNode): graphql.DocumentNode {
  return input;
}

export function documentOutput(input: graphql.DocumentNode): graphqlWeb.DocumentNode {
  return input;
}
