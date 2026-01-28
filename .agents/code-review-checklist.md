# Code Review Checklist

When performing code review, double check all of the items below:

- [ ] Confirm that the changes solve the issues the PR is trying to solve partially or fully.
- [ ] Review the code in terms of the [OWASP top 10 security issues](https://owasp.org/Top10/).
- [ ] Verify that the code follows the [Code style guide](<docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md>).
- [ ] Avoid using `any` at all costs. If there is no way to circumvent using it, document the reason carefully and consider using `@ts-expect-error` instead.
- [ ] There is no code that is repeated within the PR or elsewhere in the repo.
- [ ] All new components, functions and other entities are documented
- [ ] The repo documentation markdown files are updated if the changes touch upon those.
- [ ] If the change adds functions available to the user, tracking events are enabled with new ones defined if needed.
- [ ] Any new Svelte components that have been created follow the [Svelte component guidelines](<docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md>).
- [ ] Errors are handled properly and logged in the code.
- [ ] Troubleshoot any failing checks in the PR.
- [ ] Check that parts of the application that share dependencies with the PR but are not included in it are not unduly affected.
- [ ] The changes pass the [WCAG A and AA requirements for accessibility](https://usability.yale.edu/web-accessibility/articles/wcag2-checklist).
- [ ] The changed parts of the app are fully usable with keyboard navigation and screen-reading.
- [ ] Documentation is added wherever necessary. This includes updating the possibly affected entries in the [Developers’](<docs/src/routes/(content)/developers-guide>) and [Publishers’ Guides](<docs/src/routes/(content)/publishers-guide>).
- [ ] The commit history is clean and linear, and the commits follow the [commit guidelines](<docs/src/routes/(content)/developers-guide/contributing/contribute/+page.md>)
