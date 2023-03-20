import type * as graphql from 'graphql';
import type * as graphqlWeb from '../src/index';

export function parseInput(input: typeof graphqlWeb.parse): typeof graphql.parse {
  return input;
}

export function parseOutput(input: typeof graphql.parse): typeof graphqlWeb.parse {
  return input;
}

export function parseValueInput(input: typeof graphqlWeb.parseValue): typeof graphql.parseValue {
  return input;
}

export function parseValueOutput(input: typeof graphql.parseValue): typeof graphqlWeb.parseValue {
  return input;
}
