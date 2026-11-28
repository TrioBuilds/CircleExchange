# Company email onboarding

Decision accepted 2026-11-02. This replaces manual approval for the supported company communities. Residential/personal-email communities and their administrator workflow remain deferred.

## User experience

1. Register with a company email and complete Firebase email verification.
2. The app refreshes the signed ID token and checks the exact verified domain and the exclusions for known personal email providers.
3. `hp.com` joins the HP community; `google.com` joins the Google community automatically. Other eligible domains join their own communities automatically, including linkedin.com. No request or administrator approval is needed.
4. The user may optionally save work location and office/branch. These are self-reported labels, not verified attributes or authorization boundaries.
5. Gmail, Yahoo and other recognized personal providers retain a usable private profile and see a clear waiting state. They are not assigned to a company, and they do not create a residential community automatically.

New communities use the full lowercase email domain as their ID. Existing HP and Google paths retain their original IDs. Subdomains and lookalikes get separate communities. The personal-provider exclusions are maintained in the client and Firestore rules and are not an exhaustive classification of email providers. A custom domain can represent a company, a family or another group.

## Stored membership

`communities/{companyId}/members/{uid}` stores only:

- `emailDomain`: exact verified domain, immutable.
- `role`: `member`, immutable from the browser.
- `status`: `active`; trusted Console operators may set `revoked`.
- `workLocation`, `branch`: optional strings represented by empty strings when omitted, each at most 80 characters.
- `createdAt`, `updatedAt`: server timestamps; creation time is immutable.

There is no required parent `communities/{id}` document. The member subcollection exists independently. Member creation is a transaction: repeat visits and concurrent enrollment do not overwrite previously saved work details or a revoked status. Users can only read their own membership; no member directory or email list is exposed.

## Authorization

Rules require the authenticated UID to match the document path, `email_verified == true`, and the authenticated email to match the company's exact domain. The browser cannot choose a company or impersonate a domain via submitted fields. Fresh signed claims are checked again before saving work details. Firestore rechecks the current request's claims for every operation; the existence of an old membership document is never sufficient.

Unknown fields, admin roles, forged timestamps, cross-company access, cross-user operations and client deletion are denied. A revoked record may be read by its owner but cannot be restored, edited, or deleted by that owner. Listings and messaging remain closed until their own rules and features are implemented; future access must check both current verified domain eligibility and active membership.

## Meaning and limitations of verification

The badge says **Company email verified**, not employee verified. A verified mailbox proves access to the address; contractors, shared-mailbox users or former staff who retain accounts may also have that access. These communities are not represented as officially endorsed by HP or Google.

This version verifies email during onboarding, not periodically against an employer directory. If Firebase email changes, a new token can no longer access the old company record, but already issued tokens may remain valid until expiry (normally up to one hour). Old records are retained and confer no access under a new domain. Automatic employee offboarding and periodic re-verification are future work, not guarantees of this release.

## Verification and release

Run `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:rules`. Use the local Auth emulator to create fictional `@hp.com` and `@google.com` users and follow its verification links; never send test verification email to real company addresses.

Check unverified accounts, consumer domains, unsupported domains, uppercase domains, suffix spoofs, repeated enrollment, retained work details, revoked records, cross-company reads/writes, and forged admin fields. Merge the reviewed PR into main only after checks pass; the existing main workflow deploys rules before Hosting. No manual production migration is required.

Validation on 2026-11-02: lint and production build passed; 36 application tests and 23 Firestore emulator tests passed. A local browser check with a fictional Auth-emulator HP account confirmed the verification gate, automatic membership, optional work-detail saving, and persistence after reload. No real corporate mailbox or production data was used. The production build retains the existing bundle-size advisory.
