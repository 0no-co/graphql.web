---
'@0no-co/graphql.web': patch
---

Fix `parse` splitting names that start with `null`, `true`, `false` (enum values like `nullsLast`) or `on` (fragment spreads like `...onlineFields`).
