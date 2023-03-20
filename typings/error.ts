import type * as graphql from 'graphql';
import type * as graphqlWeb from '../src/index';

export function errorInput(input: graphqlWeb.GraphQLError): graphql.GraphQLError {
  return input;
}

export function errorOutput(input: graphql.GraphQLError): graphqlWeb.GraphQLError {
  return input;
}
