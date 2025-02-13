# @0no-co/graphql.web

## 1.1.1

### Patch Changes

- Remove redundant loc setter/getter in favour of value to improve pre-warmup times
  Submitted by [@kitten](https://github.com/kitten) (See [#54](https://github.com/0no-co/graphql.web/pull/54))

## 1.1.0

### Minor Changes

- Improve parser performance (up to ~25% higher ops/s) by rewriting part of the parsing that runs in tight loops. Previously, the purer parser combinators w/o regexs wouldn't have been as significant of an improvement, but they now clearly are
  Submitted by [@kitten](https://github.com/kitten) (See [#52](https://github.com/0no-co/graphql.web/pull/52))

## 1.0.13

### Patch Changes

- ⚠️ Fix compatibility with typescript 5.5 and higher
  Submitted by [@andreisergiu98](https://github.com/andreisergiu98) (See [#49](https://github.com/0no-co/graphql.web/pull/49))

## 1.0.12

### Patch Changes

- ⚠️ Fix printing when a manually created AST node with an empty selection set array is passed to the printer
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#46](https://github.com/0no-co/graphql.web/pull/46))

## 1.0.11

### Patch Changes

- Export Extensions type
  Submitted by [@jaulz](https://github.com/jaulz) (See [#36](https://github.com/0no-co/graphql.web/pull/36))

## 1.0.10

### Patch Changes

- Add `loc` getter to parsed `DocumentNode` fragment outputs to ensure that using fragments created by `gql.tada`'s `graphql()` function with `graphql-tag` doesn't crash. `graphql-tag` does not treat the `DocumentNode.loc` property as optional on interpolations, which leads to intercompatibility issues
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#38](https://github.com/0no-co/graphql.web/pull/38))
- Add missing exports to make apollo-client functional with this library
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#39](https://github.com/0no-co/graphql.web/pull/39))

## 1.0.9

### Patch Changes

- Remove `for-of` syntax from `valueFromTypeNode` and `valueFromASTUntyped` helpers for JSC memory reduction
  Submitted by [@kitten](https://github.com/kitten) (See [#33](https://github.com/0no-co/graphql.web/pull/33))

## 1.0.8

### Patch Changes

- ⚠️ Fix typo causing complex string parsing to fail on subsequent runs
  Submitted by [@kitten](https://github.com/kitten) (See [#31](https://github.com/0no-co/graphql.web/pull/31))

## 1.0.7

### Patch Changes

- ⚠️ Fix `@ts-ignore` on TypeScript peer dependency import in typings not being applied due to a leading `!` character
  Submitted by [@IvanUkhov](https://github.com/IvanUkhov) (See [#27](https://github.com/0no-co/graphql.web/pull/27))

## 1.0.6

### Patch Changes

- ⚠️ Fix aliased field name followed by arguments causing parsing error
  Submitted by [@kitten](https://github.com/kitten) (See [`65c73a0`](https://github.com/0no-co/graphql.web/commit/65c73a0b64a8e5c263683de667942089f143505d))

## 1.0.5

### Patch Changes

- Update build process to align with other `@0no-co` packages. Effectively, this will mean that the JS features range we support will now match `urql`, and in practice, this means that `for-of` is now used in our build output
  Submitted by [@kitten](https://github.com/kitten) (See [#21](https://github.com/0no-co/graphql.web/pull/21))
- Improve parser performance
  Submitted by [@kitten](https://github.com/kitten) (See [#25](https://github.com/0no-co/graphql.web/pull/25))
- Improve printer performance
  Submitted by [@kitten](https://github.com/kitten) (See [#24](https://github.com/0no-co/graphql.web/pull/24))

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
