# Change map

| Change | Follow these links |
| --- | --- |
| Shared markup or demo behavior | `index.html`, `app.js`, `test-mode.js`, cloud build and sample preview build |
| Cloud screen behavior | `cloudflare/cloud-client.js`, `admin-family.js`, `member-card.js`, `insights.js`, `journal.css`, built bundle |
| Account permissions or money | Worker routes, all migrations, `cloud.test.mjs`, flows, security and setup docs |
| Photo limits | Worker upload/cleanup/error handling, migration 0005, photo-limit tests, README limits and architecture |
| Mascot | `scripts/generate-buddy.py`, `assets/buddy-bot`, `buddy.js`, `buddy.css`, member-card crop, animation tests and screenshots |
| Sketch, loader or shader | Vendored source, generators, assets, notices, CREDITS and reduced-motion tests |
| Demo screenshots | Fictional fixtures, preview build, screenshots folder, README and content handoff |
| Deployment | Wrangler config, lockfile, build script, setup instructions and manual target check |

Build flow: shared HTML and JavaScript + curated assets → `cloudflare/build.mjs` → ignored `cloudflare/public` → explicit Wrangler deployment. Sample flow: shared presentation + fictional identity + in-memory adapter → `scripts/test-preview.mjs` → ignored `test-app` → loopback server. The admin review fixture is generated separately with `node scripts/admin-preview.mjs` after building the cloud app. It returns synthetic data and denies mutations.

There are no automated publication workflows. Do not add private household artifacts or reuse a live deployment's bindings in examples.
