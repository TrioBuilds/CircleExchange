# Milestone 1 verification

Verified locally on 2026-11-01 on Windows with Node 24.22.1, pnpm 11.25.0 and portable Java 21.

| Check | Result |
| --- | --- |
| ESLint | Passed |
| TypeScript and production Vite build | Passed |
| Configuration and account component tests | 8 passed |
| Firestore emulator authorization tests | 6 passed |
| Production environment guard with emulator configuration | Correctly refused deployment build |
| Browser: create local test account | Passed |
| Browser: send/open local verification link and refresh token | Passed |
| Browser: save profile, reload and recover saved name | Passed |
| Browser: sign out returns to sign-in view | Passed |

The browser check used disposable emulator data, not a cloud account. A first registration attempt made before emulator startup completed showed the intended retryable network error; retry succeeded once startup finished.

The default browser viewport was visually checked. A requested narrow viewport override did not change the actual 908px viewport, so phone-width visual verification remains pending. Responsive CSS is implemented but is not reported as visually verified at phone width.

Remaining limits: production Firebase credentials and project are not configured; real email delivery and cloud deployment are unverified. The current initial JavaScript bundle is approximately 241 KB gzipped; Vite reports a chunk-size warning. Split data-heavy features when adding the next milestone.
