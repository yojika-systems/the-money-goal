# MoneyGoal operations

## Shipped capabilities

Astro static pages remain on the existing Cloudflare Pages project. Existing URLs are retained. New English articles are global `/blog/<slug>`, Indian `/in/blog/<slug>` or US `/us/blog/<slug>`. The original expense-ratio URL is retained through `legacyUrl`. Empty language archives and the empty news listing use noindex and are omitted from the sitemap. The three new calculators are under `/calculators/expense-ratio`, `/calculators/debt-payoff` and `/calculators/card-fee`.

Run `npm ci`, `npm test`, and `npm run verify`. The build includes placeholder, content, metadata, internal-link and rendered calculation checks. Use `npm run dev -- --port 4337` for a local preview. `npm run pipeline:dry-run` exercises an explicit offline hold without paid calls.

## GitHub configuration

Two repository secrets are required for generation:

- `OPENAI_API_KEY`: restricted to Responses API write. Created on 17 November 2026; expires 15 February 2027. Do not place it in a file, workflow, log or issue.
- `STATE_ENCRYPTION_KEY`: 32 random bytes as hex. AES-256-GCM protects the durable ledger on the public `automation-state` branch. Preserve this key; if it is lost, do not silently reset the budget ledger. Pause generation and reconstruct spend first.

Run artifacts are encrypted with the same key before upload because this repository is public. Downloaded files can be opened with `STATE_ENCRYPTION_KEY` in the environment and `node scripts/read-artifact.mjs path/to/report.json.enc`. Never upload plaintext owner reports.

The workflow runs at 03:17 and 15:17 UTC (08:47 and 20:47 India time) with a concurrency lock. A manual run is available in Actions → MoneyGoal publication. Missing credentials or source evidence produce a held summary with no paid request or publication. There is no fallback to another model, credential or subscription.

`automation/config.json` is the kill switch and cost policy. AI requests reserve conservative token cost in encrypted state BEFORE sending. Uncertain failures retain their reservation. The AI ceiling is ₹7,000/month with ₹18,000 reserved for other operations under the ₹25,000 planning cap; outside vendor spending must still be reconciled. The budget FX rate is deliberately conservative and is not a live exchange quote. Pricing has a review deadline. Do not change models without verifying rates and support.

Seven separate successful shadow days, including a real build of each draft, are required before automatic publication. The workflow never pushes a shadow article. The initial guides shipped with implementation are not counted as shadow days. Weekly ceilings are four evergreen, two news, two source refreshes. A missing source or editorial research flag holds a backlog candidate. Null volume and position mean unknown.

## Publication and recovery

Model output is structured plain text, not commands, MDX or arbitrary HTML. Only allowlisted exact source hosts are fetched. Each paragraph has evidence references; evidence passages must occur in fetched documents, and numerical claims must occur in the cited passage. Tables use registered code. A separate model challenge must pass alongside deterministic checks.

Before a live content commit, the publisher confirms that the only changed file is the selected Markdown article and main has not moved. It records a pending release in encrypted state and pushes the exact tested commit. The monitor requires a successful Cloudflare check and a matching rendered content digest. A failed deployment is reverted only if main still points to that release. Timeouts and newer commits stay locked for recovery; they are not blindly reverted. The next run recovers the pending release before any new draft.

Provider maintenance may only suspend an existing registry entry. It cannot change rates, links, dates, countries or activate a campaign. A successful HTTP request is not an agreement review. The live `/api/offer` endpoint checks country, recorded approval and expiration on every click. An expired offer returns 410 even before a rebuild. To reactivate, verify exact terms, record approval, eligibility, approved wording and an expiry. Never use an HTTP-only check to extend permission.

## Measurement and privacy

`wrangler.toml` declares the Analytics Engine dataset `themoneygoal_events` bound as `TMG_METRICS`. `/api/health` reports whether it is bound. `/api/events` accepts a fixed page and event allowlist. It stores event/page/market/tool/offer/placement plus a count. No identity, request headers, IPs, financial inputs or calculation results are written to that dataset. DNT/GPC disable optional events. This does not disable Cloudflare's own hosting/security processing. There are no custom analytics cookies and no claimed unique-user count.

Owner query example in Cloudflare Analytics Engine:

```sql
SELECT blob1 AS page, blob2 AS market, blob3 AS tool, blob4 AS offer,
       SUM(_sample_interval * double1) AS events
FROM themoneygoal_events
WHERE timestamp >= NOW() - INTERVAL '28' DAY
GROUP BY page, market, tool, offer
```

`node scripts/report.mjs` creates an owner artifact with actual known spend and publication status. It reads Search Console only if `GOOGLE_SERVICE_ACCOUNT_JSON` is configured for a service account already granted read access to the property. Optional variables: `GSC_SITE_URL` and `GA4_PROPERTY_ID`. Missing integrations and approved commission data remain explicitly unknown. Do not make the owner report public or copy financial records into the site.

## CJ and affiliate accounts

The signed-in catalogue was inspected on 17 November 2026. A search for “finance” showed 38 results and zero active matches. The visible promotional properties did not include MoneyGoal. No program terms were accepted and no new campaign was activated.

Initial catalogue candidates include Barclays US Online Savings, BMO, TaxAct, TurboTax and The Wall Street Journal. These are discovery observations, not approvals or verified MoneyGoal-eligible rates. Loan, trading and credit-repair programs should not be activated simply because a headline commission is high.

`node scripts/cj-sync.mjs` reads joined advertisers when `CJ_API_TOKEN` and `CJ_PUBLISHER_CID` are configured. It writes an owner artifact and never activates offers. Advertiser agreement, property acceptance, market eligibility, current links, permitted tracking parameters and creative approval must all be verified separately. Record commissions by status (pending, approved, reversed, paid), currency and attribution period; never present clicks or advertised payouts as income.

## Corrections and editorial queue

Use the public correction form for non-sensitive factual reports. Correct material errors in place with an update date and entry in `/corrections`. No identity or private financial data belongs in GitHub reports.

The first 90-day order is fixes and measurement; source-gated automation; tool-supported evergreen depth; then expansion based on actual country-specific impressions, clicks and approved conversions. The initial 15-entry backlog records reader decisions and unknown demand. Candidate-only entries need exact sources and a documented editorial/search review before they become eligible. No automatic paid SEO overages or broad translations are enabled.
