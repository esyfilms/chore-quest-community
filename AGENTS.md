# Community project working rules

Read README, docs/DEPENDENCIES.md, docs/ARCHITECTURE.md and SECURITY.md before changing behavior. Update the relevant setup, flows, credits and verification notes in the same change. Keep mock screenshots aligned with the app.

Use fictional accounts and generic assets. Never add production records, passwords, invitation codes, session cookies, setup secrets, database exports or personal screenshots. Keep local secrets and generated output ignored.

Preserve integer cents, database wallet guards, explicit admin confirmation and server ownership checks. Demo role switches are presentation only; they must never become a cloud login bypass.

Run relevant tests, npm run docs:check and npm run build. Record evidence and limits in docs/VERIFICATION.md. Do not call a local change deployed or independently audited. Publish or deploy only when the user has authorized the destination and scope.
