import { useState } from 'react';
import { reload, sendEmailVerification, type User } from 'firebase/auth';
import { friendlyError } from '../errors';
import Notice from '../components/Notice';

export default function Verification({ user, onVerified }: { user: User; onVerified: () => void }) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(action: 'send' | 'check') {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (action === 'send') {
        await sendEmailVerification(user);
        setMessage('Verification email sent. Check your inbox and spam folder.');
      } else {
        await reload(user);
        await user.getIdToken(true);
        if (user.emailVerified) onVerified();
        else setMessage('Your email is not verified yet. Open the email link, then check again.');
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="eyebrow">STEP 02 / EMAIL VERIFICATION</p>
      <h1>Let’s make it yours.</h1>
      <section className="card narrow">
        <h2>Verify your email address</h2>
        <p>
          Send a verification link to <strong>{user.email}</strong>. After opening it, return here
          to continue.
        </p>
        <Notice error={error} message={message} />
        <div className="button-row">
          <button className="primary" disabled={busy} onClick={() => void act('send')}>
            Send verification email
          </button>
          <button className="secondary" disabled={busy} onClick={() => void act('check')}>
            I’ve verified my email
          </button>
        </div>
        <p className="fine-print">
          After verification, work addresses join their company community. Personal email users can
          choose their locality in Pune.
        </p>
      </section>
    </>
  );
}
