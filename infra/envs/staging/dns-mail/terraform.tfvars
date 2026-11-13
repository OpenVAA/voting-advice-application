# Tracked on purpose: the public record of this root's inputs. Nothing secret belongs here.
aws_account_id = "471112560111"
aws_region     = "eu-north-1"
environment    = "staging"
domain         = "staging.openvaa.org"

# Confirmed against the SigningHostedZone that SES returns for the identity after the first apply.
dkim_signing_hosted_zone = "dkim.amazonses.com"

# The organisation's own DMARC record already reports to this receiver, and the receiver already
# authorises the subdomain (both observed in public DNS on 2026-10-11). Replace it, or set it to null
# for no reports.
dmarc_report_address = "dmarc_agg@vali.email"
