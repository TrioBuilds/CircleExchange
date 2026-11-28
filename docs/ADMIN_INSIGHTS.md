
# Admin workspace and Insights

Firebase Hosting serves the admin workspace at `/admin`. It uses the same Firebase Auth session as CircleExchange. The hub links to the tools the signed-in account can access. `/admin/feedback` remains the feedback inbox and `/admin/overview` is the Insights dashboard.

## Enable Insights

1. Merge the PR. The existing main branch workflow deploys Firestore rules and Firebase Hosting.
2. In Firebase Authentication, copy the full UID of the verified account that should see cross-circle statistics. Create `insightsAdmins/<UID>` in the default Firestore database. An `enabled: true` boolean is a convenient field. The document's existence is the grant. Use the separate `feedbackAdmins/<UID>` grant for the feedback inbox. The client cannot write either grant.
3. Sign into the app with that account and open `/admin`. The Admin tools link also appears under Profile when either grant is present.

Firestore creates the metrics collections when their first documents are written. Use the existing default database. The dashboard only reads `insightEvents`, `insightReports`, and `insightCoverage/current` and does not need access to account profiles, reply notes, private conversations, or attachments. The rules check a verified account and its grant at each analytics read.

## Import earlier records once

An owner can run the importer using a short-lived Google Cloud access token for the CircleExchange project. It needs access to read Auth accounts and read and write data in the default Firestore database. The Firestore operation is separate from routine Hosting deployment, whose CI identity needs no new data permissions. Keep the token in the current shell environment.

In Google Cloud Shell or a shell with an authenticated Google Cloud CLI and Node.js, run from the repository root:

```sh
export CIRCLEEXCHANGE_ADMIN_ACCESS_TOKEN="$(gcloud auth print-access-token)"
node scripts/import-insights.mjs
node scripts/import-insights.mjs --apply
unset CIRCLEEXCHANGE_ADMIN_ACCESS_TOKEN
```

The first command using the script is a dry run. Applying creates only missing metric records, preserves records already written by the app, and saves an import date. The script reads only the source fields needed for metrics and prints record counts. Run it after the deployed frontend is live. For local verification with both Auth and Firestore emulators running, use `node scripts/import-insights.mjs --emulator --apply`.

## How to read the numbers

- Date ranges use India Standard Time. Onboarding measures the cohort of accounts created in the selected range and shows the milestones they have reached as of the refresh. Recorded offers, asks, or replies count as activation after a circle join. Guests are excluded.
- Feedback shows issues, distinct signed-in reporters, distinct guest sessions, ideas, and experience reports across the app. Open issues is the current backlog. Resolved issues use the currently stored resolution date.
- Supported local areas come from the geographic areas configured in the app. A member joining a location counts as a join, not a new location. The current pilot has no historical dates for when areas first became available. The table can distinguish recorded joins from posting activity.
- Circle totals use the board where each post was published. Selecting a parent includes its descendants. Individual rows show their own board. A member who joined multiple boards counts once in a rolled-up member total. Posts with replies count a post once even if it received multiple replies.
- Owner-marked exchanges and two-party confirmations are shown separately. Both participants in an accepted match can confirm in the private conversation. The second confirmation records the exchange's completion timestamp and marks the listing exchanged if it was still reserved. An exchange that the owner marked before the second confirmation can appear in both columns.
- Some historical events, including old owner-marked exchanges, accepted matches, and locality joins, have no exact timestamp. They appear in **All recorded activity** without entering a dated trend. Historical verified status is available in the onboarding cohort even when the verification date is unknown. The dashboard displays a coverage note until the first import.
- The dashboard refreshes on demand and caps reads to fit the pilot. If the metrics feed grows beyond that cap, use dated summaries before raising the read limit.
