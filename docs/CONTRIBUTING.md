# Contributing

Contributions should keep setup understandable, protect household privacy, and preserve accurate wallet records.

## Local development

Use Node.js 22.18 or newer. Install dependencies and run the existing checks:

```sh
npm ci
npm test
npm run preview
```

The preview at `http://127.0.0.1:8790` is an in-memory synthetic demo. For work on the Cloudflare Worker and D1 path, follow [Setup](SETUP.md) and use a Cloudflare account you control.

## Change guidance

- Keep sample accounts fictional. Documentation examples use `DemoKid`, `DemoPal`, and `AdminOne`.
- Store currency amounts as integer cents and preserve the database rules that keep wallet and activity records consistent.
- Avoid logging secrets, invitation tokens, session cookies, or household details.
- Do not add analytics, external inference, or publishing integrations that transmit household data without clear documentation and consent.
- Describe what was checked and what remains unverified. A passing test suite is not a security certification.
- Do not commit `.dev.vars`, account credentials, real household data, or production database exports.

For security issues, follow [Security](../SECURITY.md).
