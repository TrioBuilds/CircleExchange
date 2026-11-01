# Local setup and Firebase Spark deployment

## Local development (no account or billing)

Install Node 22.12+ (24 recommended), pnpm 11.25.0 and Java 21. From the repository root:

```sh
pnpm install --frozen-lockfile
```

Copy `frontend/.env.example` to `frontend/.env.local`. Keep the example's emulator settings.
Run `pnpm emulators` in one terminal and `pnpm dev` in another.
Open http://127.0.0.1:5173. Auth emulator links are printed in its terminal.
Use a fictitious email and a development-only password. Emulator state is disposable.

Without environment settings the app displays setup instructions; it does not silently use mock data or a remote database.

## Checks

```sh
pnpm lint
pnpm test
pnpm build
pnpm test:rules
```

Stop local emulators before the rules suite; it needs port 8080. Unit/component tests mock provider boundaries. The rules suite uses the real Firestore emulator, not a mocked authorization function.

Manual smoke test: register → send verification email → open emulator link → refresh verification → save profile → reload → confirm name persists → sign out → sign in → reset password. Confirm unverified accounts cannot access the profile form. Inspect both narrow and wide viewport layouts.

## Create your free production project

1. Create a Firebase project and keep it on **Spark** with no billing account. Analytics is unnecessary for this milestone.
2. Register a Web app; copy its public config values.
3. Enable Authentication → Email/Password. Set a minimum 8-character password policy, check email enumeration protection, and configure authorized domains for your Firebase Hosting domains.
4. Create a **Cloud Firestore Standard edition** database in production mode. Choose the region deliberately before creating it. Do not start in test mode.
5. Use **Hosting**, not App Hosting. Do not enable Cloud Storage, Functions, paid SMS, or attach billing.
6. Set `frontend/.env.production.local` with `VITE_USE_FIREBASE_EMULATORS=false` and the four `VITE_FIREBASE_*` values listed in `.env.example`. Use your actual project ID.
7. Review rule tests, Firebase usage limits, privacy/support requirements and the architecture before public access.

Do not paste service account credentials into frontend variables. Firebase Web API configuration is not an administrator credential.

## Deployment

```sh
pnpm exec firebase login
pnpm lint
pnpm test
pnpm test:rules
pnpm run deploy:build
pnpm exec firebase deploy --project YOUR_PROJECT_ID --only firestore:rules,firestore:indexes
pnpm exec firebase deploy --project YOUR_PROJECT_ID --only hosting
```

`deploy:build` checks effective production environment settings and rejects emulator/demo configuration before building. Make sure the selected Firebase CLI project matches `VITE_FIREBASE_PROJECT_ID`.

Deployment is a separate step: the code can run locally before a cloud project exists. A successful local build does not mean a project is deployed. This repository intentionally has no hard-coded production project alias.

## Quota and maintenance checklist

- Keep Spark selected; never accept an upgrade prompt just to finish deployment.
- Monitor Authentication, Firestore and Hosting usage during pilot onboarding.
- On quota exhaustion, reduce traffic/usage or wait for reset rather than enabling billing automatically.
- Use Firebase Console access only for trusted project administrators.
- Review provider pricing again before enabling any additional product.
