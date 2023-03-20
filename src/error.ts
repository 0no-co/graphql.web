import { Maybe, Extensions } from './types';
import { ASTNode, Source } from './ast';

export class GraphQLError extends Error {
  readonly locations: undefined;
  readonly path: ReadonlyArray<string | number> | undefined;
  readonly nodes: ReadonlyArray<ASTNode> | undefined;
  readonly source: Source | undefined;
  readonly positions: ReadonlyArray<number> | undefined;
  readonly originalError: Error | undefined;
  readonly extensions: Extensions;

  constructor(
    message: string,
    nodes?: ReadonlyArray<ASTNode> | ASTNode | null,
    source?: Maybe<Source>,
    positions?: Maybe<ReadonlyArray<number>>,
    path?: Maybe<ReadonlyArray<string | number>>,
    originalError?: Maybe<Error>,
    extensions?: Maybe<Extensions>,
  ) {
    super(message);

    this.name = 'GraphQLError';
    this.message = message;

    if (path) this.path = path;
    if (nodes) this.nodes = (Array.isArray(nodes) ? nodes : [nodes]) as ASTNode[];
    if (source) this.source = source;
    if (positions) this.positions = positions;
    if (originalError) this.originalError = originalError;

    let _extensions = extensions;
    if (!_extensions && originalError) {
      const originalExtensions = (originalError as any).extensions;
      if (originalExtensions && typeof originalExtensions === 'object') {
        _extensions = originalExtensions;
      }
    }

    this.extensions = extensions || {};
  }

  toJSON() {
    return { ...this };
  }

  toString() {
    return this.message;
  }
}
