import { describe, bench } from 'vitest';

import * as graphql15 from 'graphql15';
import * as graphql16 from 'graphql16';
import * as graphql17 from 'graphql17';

import kitchenSinkAST from './fixtures/kitchen_sink.json';
import { print } from '../printer';

describe('print (kitchen sink AST)', () => {
  bench('@0no-co/graphql.web', () => {
    print(kitchenSinkAST);
  });

  bench('graphql@15', () => {
    graphql15.print(kitchenSinkAST);
  });

  bench('graphql@16', () => {
    graphql16.print(kitchenSinkAST);
  });

  bench('graphql@17', () => {
    graphql17.print(kitchenSinkAST);
  });
});
