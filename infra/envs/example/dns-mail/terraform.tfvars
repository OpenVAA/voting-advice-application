# Tracked on purpose: the public record of this root's inputs, with stand-in values. Nothing secret
# belongs here.

# A stand-in. The provider refuses credentials for any account other than this one, so the root
# cannot be applied until this value is replaced with your own account id.
aws_account_id = "000000000000"
aws_region     = "eu-north-1"
environment    = "example"
domain         = "vaa.example.org"

# AWS states that the DKIM signing zone varies by Region and identity. Confirm this value against the
# SigningHostedZone that SES returns for the identity after the first apply.
dkim_signing_hosted_zone = "dkim.amazonses.com"

# Null sends no aggregate reports. A report mailbox on another domain than the sending domain must
# authorise the sending domain in its own DNS before receivers will send reports to it.
dmarc_report_address = null

manage_account_suppression = true
