---
"@0no-co/graphql.web": minor
---

Add support for fragment arguments, as defined in https://github.com/graphql/graphql-spec/pull/1081. `parse` now accepts `fragment Fields($size: Int! = 64) on Product` and `...Fields(size: $size)`, exposing them as `FragmentDefinitionNode.variableDefinitions` and `FragmentSpreadNode.arguments` (`Kind.FRAGMENT_ARGUMENT` nodes), matching GraphQL 17’s `experimentalFragmentArguments` AST. `print` outputs both.
