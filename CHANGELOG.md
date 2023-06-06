# @0no-co/graphql.web

## 1.0.4

### Patch Changes

- ⚠️ Fix empty string matches being too eager, e.g. `"", ""`
  Submitted by [@kitten](https://github.com/kitten) (See [`29cbe5c`](https://github.com/0no-co/graphql.web/commit/29cbe5c8da183747c966aab8f214cfef9a9a5946))

## 1.0.3

### Patch Changes

- ⚠️ Fix string and block string matches eagerly matching past the end boundary of strings and ignoring escaped closing characters. In certain cases, `"""` and `"` boundaries would be skipped if any other string boundary follows in the input document
  Submitted by [@kitten](https://github.com/kitten) (See [#17](https://github.com/0no-co/graphql.web/pull/17))

## 1.0.2

### Patch Changes

- ⚠️ Fix browser quirk occurring in Safari 10–13 causing sticky regular expressions in the parser to match when they shouldn't / match too eagerly
  Submitted by [@kitten](https://github.com/kitten) (See [#15](https://github.com/0no-co/graphql.web/pull/15))

## 1.0.1

### Patch Changes

- Publish with npm provenance
  Submitted by [@kitten](https://github.com/kitten) (See [#12](https://github.com/0no-co/graphql.web/pull/12))

## 1.0.0

### Major Changes

- Release stable `v1.0.0` Release
  Submitted by [@kitten](https://github.com/kitten) (See [`ca082c8`](https://github.com/0no-co/graphql.web/commit/ca082c82bcfbedda0b23f4887bffff2d1423e2e2))

### Minor Changes

- Alias all GraphQL AST types to the `'graphql'` package’s TypeScript AST types, if it’s installed. This will ensure that all AST types are always compatible.
  Submitted by undefined (See https://github.com/0no-co/graphql.web/pull/10)

## 0.1.6

### Patch Changes

- ⚠️ Fix float pattern and int/float decision in value parsing
  Submitted by [@kitten](https://github.com/kitten) (See [#8](https://github.com/0no-co/graphql.web/pull/8))
- Remove redundant code paths from `visit` and parser
  Submitted by [@kitten](https://github.com/kitten) (See [#8](https://github.com/0no-co/graphql.web/pull/8))

## 0.1.5

### Patch Changes

- Move over unit tests from `graphql-web-lite` and fix minor discrepancies to reference implementation
  Submitted by [@kitten](https://github.com/kitten) (See [#6](https://github.com/0no-co/graphql.web/pull/6))
- Optimize performance of `print` and `parse` with minor adjustments
  Submitted by [@kitten](https://github.com/kitten) (See [#5](https://github.com/0no-co/graphql.web/pull/5))

## 0.1.4

### Patch Changes

- Establish type compatibility with `graphql` package
  Submitted by [@kitten](https://github.com/kitten) (See [#3](https://github.com/0no-co/graphql.web/pull/3))
