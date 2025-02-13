---
'@0no-co/graphql.web': minor
---

Improve parser performance (up to ~25% higher ops/s) by rewriting part of the parsing that runs in tight loops. Previously, the purer parser combinators w/o regexs wouldn't have been as significant of an improvement, but they now clearly are
