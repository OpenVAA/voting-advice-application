# AI agents

Instructions for AI coding agents are written for Claude Code, and can be used as a base for other agents' instructions:

- [CLAUDE.md](https://github.com/OpenVAA/voting-advice-application/blob/main/CLAUDE.md) describes the repository, its commands and its rules.
- [`.claude/skills`](https://github.com/OpenVAA/voting-advice-application/tree/main/.claude/skills) holds skills for specific areas, such as the frontend components, the data model, the database, filters and matching.
- [`.agents/code-review-checklist.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/.agents/code-review-checklist.md) is the code review checklist.

There are GitHub workflows for code review, issue solving and generic tasks for Claude. They are triggered by mentioning Claude in an issue, a pull request comment or a review: `@claude review`, `@claude solve` or `@claude [generic prompt]`. The author of the issue or comment must have write, maintain or admin access to the repository. The review and solve workflows can also be started by hand with a pull request or issue number.
