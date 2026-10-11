# Release checks

The community edition starts from a fresh source tree and fresh Git history. Personal sample names, deployment account/database identifiers, private operational history, credentials, screenshots and original mascot artwork are excluded. A new robot is generated without reading input images. Third-party notices are retained.

Checks completed during preparation:

- 27 automated tests passed: authentication, ownership, exact-cent money, concurrent gift claims, camera cleanup, monthly aggregation, motion, installation and photo quotas.
- Cloud and fictional preview builds passed.
- The pinned dependency installation and npm audit reported no known advisories at the time of checking. Advisory databases can change.
- Source review covered authentication, permissions, SQL, uploads, gift/money transitions, DOM rendering, build copying, PWA and shader boundaries. It identified cumulative photo storage exhaustion; the community edition adds database quotas and stale orphan cleanup with regression coverage.
- New screenshots use only fictional demo accounts and generic assets. Phone layout passed at 390px and 320px with no document overflow. Visible image loading, graph measure changes and per-child admin filtering passed in the synthetic browser fixture. Card, journal, wallet, insights and admin screenshots were inspected.

This is a scoped source review and regression check, not a penetration test or a guarantee of no security issues. Full vendor algorithms, physical phones, live deployment settings and operator practices were not independently audited. Real deployments must apply every migration, protect their setup key and plan backups and retention.

Screenshot names refer to the synthetic local preview, not an online household. No cloud family records were used to create them.

Pre-publication tracked-file checks passed for personal strings and paths, private credential byte matches, forbidden original-mascot frame hashes, screenshot EXIF and live deployment identifiers. Eight generic PNG files had non-rendering provenance metadata removed; exact IDAT image payloads were preserved. WebP illustrations contain only VP8L image payloads. The new Git history uses a neutral contributor name/email; the GitHub owner remains visible.

Publication check: the repository is public and its initial source snapshot is `480932d`. A fresh shallow clone successfully installed the pinned dependencies, passed all 27 tests and documentation links, and built both cloud and sample outputs. Private vulnerability reporting is enabled on GitHub. Public source publication does not deploy a shared family service.
