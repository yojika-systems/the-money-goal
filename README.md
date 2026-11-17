# The MoneyGoal

Financial education, reproducible calculators and a source-gated publishing system.

```sh
npm ci
npm test
npm run verify
npm run dev -- --port 4337
```

Production: https://themoneygoal.com · Hosting: existing Cloudflare Pages Git integration.

Read [operations](docs/OPERATIONS.md) for the Codex subscription runner, shadow activation, encrypted state, usage limits, affiliate approvals, measurement and recovery. Set the Actions variable `GENERATION_PAUSED=true` to hold drafting. Secrets belong in GitHub Actions, never source files.
