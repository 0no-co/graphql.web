---
'@0no-co/graphql.web': patch
---

Fix string and block string matches eagerly matching past the end boundary of strings and ignoring escaped closing characters. In certain cases, `"""` and `"` boundaries would be skipped if any other string boundary follows in the input document.
