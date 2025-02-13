# Welcome to the Voting Advice Application docs contributing guide <!-- omit in toc -->

Thank you for investing your time in contributing to our project!

This guide will give you an overview of the contribution workflow, from opening an issue, creating a PR, reviewing, and
merging the PR.

## New contributor guide

To get an overview of the project, read the [README](/README.md).

Also check the other documentation in the [docs](/docs) folder.

## Getting started

### Issues

#### Create a new issue

If you detect a problem with the application or have a new request, search first in the list of issues to see whether or
not a similar issue has already been reported by someone else. If the issue doesn't exist, you can open a new one by
following these steps.

1. Add a descriptive title.
2. Add a descriptive description.
3. Assign the issue to the Voting Advice Application project.
4. [Add labels](how-to-use-labels.md). At least the following types of labels should be added
   - persona: [WHO]
   - task: [INVOLVES]
   - type: [TYPE OF ISSUE] (👁 this is optional, depending on the type of issue)
5. Mark the target scope of the issue with Milestones (whether the feature should be included in the Alpha release, Beta
   release, future bugfix patch, etc.)

#### Search for an issue

Scan through our [existing issues](https://github.com/OpenVAA/voting-advice-application/issues). You can
narrow down the search using `labels` as filters. See [Labels](how-to-use-labels.md) for more information.
If you find an issue to work on, you are welcome to open a PR with a fix.

### Contribute

The first step you must follow to develop new features for this project is to know how to set up your development
environment. See [Development](../development.md) for more information.

If you want to make changes to the project, you must follow the following steps.

1. Clone the repository
2. Create a new branch with a descriptive yet short name. For example, `fix-404-page` or `add-privacy-policy-page`.
3. Once you start adding changes, make sure you split your work into small, meaningful, manageable commits.

### Commit your update

Commit the changes once you are happy with them. Try to keep commits small and to not mix unrelated changes in one commit.

Don't add any editor config files, such as the `.vscode` folder, to your commit. These are not included in the project's `.gitignore` file but you can [add them to a global `.gitignore`](https://blog.martinhujer.cz/dont-put-idea-vscode-directories-to-projects-gitignore/) on your own machine.

The commit message should follow the [conventional commits conventions](https://www.conventionalcommits.org/en/v1.0.0/). Use the `refactor:` prefix for changes that only affect styling.

On top of that, the commit message should follow the following rules:

- Commit messages must have a subject line and may have a body. A blank line must separate the subject line and body.
- If possible, the subject line must not exceed 50 characters
- The subject line must not end in a period
- The body copy must be wrapped at 72 columns
- The body copy must only explain _what_ and _why_, never _how_. The latter belongs in documentation and implementation.

After you're satisfied with your commits, clean up the commit history so that the commits make sense for others. The best way to accomplish this is to use the [fixup workflow](https://dev.to/koffeinfrei/the-git-fixup-workflow-386d) so that the commit history will contain only one commit for some feature instead of multiple ones with cumulative fixes, i.e., your PR’s commit history should finally look like:

- `feat: NewComponent`

Instead of:

- `feat: NewComponent`
- `fix: something in NewComponent`
- `fix: something else in NewComponent`

Once your changes are ready, don't forget to [self-review](self-review.md) to speed up the review
process.

### Workflows

The project uses GitHub Actions to verify each commit passes unit tests, is able to
build the app successfully and adheres to the [coding conventions used by the project](style-guides.md).
If a commit fails the verification, please check your changes from the logs and fix changes before
submitting a review request.

### Pull Request

When you're done with the changes, create a pull request known as a PR.

- Fill in the pull requested template.
- Don't forget to [link PR to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)
  if you are solving one.
- Assign at least two reviewers to your PR.
- Once you submit your PR, a team member will review your proposal. The team may ask questions or request changes to
  your PR. Either using [suggested changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/incorporating-feedback-in-your-pull-request)
  or pull request comments.
- As you update your PR and apply changes, mark each conversation as [resolved](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#resolving-conversations).
- Make sure that your commits pass the validation workflows, are able to run the [tests](/docs/testing.md) and build the application.
- Make sure to check all of the applicable requirements in the [PR template](/.github/PULL_REQUEST_TEMPLATE).

### Your PR is ready to be merged!

Once all the changes have been approved, the reviewers may still ask you to clean the git history before merging the changes into the main branch of the project.
