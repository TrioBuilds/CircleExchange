# CircleExchange

A browser-based community marketplace, built in small, testable milestones.

## Current status

The hosted web app supports email/password accounts, verified work-domain communities, and a self-selected Pune locality pilot for personal email users. Members can publish free or INR-priced listings, browse their community feeds, request an item, and accept or decline requests. Accepted buyers and sellers can coordinate in a private listing conversation. Residential administration, reporting, and broader pilot safeguards remain planned. See [company onboarding](docs/COMPANY_ONBOARDING.md).

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
pnpm format:check
pnpm test
pnpm build
pnpm test:rules
```

Stop running emulators before `test:rules`, which starts its own isolated instance.

Run `pnpm format` to apply the project's formatting rules.

## Source structure

```text
frontend/src/
  App.tsx       Authentication state and screen selection
  app/          Shared layout, navigation, and workspace composition
  pages/        Sign-in, email verification, and profile screens
  components/   Community panels, listing cards/forms, inbox, and conversations
  services/     Firebase configuration and data operations
  test/         Shared test setup
```

Tests live beside the code they cover. Community definitions, configuration parsing,
listing links, and error messages remain in the source root.

## Documentation

- [Architecture](docs/ARCHITECTURE.md): the authoritative implementation design.
- [Setup and deployment](docs/SETUP.md): local setup and free Firebase project checklist.
- [Small-task roadmap](docs/ROADMAP.md): current and next milestones.
- [Pilot operations](docs/VALIDATION.md): hosted validation checklist.
- [Feedback](docs/FEEDBACK.md) and [admin insights](docs/ADMIN_INSIGHTS.md): pilot workflows.
- [Archived plans and research](docs/archive/): superseded designs and early research.

Free hosting means staying within provider quotas, not unlimited capacity. Keep the Firebase project on Spark with no billing account. Production is hosted at https://circle-exchange.web.app/. Deployments from main require project configuration and short-lived Google credentials; this repository does not contain production credentials.
