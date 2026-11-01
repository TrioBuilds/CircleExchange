# CircleExchange: small-task implementation roadmap

Authoritative architecture: [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md).
Old plans in `documentation/archive/` are historical only.

## Milestone 1 — Web foundation and private account

- [x] Create implementation branch from main.
- [x] Replace conflicting architecture with a Firebase Spark web-app design.
- [x] Add React/TypeScript/Vite frontend and a reproducible dependency lockfile.
- [x] Implement email/password registration, sign-in and password reset.
- [x] Implement explicit email verification and token refresh.
- [x] Implement private persistent profiles with server-enforced field restrictions.
- [x] Add emulator setup, test suites, CI, and Firebase Hosting configuration.
- [ ] Configure the owner's Firebase Spark project and deploy after local verification.
- [ ] Validate real email delivery and hosted account flow against that project.

## Milestone 2 — One verified community

- [ ] Define the pilot community and its real-world approval criteria.
- [ ] Bootstrap the community and first administrator through trusted Console access.
- [ ] Add join request, approval/rejection and revocation data models.
- [ ] Test self-approval, role escalation, revoked membership and cross-community isolation.
- [ ] Build member request and administrator review screens.

Acceptance: an approved member can enter their community; pending/rejected/revoked users cannot read its protected data.

## Milestone 3 — Text marketplace

- [ ] Agree on category, integer price/currency and listing lifecycle contracts.
- [ ] Add persistent create/edit/archive flows with owner and membership rules.
- [ ] Add bounded browsing, category filters and cursor pagination.
- [ ] Test another community's data and another seller's mutation attempts.

Acceptance: two approved users can publish and browse listings without cross-community leakage. No image storage required.

## Milestone 4 — Private conversations

- [ ] Add listing-linked conversations with exactly two approved participants.
- [ ] Add bounded message history and active-conversation realtime subscriptions.
- [ ] Test sender impersonation, unauthorized reading and revoked-member behavior.

## Milestone 5 — Pilot readiness

- [ ] Define exchange completion, reporting, moderation and dispute handling.
- [ ] Add privacy notice, support contact and manual export/deletion procedure.
- [ ] Verify App Check configuration, abuse controls and quota monitoring.
- [ ] Run a small invited-user pilot and record usage and feedback.

## After funding or a deliberate cost decision

Uploads, server jobs, search services, payment processing, richer reputation, and mobile packaging. Re-evaluate each from measured needs rather than adopting the previous full roadmap at once.
