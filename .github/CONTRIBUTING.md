# Contributing

Use Node 24, pnpm 11.25.0 and Java 21. See [setup](../documentation/SETUP.md).
Work on a focused branch, make small changes and open a reviewable pull request.

Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm test:rules
```

Commit the lockfile. Keep credentials, `.env.local`, emulator caches, build output and dependencies untracked.
Security rules and negative authorization tests belong in the same change as the feature they protect.
Use TypeScript and service-layer functions. Update the authoritative architecture and roadmap when a decision changes.
Do not add paid infrastructure or attach Firebase billing as part of a routine implementation change.

The files under `documentation/archive` record older plans, not current instructions.
