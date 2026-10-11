# Setup

Chore Quest Community can run as a local synthetic demo or as a Cloudflare Worker backed by D1. The demo uses in-memory data and has no password requirement. It does not connect to a Cloudflare account.

## Local demo

Use Node.js 22.18 or newer. From the project directory, run:

```sh
npm ci
npm test
npm run preview
```

Open `http://127.0.0.1:8790`. Preview data is synthetic and kept in memory; refreshing the page resets it. The preview is for trying the interface, not for keeping household records.

## Cloudflare setup

You need your own Cloudflare account and Wrangler access. The project does not promise free hosting; check Cloudflare's current pricing and limits before deployment. It does not process payments.

1. Install dependencies and sign in:

   ```sh
   npm ci
   npx wrangler login
   ```

2. Create a D1 database:

   ```sh
   npx wrangler d1 create chore-quest-community
   ```

3. Put the database ID returned by Wrangler in `cloudflare/wrangler.jsonc`, replacing the placeholder `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
4. Initialize the local D1 database:

   ```sh
   npm run db:local
   ```

5. Create a local setup secret. Keep the value private and do not commit `.dev.vars`:

   ```sh
   openssl rand -hex 32
   ```

   Add the generated value to `cloudflare/.dev.vars` as `SETUP_KEY=<generated-value>`. Do not paste a real key into documentation, issues, or chat.
6. Start the Worker locally:

   ```sh
   npm run build
   npm run dev
   ```

7. Complete first-admin setup in the app, then invite household members. Keep the setup key private and remove or rotate it when initial setup is complete, following the deployment configuration.

## Deploy

Apply migrations to the remote database, configure the secret, then deploy:

```sh
npx wrangler d1 migrations apply DB --remote --config cloudflare/wrangler.jsonc
npx wrangler secret put SETUP_KEY --config cloudflare/wrangler.jsonc
npm run deploy
```

Wrangler prompts for the secret value. Use a strong, private value. Confirm that the configured database and Worker belong to your own account before deploying.
