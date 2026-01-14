# Contribute

If you want to make changes to the project, you must follow the following steps.

1. Clone the repository
2. Create a new branch with a descriptive yet short name. For example, `fix-404-page` or `add-privacy-policy-page`.
3. Once you start adding changes, make sure you split your work into small, meaningful, manageable commits.

### Commit your update

Commit the changes once you are happy with them. Try to keep commits small and to not mix unrelated changes in one commit.

Don't add any editor config files, such as the `.vscode` folder, to your commit. These are not included in the project's `.gitignore` file but you can [add them to a global `.gitignore`](https://blog.martinhujer.cz/dont-put-idea-vscode-directories-to-projects-gitignore/) on your own machine.

The commit message should follow the [conventional commits conventions](https://www.conventionalcommits.org/en/v1.0.0/). Use the `refactor:` prefix for changes that only affect styling.

For commits that affect packages other than the frontend, add the package name (without the `@openvaa/` scope) to the commit prefix in brackets, e.g.:

- `refactor[data]: doo foo`
- `refactor[q-info]: doo bar` (you can use the abbreviations `q-info` and `arg-cond` for `question-info` and `argument-condensation`)

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

Once your changes are ready, make sure you have followed all the steps in the [PR Review Checklist](/developers-guide/contributing/pull-request/#self-review).
