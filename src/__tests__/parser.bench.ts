import { describe, bench } from 'vitest';

import * as graphql15 from 'graphql15';
import * as graphql16 from 'graphql16';
import * as graphql17 from 'graphql17';

import kitchenSinkDocument from './fixtures/kitchen_sink.graphql?raw';
import { parse } from '../parser';

describe('parse (kitchen sink query)', () => {
  bench('@0no-co/graphql.web', () => {
    parse(kitchenSinkDocument);
  });

  bench('graphql@15', () => {
    graphql15.parse(kitchenSinkDocument);
  });

  bench('graphql@16', () => {
    graphql16.parse(kitchenSinkDocument);
  });

  bench('graphql@17', () => {
    graphql17.parse(kitchenSinkDocument);
  });
});
