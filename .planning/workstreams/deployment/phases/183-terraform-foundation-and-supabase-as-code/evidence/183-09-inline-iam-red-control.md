# Red control of the inline IAM policy guard (183-09)

Five runs of `scripts/assert-no-inline-iam-policies.mjs`, taken one after another at commit
4c356f947 (the guard, its fixtures, its `lint:check` link and its gate spec all committed). Each
command wrote stdout and stderr to files under the session scratch directory, and its exit status was
read on the line after the command, never through a pipe. Node v24.21.0.

- Attempt: 09-3 20261018T210029Z.4c356f947

| # | Command | Expected | Status | Date (UTC) |
|---|---------|----------|--------|------------|
| 1 | `node scripts/assert-no-inline-iam-policies.mjs` | 0 | 0 | 2026-10-18T21:00:47Z |
| 2 | `node scripts/assert-no-inline-iam-policies.mjs --root scripts/fixtures/no-inline-iam-policies/violations` | 1 | 1 | 2026-10-18T21:00:47Z |
| 3 | `node scripts/assert-no-inline-iam-policies.mjs --root scripts/fixtures/no-inline-iam-policies/ok` | 0 | 0 | 2026-10-18T21:00:47Z |
| 4 | `node scripts/assert-no-inline-iam-policies.mjs --root $TMPDIR/inline-iam-empty.XXXXXX (new, empty)` | 1 | 1 | 2026-10-18T21:00:47Z |
| 5 | `node scripts/assert-no-inline-iam-policies.mjs --bogus` | 2 | 2 | 2026-10-18T21:00:47Z |

Run 4's setup was its own command: `mktemp -d` exited 0 and the directory held no entry before the
guard ran, so its exit 1 is the guard's and not a failed setup. Runs 2, 3 and 5 needed no setup: the
fixture roots are committed and run 5 passes a flag.

## Run 1: the real tree (stderr summary)

```
No-inline-IAM-policies guard — 42 .tf file(s) read under 'infra'; 0 finding(s).
```

## Run 2: the violating fixture root (stdout, nine findings)

```
scripts/fixtures/no-inline-iam-policies/violations/extra.tf.json: path matches .tf.json file
scripts/fixtures/no-inline-iam-policies/violations/main.tf:8: aws_iam_user_policy
scripts/fixtures/no-inline-iam-policies/violations/main.tf:17: inline_policy
scripts/fixtures/no-inline-iam-policies/violations/main.tf:23: aws_iam_role_policy
scripts/fixtures/no-inline-iam-policies/violations/main.tf:32: aws_iam_group_policy
scripts/fixtures/no-inline-iam-policies/violations/main.tf:37: aws_ssoadmin_permission_set_inline_policy
scripts/fixtures/no-inline-iam-policies/violations/main.tf:40: inline_policy
scripts/fixtures/no-inline-iam-policies/violations/main.tf:43: aws_iam_policy_attachment
scripts/fixtures/no-inline-iam-policies/violations/main.tf:49: aws_iam_*_policies_exclusive not empty
```

Line 40 is the `inline_policy` argument inside the permission-set resource that line 37 opens, so a
permission-set inline policy is reported twice. Every banned form is named at least once: the user,
role and group inline policy resources, the role's `inline_policy` block, the permission-set inline
policy, the account-wide exclusive attachment, an exclusive-policies resource with a name in its list,
and a `.tf.json` file.

## Run 4: the empty root (stderr)

```
No-inline-IAM-policies guard — no .tf file under '/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/inline-iam-empty.18aZgA', so nothing was examined. A check that examined nothing must not report success.
```

## Run 5: the unknown argument (stderr)

```
scripts/assert-no-inline-iam-policies.mjs: unexpected argument '--bogus'
usage: node scripts/assert-no-inline-iam-policies.mjs [--root <dir>] | --self-test
```

## What this supports and what is still to be seen

This supports the phase's statement that a check in the repository fails on an inline policy: the
guard was seen failing on the fixture root that holds each banned form, and passing on the real
`infra/` tree, on 2026-10-18. Still to be seen: the same failure through `yarn lint:check` itself with
a file planted under `infra/` (plan 183-13), and the account's own state, read by the operator's
inventory script (plans 183-14 and 183-17).
