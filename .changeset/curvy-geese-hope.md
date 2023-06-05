---
'@0no-co/graphql.web': patch
---

Fix browser quirk occurring in Safari 10–13 causing sticky regular expressions in the parser to match when they shouldn't / match too eagerly.
