
# Feedback pilot

CircleExchange collects feedback on the welcome page and within the app. Reports and replies stay in Firestore. The founder inbox lives at `/admin/feedback`. Customer history lives at `/feedback`.

## Enable intake

1. In Firebase Authentication, verify the account that will run the inbox. Copy its UID from the Authentication Users page.
2. In Firestore, create `feedbackAdmins/{uid}` with any field, for example `enabled: true` (boolean). Document existence grants access to that verified account. Delete the document to revoke access. Client writes to this collection are forbidden.
3. To collect feedback before sign-in, enable the Anonymous sign-in provider under Firebase Authentication. A guest can revisit feedback in the same browser. Creating a new account from that session preserves the UID and previous reports. Signing into a different, existing account switches to that account's history.
4. Create `feedbackConfig/pilot` with boolean fields `enabled: true` and `guests: true`. Set `guests` to false to pause guest intake and leave account feedback available. Set `enabled` to false to pause all new reports. Existing reports and replies remain accessible. Missing configuration keeps intake paused.
5. Open `/admin/feedback` with the founder account and send a sample report from a different account or an incognito window.

The same documents can be added in the local Emulator UI. Production rules, indexes and the web bundle deploy through the existing main branch workflow.

## App Check

To use App Check, register the deployed web app with Firebase App Check's reCAPTCHA v3 provider. Add the site key as the GitHub Actions repository variable `FIREBASE_APP_CHECK_SITE_KEY`, then redeploy from main. The browser receives the public site key. Leave the reCAPTCHA secret in Firebase.

Watch App Check metrics and verify both guest and account feedback before enforcing for Cloud Firestore. Enforcement applies to the entire Firestore app. Rules and workload limits still apply. [Firebase setup guide](https://firebase.google.com/docs/app-check/web/recaptcha-provider).

## Review and resolve

Open the inbox, filter loaded reports, and open a report to see attachments and account context. Reply in the conversation. Use private triage for priority and internal notes. Customers can refresh their history to see replies and status.

For an actionable bug or idea, select **Draft GitHub issue**. The draft carries the short feedback reference and category. Write the problem description and steps in GitHub, then save the issue number on the report. Link related reports to the same issue. Report text, screenshots, and account details stay in the inbox. After the fix ships from main, verify it before marking the report shipped.

## Manage the allowance

Each report supports up to two JPEG-encoded images of 150 KiB each. Normal browser uploads strip image metadata by re-encoding. The founder UI displays attachments as inline images. Rules enforce byte and attachment limits, and cannot validate image decoding. Images share the production Firestore quota.

There is a five-minute submission cooldown per account and a 500-report pilot cap. The rules enforce both even with a modified client. Review new report counts in the inbox and Firestore usage in Firebase. Delete attachments when they are no longer needed. For example, remove screenshots 90 days after closure. The founder can delete each attachment from a report.

The global submission count is recorded in `feedbackUsage/pilot`. It never automatically resets. Before extending the pilot, check remaining Firestore storage, remove old attachments as needed, and reset this document's `count` to zero through the Firebase console only if the remaining capacity can accommodate another pilot batch. A full batch can store about 146 MiB in image bytes. A new account or guest session cannot reset the global count.
