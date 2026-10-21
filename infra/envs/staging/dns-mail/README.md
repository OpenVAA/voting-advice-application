# Zone and mail root: runbook

This root holds the hosted zone of the staging domain `staging.openvaa.org` and the mail identity
that sends from it: the SES domain identity with its DKIM, MAIL FROM and DMARC records, and the SMTP
user with its send policy. They live in a root of their own because they must outlive the frontend
stack: the pipeline's root can be destroyed and created again, and a new zone would mean new name
servers at the parent zone and a new DKIM verification. The root is applied by hand, by an operator
signed in with the applying identity, and never by a workflow. Its state lives in the state bucket
under `hand/`, which neither workflow role can read, because it holds the SMTP credential in clear
text.

The overview of every root, the order of first applies and the rules that hold for every apply are in
[`../../../README.md`](../../../README.md). The records changed by hand at the parent zone's DNS host
are written down in [`DELEGATION.md`](DELEGATION.md).

## Flow overview

```
Step 1  first apply of the zone, the identity and the SMTP user
   |
Step 2  read four outputs by name and the identity, with its DKIM signing zone
   |
Step 3  plan again, which must show no change; the account's two assert modes; the state object
   |
Step 4  only if the signing zone differed: plan and apply the three corrected DKIM records
   |
Step 5  the four NS records at the parent zone's DNS host, recorded in DELEGATION.md
   |
Step 6  the checks from outside, with dig
   |
Step 7  the wait for the identity to verify
   |
Step 8  the production-access request
   |
Step 9  your own mailbox, verified by hand for the sandbox
```

Steps 1 to 3 are one sitting. Step 5 needs the four name servers that Step 2 printed. Steps 7 to 9 are
one sitting that may begin hours after Step 5, once the delegation resolves in public DNS.

No step of this runbook sends a test mail from a workstation. The first mail through SES is sent by
the hosted function, in a later stage of the deployment work.

## What you paste back

Every command below sends its raw output to a log file in a directory outside the repository, `$L`,
and prints named lines of the form `s<item>_<field>=<value>`. Within a step, the numbered items carry
the number that begins their named lines: item 6 prints lines beginning `s6_`. A typed answer goes on
a line of the form `answer_<name>=<text>`. Paste those lines and nothing else: nothing from a log and
nothing from the terminal's scroll-back.

- A plan log, an apply log, the output of `terraform show`, and the output of `terraform output`
  without a name are never pasted, because they hold attribute values and resource ids. For this root
  the apply log also holds the line `aws_iam_access_key.smtp: Creation complete … [id=…]`, and that id
  is the access key id of the SMTP user, which is the SMTP user name and half of the mail credential.
- When a status line is not 0, paste the lines up to it and stop.
- If whoever asked you to run a step gave you an attempt id, the first line of your reply is
  `answer_attempt=<that id>`. A reply is recorded only for the attempt it names, so an answer given in
  an earlier sitting cannot stand in for this one.

`$L` and any saved plan file (`tfplan`) hold secrets in clear text: resource ids, attribute values, and
whatever the state or the API returned. Never share, attach or paste either. The last item of each
step removes them and prints a named line; if you stop early or a command fails, run that last item
before you leave the terminal, unless whoever asked you to run the step has asked you to keep a log
for one more named line.

## Before you start

- **The state bucket exists.** The account-level root of [`../../../bootstrap/`](../../../bootstrap/)
  has been applied and its state migrated, because this root's backend names that bucket.
- **The applying identity**, the same one that applied the account-level root.
- **Terraform 1.16.5**, the version in `infra/.terraform-version`, and `jq`, `dig` and the AWS CLI.
- **`<your-address>`**, the mailbox you verify for the sandbox in Step 9. You type it in the terminal
  of that step only; it enters no file of this repository and no input of Terraform.

**The lines that begin each sitting.** A step is often resumed in a new terminal, so no command below
relies on an earlier sitting. Run these first, from the repository root, signed in, and again in any
new terminal. Each step lists the ones it needs.

```bash
cd infra/envs/staging/dns-mail
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
```

`LC_ALL=C` keeps every number and sort order independent of your workstation's locale. Give a time in
UTC, in the form `date -u +%Y-%m-%dT%H:%MZ` prints.

## Step 1: First apply

The apply creates the hosted zone, the SES identity with its DKIM, MAIL FROM and DMARC records, the
account's suppression list setting for the region, and the SMTP user with its access key and its
customer-managed send policy. Run Steps 1 to 3 in one terminal, signed in with the applying identity.

1. The lines that begin the sitting, from the repository root:

   ```bash
   cd infra/envs/staging/dns-mail
   export LC_ALL=C
   export AWS_PAGER=""
   L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
   ```

2. It must print `s2_account=471112560111`. Any other account means stop: the shell is signed in
   elsewhere.

   ```bash
   echo "s2_account=$(aws sts get-caller-identity --query Account --output text)"
   ```

3. Initialise:

   ```bash
   terraform init -input=false -no-color > "$L/s3.log" 2>&1; echo "s3_init_exit=$?"
   ```

4. Plan, and print the plan's summary line:

   ```bash
   terraform plan -input=false -no-color -out=tfplan > "$L/s4.log" 2>&1; echo "s4_plan_exit=$?"
   grep -m1 -E '^(Plan:|No changes)' "$L/s4.log" | sed 's/^/s4_plan_line=/'
   ```

   Read the plan itself in `$L/s4.log` if you wish. Go on only if the printed line reads
   `0 to change, 0 to destroy`. A first apply adds resources, so the count to add is not zero.

5. Apply the saved plan, then remove it whether the apply succeeded or failed, because the plan file
   holds this root's values in clear text:

   ```bash
   terraform apply -input=false -no-color tfplan > "$L/s5.log" 2>&1; echo "s5_apply_exit=$?"
   grep -m1 -E '^Apply complete!' "$L/s5.log" | sed 's/^/s5_apply_line=/'
   rm -f tfplan
   ```

Steps 2 and 3 continue in the same terminal. Return the lines of Steps 1 to 3 together, at the end of
Step 3.

## Step 2: The outputs and the identity

6. Four outputs, each by name. The name servers and the DKIM values are public DNS data.

   ```bash
   terraform output -json name_servers | jq -r '.[] | "s6_name_server=\(.)"'
   echo "s6_zone_id=$(terraform output -raw zone_id)"
   terraform output -json dkim_tokens | jq -r 'to_entries[] | "s6_dkim_cname_\(.key + 1)=\(.value)"'
   echo "s6_sender=$(terraform output -raw sender_address)"
   ```

   > **Read outputs by name only, and never the two SMTP credential outputs.** Read `name_servers`,
   > `zone_id`, `dkim_tokens` and `sender_address`, each by its name, as above. The root also has three
   > SMTP outputs: the endpoint, which is public, and the SMTP user name and the SMTP password, which
   > together are the mail credential. Never print those two, and never run `terraform output` without
   > a name, which would list every output of the root. The credential stays in the state and in the
   > apply log, and no step of this runbook reads it.

7. The identity as SES reports it. The raw answer goes to the log, and only named fields are printed:

   ```bash
   aws sesv2 get-email-identity --region eu-north-1 --email-identity staging.openvaa.org --output json > "$L/s7.json" 2> "$L/s7.err"; echo "s7_identity_exit=$?"
   jq -r '"s7_verified=\(.VerifiedForSendingStatus)", "s7_dkim=\(.DkimAttributes.Status)", "s7_zone=\(.DkimAttributes.SigningHostedZone)", "s7_mailfrom=\(.MailFromAttributes.MailFromDomainStatus)", (.DkimAttributes.Tokens | to_entries[] | "s7_dkim_cname_\(.key + 1)=\(.value)")' "$L/s7.json"
   ```

   AWS documents that the hosted zone part of each DKIM CNAME value "varies by AWS Region and
   identity", and that the `GetEmailIdentity` response carries it in the field `SigningHostedZone` of
   `DkimAttributes`. The identity resource does not export that field, so the root takes the zone as
   the variable `dkim_signing_hosted_zone`, set in `terraform.tfvars` to `dkim.amazonses.com`.
   Compare `s7_zone` with that value. If they differ, the three DKIM records point into the wrong
   zone and the identity cannot verify: `terraform.tfvars` is corrected to the value of `s7_zone` and
   committed, and Step 4 applies the corrected records before Step 5 delegates the zone. Before the
   delegation, `s7_verified` is expected to read `false` and `s7_dkim` and `s7_mailfrom` not yet
   `SUCCESS`.

## Step 3: Plan again, the account and the state

8. Plan again. Status 0 means no change, 2 means changes, 1 means an error.

   ```bash
   terraform plan -input=false -no-color -detailed-exitcode > "$L/s8.log" 2>&1; echo "s8_second_plan_exit=$?"
   ```

9. The account, now that the SMTP user exists. Both assert modes of the inventory script must print 0:
   no IAM user in the account carries an inline policy, and everything under the path `/openvaa/` has
   customer-managed policies only. The last two lines read the SMTP user's own policies: no inline
   policy, and the send policy attached.

   ```bash
   ../../../scripts/account-inventory.sh --assert-no-inline-user-policies > "$L/s9a.log" 2>&1; echo "s9_assert_users_exit=$?"
   ../../../scripts/account-inventory.sh --assert-managed-only /openvaa/ > "$L/s9b.log" 2>&1; echo "s9_assert_managed_exit=$?"
   echo "s9_smtp_inline_count=$(aws iam list-user-policies --user-name openvaa-staging-ses-smtp --query 'length(PolicyNames)' --output text)"
   echo "s9_smtp_attached=$(aws iam list-attached-user-policies --user-name openvaa-staging-ses-smtp --query 'AttachedPolicies[].PolicyName' --output text)"
   ```

   If an assert mode printed 1, add its lines; the script prints names and counts only:

   ```bash
   sed 's/^/s9_inv=/' "$L/s9a.log"
   sed 's/^/s9_inv=/' "$L/s9b.log"
   ```

10. The encryption of this root's state object in the bucket:

    ```bash
    echo "s10_state_sse=$(aws s3api head-object --bucket openvaa-tfstate-471112560111 --key hand/staging/dns-mail/terraform.tfstate --query ServerSideEncryption --output text)"
    ```

11. Last item, also when you stop early or a command failed. The apply log in `$L` holds the SMTP user
    name, so the directory must not outlive this sitting.

    ```bash
    rm -f tfplan
    test -n "$L" && rm -rf "$L" && echo "s11_logs_removed=yes"
    ```

Return, for Steps 1 to 3: every line that begins with `s` and an item number, from `s2_` to `s11_`. The
SMTP user name and the SMTP password are in none of these lines.

## Step 4: Only if the signing zone was corrected

Run this step only if `s7_zone` of Step 2 differed from `dkim_signing_hosted_zone` and
`terraform.tfvars` has been corrected since. Otherwise skip it; your reply then holds no `s0_` line.
The items of this step print lines beginning `s0_`.

The lines that begin the sitting, from the repository root, signed in:

```bash
cd infra/envs/staging/dns-mail
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
```

Plan, and print the summary line and the resource headings:

```bash
terraform plan -input=false -no-color -out=tfplan > "$L/s0.log" 2>&1; echo "s0_plan_exit=$?"
grep -m1 -E '^(Plan:|No changes)' "$L/s0.log" | sed 's/^/s0_plan_line=/'
grep -E '^  # ' "$L/s0.log" | sed 's/^/s0_plan_resource=/'
```

Go on only if the printed lines name the three DKIM records and nothing else, and nothing is
destroyed. Then apply the saved plan:

```bash
terraform apply -input=false -no-color tfplan > "$L/s0a.log" 2>&1; echo "s0_apply_exit=$?"
```

Last, whether you applied or stopped. The plan file holds this root's state values, the SMTP key among
them.

```bash
rm -f tfplan
test -n "$L" && rm -rf "$L" && echo "s0_logs_removed=yes"
```

Return: the `s0_` lines, and nothing from a log.

## Step 5: The delegation at the parent zone's DNS host

The parent zone `openvaa.org` is served by Cloudflare. This step adds four NS records there, by hand,
so that the name `staging.openvaa.org` is answered by the zone of this root. Before it, the four
`s6_name_server` values of Step 2 are written into the table of [`DELEGATION.md`](DELEGATION.md).
After it, the time you saved the last record is written there too, so that the delegation can be
checked and undone.

1. In the Cloudflare dashboard open the zone `openvaa.org`, then DNS, then Records.
2. Look once more for any record at or under `staging` (search for `staging`), a disabled or proxied
   one included. If one exists, do not add anything: say on the line
   `answer_existing_staging_record=` what you see, as the type and the name of each record. If there is
   none, write `answer_existing_staging_record=none`. Cloudflare documents that records left at or
   under a delegated name become shadowed and that "no error is returned".
3. Add four records. Each has Type `NS`, Name `staging`, TTL Auto, and as its name server one of the
   four values in the table of `DELEGATION.md`. Copy the values; do not retype them. An NS record has no
   proxy switch.
4. Add no DS record. Neither zone is signed. Cloudflare documents that a DS record is needed only if
   the delegated name server has DNSSEC enabled.
5. If you want to see the referral yourself, it needs no credential:

   ```bash
   dig +short NS openvaa.org @1.1.1.1
   dig +norecurse NS staging.openvaa.org @<one of those name servers>
   ```

   You need not paste it; whoever asked you to run this step runs the same commands.

Return: the four name server values as they now read in the dashboard, on the lines `answer_ns_1=` to
`answer_ns_4=`; the time you saved the last one (UTC) on the line `answer_saved_utc=`; and your
`answer_existing_staging_record=` line. If the dashboard refused a record, put its message on a line
`answer_dashboard_message=`.

## Step 6: The checks from outside

These need no credential and change nothing, so whoever recorded Step 5 can run them as well as you.
The first asks one of the parent zone's name servers directly and does not wait for any cache; the
others ask a public resolver.

```bash
dig +short NS openvaa.org @1.1.1.1
dig +norecurse NS staging.openvaa.org @<one of those name servers>
dig +short NS staging.openvaa.org @1.1.1.1
dig +short SOA staging.openvaa.org @1.1.1.1
```

What each should show is in "Not yet observed" below until it has been seen: the referral of the
second command names the four name servers of `DELEGATION.md` in its authority section, and the third
command prints the same four. Observed on 2026-10-11: the parent zone's SOA carried a negative-cache
time of 1800 seconds, so a public resolver that cached the earlier `NXDOMAIN` for the staging name may
keep it for up to 30 minutes after the records are saved.

Return: nothing is required. If the third command still prints nothing an hour after Step 5, say so on
the line `answer_public_ns=empty`.

## Step 7: The wait for the identity to verify

Steps 7 to 9 are one sitting, which begins once Step 6 shows the delegation in public DNS. It may need a
wait of hours; there is nothing to do in between. If you come back in a new terminal, run the sitting
lines again. Here the log of Step 8 holds the contact address you give.

The lines that begin the sitting, signed in:

```bash
export LC_ALL=C
export AWS_PAGER=""
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-183.XXXXXX")
```

1. The identity's three statuses:

   ```bash
   aws sesv2 get-email-identity --region eu-north-1 --email-identity staging.openvaa.org --output json > "$L/s1.json" 2> "$L/s1.err"; echo "s1_identity_exit=$?"
   jq -r '"s1_verified=\(.VerifiedForSendingStatus)", "s1_dkim=\(.DkimAttributes.Status)", "s1_mailfrom=\(.MailFromAttributes.MailFromDomainStatus)"' "$L/s1.json"
   ```

   Wanted: `s1_verified=true`, `s1_dkim=SUCCESS` and `s1_mailfrom=SUCCESS`, each on its own line. Run
   the two lines again until all three are right. If `s1_dkim` is still `PENDING` several hours after
   the delegation resolved, paste the lines as they are instead of waiting longer: the record targets
   are then checked again. AWS documents that SES tries to detect the MAIL FROM records for 72 hours.

## Step 8: The production-access request

AWS documents that an account in the SES sandbox sends only to verified addresses and domains or to
the mailbox simulator, at most 200 messages in 24 hours and at most one message a second, that the
sandbox is per region, and that verifying the domain before requesting production access is a best
practice. The sandbox is accepted for staging, so nothing waits for the grant.

2. File the request, with the complete command. The CLI asks nothing, so the description is given as
   an argument. Type your own address in place of `<your-address>`.

   ```bash
   aws sesv2 put-account-details --region eu-north-1 --production-access-enabled --mail-type TRANSACTIONAL --website-url https://openvaa.org --use-case-description 'Sign-in links for invited people and password recovery for a voting advice application. About 100 mails a day, with a peak of 2000 a day. Bounces and complaints go to the account suppression list.' --additional-contact-email-addresses <your-address> --contact-language EN > "$L/s2.log" 2>&1; echo "s2_request_exit=$?"
   ```

   Then read three fields of the account. The raw answer of `get-account` holds the contact address
   you just gave, so it goes to the log and only three fields are printed.

   ```bash
   aws sesv2 get-account --region eu-north-1 --output json > "$L/s2.json" 2> "$L/s2.err"; echo "s2_account_exit=$?"
   jq -r '"s2_production=\(.ProductionAccessEnabled)", "s2_sending=\(.SendingEnabled)", "s2_max24h=\(.SendQuota.Max24HourSend)"' "$L/s2.json"
   ```

   Give the time you filed the request on the line `answer_request_filed_utc=`, in the form that
   `date -u +%Y-%m-%dT%H:%MZ` prints. AWS documents that its Support team gives an initial response
   within 24 hours.

## Step 9: Your own mailbox, for the sandbox

3. Verify your own mailbox by hand, with the CLI, so that no personal address enters Terraform or this
   repository. Type your own address in place of `<your-address>`.

   ```bash
   aws sesv2 create-email-identity --region eu-north-1 --email-identity <your-address> > "$L/s3.log" 2>&1; echo "s3_mailbox_exit=$?"
   ```

   Then follow the link in the mail SES sends you, and write `answer_mailbox_verified=done`.

4. Last item, also when you stop early or a command failed:

   ```bash
   test -n "$L" && rm -rf "$L" && echo "s4_logs_removed=yes"
   ```

Do not read the root's SMTP credential outputs and do not send a test mail from your workstation.

Return, for Steps 7 to 9: the `s1_` lines once all three are right; the `s2_` lines and
`answer_request_filed_utc=`; `s3_mailbox_exit=`, `answer_mailbox_verified=done` and
`s4_logs_removed=yes`. Do not paste your address.

## Not yet observed

Nobody has applied this root yet. Each statement below is something this runbook relies on and that
has not been seen. It moves to "Observations", with its date, once the step named beside it has shown
it.

| Statement                                                                                                                                   | Checked by                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| The DKIM signing zone of this identity, as `SigningHostedZone` reports it, equals the default `dkim.amazonses.com` in the variable file     | Step 2, item 7                                                               |
| A second plan right after the first apply shows no change                                                                                   | Step 3, item 8                                                               |
| The SMTP user carries no inline policy and only the customer-managed send policy, and both assert modes of the inventory script pass        | Step 3, item 9                                                               |
| The Cloudflare dashboard accepts four NS records named `staging` beside the zone's other records                                            | Step 5, item 3                                                               |
| The referral from the parent zone's name servers names the four name servers of this zone, and a public resolver answers with the same four | Step 6                                                                       |
| The identity reaches verified for sending, with DKIM `SUCCESS` and the MAIL FROM domain `SUCCESS`                                           | Step 7, item 1                                                               |
| The production-access request is accepted as filed, and how Support answers it                                                              | Step 8, item 2, and the mail Support sends afterwards                        |
| `create-email-identity` for a single address sends a verification mail with a link to that address                                          | Step 9, item 3                                                               |
| SES accepts an SMTP send under the scoped send policy, which allows one From address on this identity only                                  | A later stage of the deployment work, with the first mail the function sends |
| A received mail passes DKIM, SPF and DMARC, aligned with the From domain                                                                    | A later stage of the deployment work, from the headers of a received mail    |
| The DMARC record of the staging name takes the place of the organisation's policy for mail from that name                                   | A later stage of the deployment work, from the headers of a received mail    |

## Observations

| Date (UTC) | Observation |
| ---------- | ----------- |
