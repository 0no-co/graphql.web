---
'@0no-co/graphql.web': patch
---

Fix block string values in `parse` to follow the spec: keep first and last lines that have no indentation, count tabs as indentation, split lines on `\r\n` and `\r`, keep the first line's own indentation, and accept `\"""` followed by more quotes. `print` now keeps leading whitespace of a block string's first line.
