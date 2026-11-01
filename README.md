# CircleExchange

A browser-based community marketplace, built in small, testable milestones.

## Current status

Milestone 1 implements email/password registration, sign-in, password reset, explicit email verification, and a private Firestore profile. Verified `@hp.com` and `@google.com` accounts now join their company community automatically and can save optional work location/branch. Other domains keep their profiles and wait for supported communities. Residential approval, listings and messaging remain planned. See [company onboarding](documentation/COMPANY_ONBOARDING.md).

## Stack

React + TypeScript + Vite → Firebase Authentication + Cloud Firestore → Firebase Hosting (Spark).
No separate application server, native mobile app, paid subscription, Cloud Functions, or Cloud Storage is required for this milestone.

## Run locally

Install Node.js 22.12+ (24 recommended), pnpm 11.25.0, and Java 21 for Firestore emulation.

```sh
pnpm install --frozen-lockfile
```

Copy `frontend/.env.example` to `frontend/.env.local`.

```sh
# Terminal 1
pnpm emulators
# Terminal 2
pnpm dev
```

Open http://127.0.0.1:5173. Emulator UI: http://127.0.0.1:4000.
Verification/reset links are printed by the Auth emulator; it does not send real email.

```sh
pnpm lint
pnpm test
pnpm build
pnpm test:rules
```

Stop running emulators before `test:rules`, which starts its own isolated instance.

## Documentation

- [Architecture](documentation/ARCHITECTURE.md): the authoritative implementation design.
- [Setup and deployment](documentation/SETUP.md): local setup and free Firebase project checklist.
- [Small-task roadmap](todolist.md): current and next milestones.
- [Archived plans](documentation/archive/): historical context only; not current implementation instructions.

Free hosting means staying within provider quotas, not unlimited capacity. Keep the Firebase project on Spark with no billing account. Deployments require your own project configuration and Firebase login; this repository does not contain production credentials or claim an existing deployment.
