# Architecture

Chore Quest Community is a web app served by a Cloudflare Worker. The Worker handles application requests and stores persistent records in Cloudflare D1. The Cloudflare configuration is in `cloudflare/wrangler.jsonc`; replace its placeholder database ID during setup.

Each deployment serves one household. Accounts, chores, wallet entries, gift offers and activity are stored in D1. Database triggers enforce balance changes and related record updates so that application actions remain consistent. Money-like values use integer cents to avoid floating-point rounding. The monthly view groups records by Singapore time by default; confirm that this default fits your household's reporting needs.

A browser session uses a 30-day cookie. Admins issue one-use invitation codes for account creation. Gift QR codes are separate: an admin chooses a recipient and amount, and that signed-in child scans, reviews and confirms the saved offer. Possession of a gift QR does not sign anyone in or choose the credited account.

The local `npm run preview` demo uses in-memory synthetic data and does not require passwords. The Worker development and production paths use D1 and require setup. These paths have different storage and account behavior.

## Data and security limits

Household records are private application data, but the API does not provide end-to-end encryption. The service operator and infrastructure provider may be able to access stored data. The app does not currently provide a recovery flow or a user-facing deletion flow. Plan how to retain and remove records before using it for real household information.

The app has no payment processing. Wallet balances are application records and are not bank accounts or transferable funds.

Photos are capped by database triggers: 20 MB per child, 80 MB per deployment and five unreferenced uploads per child. The next upload cleans unreferenced photos older than 24 hours; referenced chore photos remain. No scheduler runs this cleanup. See migration `0005_photo_limits.sql`.
