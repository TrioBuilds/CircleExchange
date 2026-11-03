import { useEffect, useState, type FormEvent } from 'react';
import { ensureCompanyMembership, saveWorkDetails, type CompanyMembership } from './services/company';
import LocalityPanel from './LocalityPanel';
import { isPersonalEmail } from './companies';
import Inbox from './Inbox';
import Listings from './Listings';
import { friendlyError } from './errors';

export default function CompanyPanel({ uid, email }: { uid: string; email?: string | null }) {
  const [membership, setMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [inboxRevision, setInboxRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [workLocation, setWorkLocation] = useState('');
  const [branch, setBranch] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setMembership(null);
    void ensureCompanyMembership(uid).then((result) => {
      if (!active) return;
      setMembership(result); setWorkLocation(result?.workLocation ?? ''); setBranch(result?.branch ?? '');
    }).catch((err: unknown) => { if (active) setError(friendlyError(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, attempt]);

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await saveWorkDetails(uid, workLocation, branch);
      setWorkLocation(workLocation.trim()); setBranch(branch.trim());
      setMessage('Your work details are saved.');
    } catch (err) { setError(friendlyError(err)); } finally { setBusy(false); }
  }

  return <section className="journey" aria-label="Your community">
    <p className="eyebrow">YOUR COMMUNITY</p>
    {loading ? <p role="status">Connecting your company community…</p> : !membership && !error && isPersonalEmail(email) ? <LocalityPanel uid={uid} /> : !membership ? <>
      <h2>{error ? 'Connection interrupted' : 'Your circle is coming.'}</h2>
      {error ? <><p className="notice error" role="alert">{error}</p><button className="secondary" onClick={() => setAttempt((n) => n + 1)}>Retry community connection</button></> : <>
        <p>This email address is not eligible for a workplace community.</p>
        <p>Verify a work email to join its domain’s community automatically. Personal email users can join our Pune locality pilot.</p>
        <p className="fine-print">Your account and private profile are ready. No community membership has been assigned.</p>
      </>}
    </> : membership.status === 'revoked' ? <>
      <h2>{membership.company.name} community access paused</h2>
      <p>Your membership has been revoked. Email verification does not restore revoked access.</p>
    </> : <>
      <h2>Welcome to the {membership.company.name} community.</h2>
      <span className="verified">✓ Company email verified</span>
      <p>You’ve joined automatically with your verified <strong>@{membership.company.domain}</strong> email. No approval request is needed.</p>
      <form onSubmit={(event) => void save(event)}>
        <label htmlFor="work-location">Work location (optional)</label>
        <input id="work-location" placeholder="e.g. Bengaluru" maxLength={80} value={workLocation} onChange={(event) => setWorkLocation(event.target.value)} />
        <label htmlFor="work-branch">Office or branch (optional)</label>
        <input id="work-branch" placeholder="e.g. Whitefield office" maxLength={80} value={branch} onChange={(event) => setBranch(event.target.value)} />
        <small>Self-reported details. These do not change your company or grant extra access.</small>
        {error && <p className="notice error" role="alert">{error}</p>}
        {message && <p className="notice" role="status">{message}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Saving work details…' : 'Save work details'}</button>
      </form>
      <p className="fine-print">Company email verified means mailbox ownership, not an employer endorsement.</p>
      <Inbox onDecision={() => setInboxRevision(n => n + 1)} uid={uid} boards={[membership.company]} />
      <Listings inboxRevision={inboxRevision} company={membership.company} uid={uid} />
    </>}
  </section>;
}
