# Pull Request

When you're done with the changes, create a pull request known as a PR.

- Make sure that your commits pass the validation workflows, are able to run the [tests](/developers-guide/development/testing), and build the application.
- Make sure you have followed all the steps in the [PR Review Checklist](/developers-guide/contributing/pull-request/#self-review).
- Fill in the pull requested template. Mark your PR as a draft if you're still working on it.
- Don't forget to [link PR to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) if you are solving one.
- When you're satisfied with the PR, mark it as ready for review, and a team member will review it. The team may ask questions or request changes to your PR. Either using [suggested changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/incorporating-feedback-in-your-pull-request) or pull request comments.
- As you update your PR and apply changes, mark each conversation as [resolved](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#resolving-conversations).
- While the review process is ongoing, do not force push changes to the branch but make the changes in new [fixup](https://dev.to/koffeinfrei/the-git-fixup-workflow-386d) commits. Only when the PR is otherwise approved, squash the commits and `push --force-with-lease`.

### Your PR is ready to be merged!

Once all the changes have been approved, the reviewers may still ask you to clean the git history before merging the changes into the main branch of the project.

### Self-review

You should always review your own PR first before asking someone to review it. Below you can find a checklist of things you should check before submitting your PR.

- [ ] Confirm that the changes solve the issues the PR is trying to solve partially or fully.
- [ ] Review the code in terms of the [OWASP top 10 security issues](https://owasp.org/Top10/).
- [ ] Verify that the code follows the [Code style guide](/developers-guide/contributing/code-style-guide).
- [ ] Avoid using `any` at all costs. If there is no way to circumvent using it, document the reason carefully and consider using `@ts-expect-error` instead.
- [ ] There is no code that is repeated within the PR or elsewhere in the repo.
- [ ] All new components, functions and other entities are documented
- [ ] The repo documentation markdown files are updated if the changes touch upon those.
- [ ] If the change adds functions available to the user, tracking events are enabled with new ones defined if needed.
- [ ] Any new Svelte components that have been created, follow the [Svelte component guidelines](/developers-guide/contributing/code-style-guide/#svelte-components).
- [ ] Errors are handled properly and logged in the code.
- [ ] Run the unit tests successfully.
- [ ] Run the e2e tests successfully.
- [ ] Troubleshoot any failing checks in the PR.
- [ ] Test the change thoroughly on your own device, including parts that may have been affected via shared code.
- [ ] Check that parts of the application that share dependencies with the PR but are not included in it are not unduly affected.
- [ ] Test the changes using the [WAVE extension](https://wave.webaim.org/extension/) for accessibility.
- [ ] The changes pass the [WCAG A and AA requirements for accessibility](https://usability.yale.edu/web-accessibility/articles/wcag2-checklist).
- [ ] Test the changes using keyboard navigation and screen-reading.
- [ ] Documentation is added wherever necessary. This includes updating the possibly affected entries in the Developers’ and Publishers’ Guides.
- [ ] The commit history is clean and linear, and the commits follow the [commit guidelines](/developers-guide/contributing/contribute/#commit-your-update)
