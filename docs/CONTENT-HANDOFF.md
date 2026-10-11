# Content handoff draft

This is a factual draft for a short product introduction. It describes the app without making security, performance, or hosting guarantees. Confirm the final style in the user's cloud session before recording or publishing.

## Reel draft: 30–45 seconds

**Opening**

“Chore Quest Community gives a household one place to track chores and review rewards.”

**Show the chore list**

“Members can record completed chores. An admin reviews each submission.”

**Show wallet and request cards**

“Approved rewards update an in-app wallet record. Children can request cash or a purchase. An adult fulfills the request. Adults can also create a gift QR for the child to scan and confirm.”

**Show the insights and admin views**

“Households can review activity and manage invitations. The monthly view groups activity by Singapore time by default.”

**Close**

“Try the local synthetic demo, or set up your own Cloudflare account and D1 database. The app does not process payments.”

## Instagram carousel draft: 7 slides

1. **Chore Quest Community** — a shared place to track household chores.
2. **Record a chore** — members submit completed work for review.
3. **Review together** — an admin approves a submission or asks for it to be redone.
4. **Track rewards** — approved rewards appear as integer-cent wallet records.
5. **Make a request** — children request cash or a purchase; adults can send a gift QR.
6. **See household activity** — monthly grouping uses Singapore time by default.
7. **Try the demo** — preview uses synthetic in-memory data. Cloudflare setup uses your own account; no payments are processed.

## Screenshot assets

Screenshots are captured from the fictional local demo:

- [Chores](screenshots/chores.jpg)
- [Wallet](screenshots/wallet.jpg)
- [Member card](screenshots/card.jpg)
- [Insights](screenshots/insights.jpg)
- [Admin](screenshots/admin.jpg)

Use fictional accounts such as `DemoKid`, `DemoPal`, and `AdminOne`. Remove real names, balances, invitation codes, and other household details from any image before it is shared. These are sample app states, not records from a real household. Final reel and carousel artwork should follow the style supplied in the cloud session.

## Claims to keep precise

The preview is synthetic and in-memory. The deployed app stores data in D1 and does not provide end-to-end encryption. Recovery and user-facing deletion flows are not currently available. Hosting cost depends on the user's Cloudflare account and current plan. The app has no payment processing. These are product facts, not a security certification or performance claim.
