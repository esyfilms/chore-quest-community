# Security

Chore Quest Community stores private household data in its configured Cloudflare D1 database. The API does not provide end-to-end encryption, and the app does not currently provide a user-facing recovery or deletion flow. Do not use it for information that requires those protections until suitable controls are in place.

Keep setup keys, session cookies, invitation links, and database credentials private. Do not include them in source control, screenshots, public issues, or support messages. If a credential is exposed, rotate or revoke it promptly.

## Report a concern

Please report security issues privately through the repository's Security tab when private reporting is enabled. If it is unavailable, contact the repository maintainers through a private channel. Do not publish secrets, exploit details, or personal data in a public issue.

Security review of the source does not certify the deployed service. Deployment settings, account controls, and operational practices also affect security.
