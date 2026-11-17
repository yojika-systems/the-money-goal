# Publication controls

`config.json` is the kill switch and budget policy. Setting `enabled` to false stops paid drafting, but maintenance still runs. The first seven successful shadow days with a fully validated draft are recorded in the durable `automation-state` branch before live publication can begin. A clock delay alone cannot activate publication.

Four evergreen, two news and two refreshes per ISO week are ceilings, not targets. Candidate-only backlog entries stay held until source selection and editorial/search research are recorded; null metrics mean unknown, never zero demand. No paid research is performed automatically.

The main branch stores code, reviewed controls, source hosts and published Markdown. `automation-state` stores an AES-256-GCM encrypted ledger containing source fingerprints, reservations, costs, held reasons, shadow results and deployment recovery state. State commits use `[CF-Pages-Skip]` and do not contain API keys, account IDs, article source bodies or financial inputs. Workflow artifacts retain held draft packages for 30 days, with no automatic public release.

Offers require recorded approval and country/channel eligibility. An HTTP 200 never renews advertiser permission or verifies a fee. Expired offers fail at the live redirect endpoint even before the next site rebuild. The existing Alice Blue link has a bounded verification deadline; new campaigns remain inactive.

See `docs/OPERATIONS.md` for setup, recovery, measurement and budget accounting.
