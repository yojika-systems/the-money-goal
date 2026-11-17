# MoneyGoal operations

## Shipped capabilities

Astro static pages remain on the existing Cloudflare Pages project. Existing URLs are retained. New English articles are global `/blog/<slug>`, Indian `/in/blog/<slug>` or US `/us/blog/<slug>`. The original expense-ratio URL is retained through `legacyUrl`. Empty language archives and the empty news listing use noindex and are omitted from the sitemap. The three new calculators are under `/calculators/expense-ratio`, `/calculators/debt-payoff` and `/calculators/card-fee`.

Run `npm ci`, `npm test`, and `npm run verify`. The build includes placeholder, content, metadata, internal-link and rendered calculation checks. Use `npm run dev -- --port 4337` for a local preview. `npm run pipeline:dry-run` exercises an explicit offline hold without paid calls.

## GitHub configuration

The default provider is `codex`, using the owner's ChatGPT/Codex subscription and available Codex credits, matching the existing Yojika approach. An OpenAI API balance is not required. Set `AI_PROVIDER=codex`; there is no automatic API fallback.

- `CODEX_CONTENT_AUTH_JSON`: a dedicated ChatGPT-managed Codex login, created in a fresh temporary `CODEX_HOME`. Do not copy the everyday app login or Yojika's independently rotating login. Only a trusted serialized main-branch workflow may use it.
- `STATE_ENCRYPTION_KEY`: 32 random bytes as hex. AES-256-GCM protects the durable ledger on the public `automation-state` branch. Preserve this key; if it is lost, do not silently reset the budget ledger. Pause generation and reconstruct spend first.

The Codex secret seeds the first run. Each call checkpoints the refreshed auth into the encrypted ledger, including on a failed draft, so the next serialized call/run uses the latest token. An unchanged seed never replaces rotated auth; explicitly replacing the seed secret with a new dedicated login reauthorizes the stream, detected by its fingerprint. It is never written to plaintext run artifacts. The CLI and model process receive no GitHub, encryption, Google, CJ or API secrets. Before inference a real sandbox preflight must demonstrate that both the credential directory and repository Git configuration are unreadable. The agent only gets an evidence scratch directory, no network tools or write permissions, and returns schema-bound JSON. Temporary auth and scratch files are removed in a finally block. The workflow pins Codex CLI 0.163.0.

Optional `AI_PROVIDER=openai-api` requires `OPENAI_API_KEY` restricted to Responses API write, plus an API balance. The previously prepared API key is not used by the Codex provider. Do not switch providers automatically after a partial failure.

Run artifacts are encrypted with the same key before upload because this repository is public. Downloaded files can be opened with `STATE_ENCRYPTION_KEY` in the environment and `node scripts/read-artifact.mjs path/to/report.json.enc`. Never upload plaintext owner reports.

An owner-only recovery copy is stored outside the checkout at `~/.config/themoneygoal/state-encryption-key` with mode 0600; `read-artifact.mjs` uses it automatically and redacts cached credentials from output. Preserve this file separately from public code and shared folders. The manual **Owner state-key recovery** workflow can encrypt a replacement backup to an owner-supplied RSA public key (3072+ bits). Only the public key goes to GitHub; the downloaded ciphertext needs the corresponding private key to open. Never send either the state key or a private key through chat, issues or workflow inputs.

The workflow runs at 03:17 and 15:17 UTC (08:47 and 20:47 India time) with a concurrency lock. A manual run is available in Actions → MoneyGoal publication. Missing credentials or source evidence produce a held summary with no paid request or publication. There is no fallback to another model, credential or subscription.

`GENERATION_PAUSED=true` in repository Actions variables immediately holds drafting while maintenance continues. `automation/config.json` also supplies a kill switch and usage policy. Codex reserves each attempted call before execution, with at most four calls per day and 100 per month, a three-minute timeout per call and no automatic purchases or provider fallback. These are usage limits, not a rupee cost guarantee: subscription/credit charges are not inferred from API token prices. Reconcile shared account usage and operating spend with actual billing. The optional API route retains the ₹7,000 monthly AI ceiling, conservative token reservations and ₹18,000 non-AI reserve under the ₹25,000 planning cap. Outside vendor spending must still be reconciled. Review the pinned model and cost policy by the recorded deadline.

Seven separate successful shadow days, including a real build of each draft, and at least 168 elapsed hours from the first successful shadow validation are required before automatic publication. The workflow never pushes a shadow article. The initial guides shipped with implementation are not counted as shadow days. Weekly ceilings are four evergreen, two news, two source refreshes. A missing source or editorial research flag holds a backlog candidate. Null volume and position mean unknown.

## Publication and recovery

Model output is structured plain text, not commands, MDX or arbitrary HTML. Only allowlisted exact source hosts are fetched. Code extracts bounded literal passage options before drafting; the writer selects passage IDs and cannot supply its own quotation. Each paragraph has evidence references; evidence passages must occur in fetched documents, and numerical claims must occur in the cited passage. Tables use registered code. A separate model challenge must pass alongside deterministic checks. The candidate queue alternates researched evergreen pages and news, with due refreshes included; an unbounded news feed cannot consume every attempt. A new draft needs room for both writer and verifier calls in the subscription allowance.

Before a live content commit, the publisher confirms that the only changed file is the selected Markdown article and main has not moved. It records a pending release in encrypted state and pushes the exact tested commit. The monitor requires a successful Cloudflare check and a matching rendered content digest. A failed deployment is reverted only if main still points to that release. Timeouts and newer commits stay locked for recovery; they are not blindly reverted. The next run recovers the pending release before any new draft.

Provider maintenance may only suspend an existing registry entry. It cannot change rates, links, dates, countries or activate a campaign. A successful HTTP request is not an agreement review. The live `/api/offer` endpoint checks country, recorded approval and expiration on every click. An expired offer returns 410 even before a rebuild. To reactivate, verify exact terms, record approval, eligibility, approved wording and an expiry. Never use an HTTP-only check to extend permission.

Alice Blue remains held. Its old `/charges/` URL returned 404; the verified current pricing page is `/pricing`. The published referral policy requires approval for promotional material. Confirm the applicable agreement and website permission before activation; required creatives need an approval reference and permitted wording. Keep private approval documents outside this public repository. The existing referral code is retained, with no inferred commission rate or new promotion permission.

## Measurement and privacy

`wrangler.toml` declares the Analytics Engine dataset `themoneygoal_events` bound as `TMG_METRICS`. `/api/health` reports whether it is bound. `/api/events` accepts a fixed page and event allowlist. It stores event/page/market/tool/offer/placement plus a count. No identity, request headers, IPs, financial inputs or calculation results are written to that dataset. The browser sends optional events only after analytics consent; DNT/GPC override consent. This does not disable Cloudflare's own hosting/security processing. Aggregate endpoint counts are not unique-user counts.

The owner's OpenSEO project is connected read-only to `sc-domain:themoneygoal.com` and GA4 property `471529141`, verified on 17 November 2026. The existing web stream is `G-1F9L70WQWL`. Google enhanced measurement is disabled: no automatic form, search, outbound-link or history collection. The site loads the Google library only after an affirmative choice and only on the production hostname. Page locations come from server-rendered canonicals with all query strings/fragments removed; referring URLs are reduced to their origin. Manual tool/link events use the same field allowlist as the aggregate endpoint. Advertising signals are disabled. Revocation sets Google's collection-disable flag and removes accessible `_ga` cookies; a preference lasts at most 180 days. Preview/local deployments do not load Google Analytics. Reports cover consented traffic and test activity may appear on the initial launch day.

Owner query example in Cloudflare Analytics Engine:

```sql
SELECT blob1 AS page, blob2 AS market, blob3 AS tool, blob4 AS offer,
       SUM(_sample_interval * double1) AS events
FROM themoneygoal_events
WHERE timestamp >= NOW() - INTERVAL '28' DAY
GROUP BY page, market, tool, offer
```

`node scripts/report.mjs` creates an owner artifact with actual known spend and publication status. GitHub has no Google service-account credential; owner reporting can read the connected Search Console and GA4 properties through OpenSEO. The optional direct-runner reporting adapter reads Search Console only if `GOOGLE_SERVICE_ACCOUNT_JSON` is configured for a service account already granted read access to the property. Optional variables: `GSC_SITE_URL` and `GA4_PROPERTY_ID`. An unconfigured runner adapter does not mean the owner's OpenSEO connection is absent. Missing data and approved commissions remain explicitly unknown. The pre-launch GA4 organic report returned no rows for 16 August–15 November 2026. Do not make the owner report public or copy financial records into the site.

## CJ and affiliate accounts

The signed-in catalogue was inspected on 17 November 2026. A search for “finance” showed 38 results and zero active matches. The visible promotional properties did not include MoneyGoal. No program terms were accepted and no new campaign was activated.

Initial catalogue candidates include Barclays US Online Savings, BMO, TaxAct, TurboTax and The Wall Street Journal. These are discovery observations, not approvals or verified MoneyGoal-eligible rates. Loan, trading and credit-repair programs should not be activated simply because a headline commission is high.

`node scripts/cj-sync.mjs` reads joined advertisers when `CJ_API_TOKEN` and `CJ_PUBLISHER_CID` are configured. It writes an owner artifact and never activates offers. Advertiser agreement, property acceptance, market eligibility, current links, permitted tracking parameters and creative approval must all be verified separately. Record commissions by status (pending, approved, reversed, paid), currency and attribution period; never present clicks or advertised payouts as income.

## Corrections and editorial queue

Use the public correction form for non-sensitive factual reports. Correct material errors in place with an update date and entry in `/corrections`. No identity or private financial data belongs in GitHub reports.

The first 90-day order is fixes and measurement; source-gated automation; tool-supported evergreen depth; then expansion based on actual country-specific impressions, clicks and approved conversions. The initial 15-entry backlog records reader decisions and unknown demand. Candidate-only entries need exact sources and a documented editorial/search review before they become eligible. No automatic paid SEO overages or broad translations are enabled.
