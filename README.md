# The MoneyGoal

Financial education, reproducible calculators and a source-gated publishing system.

```sh
npm ci
npm test
npm run verify
npm run dev -- --port 4337
```

Production: https://themoneygoal.com · Hosting: existing Cloudflare Pages Git integration.

Read [operations](docs/OPERATIONS.md) for shadow activation, encrypted state, cost limits, affiliate approvals, measurement and recovery. Change `automation/config.json` to pause paid generation. Secrets belong in GitHub Actions, never source files.
