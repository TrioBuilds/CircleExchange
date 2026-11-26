import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { firebase } from '../services/firebase';
import { friendlyError } from '../errors';
import Notice from '../components/Notice';
import ExchangeExample from '../components/ExchangeExample';

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  function changeMode(next: typeof mode) {
    setMode(next);
    setError('');
    setMessage('');
    setPassword('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const auth = firebase!.auth;
      if (mode === 'register') {
        // The verification screen owns email sending, so a delivery failure never looks like failed registration.
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage('If this address has an account, a reset email will arrive shortly.');
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-copy">
          <p className="eyebrow">GOOD THINGS. PEOPLE CLOSE BY.</p>
          <h1>
            Your next good find <span>could be next door.</span>
          </h1>
          <p className="intro">
            Buy a secondhand desk, offer a service, or save on movie tickets with people in your
            workplace or neighborhood.
          </p>
          <div className="welcome-actions">
            <a className="primary" href="#welcome-account" onClick={() => changeMode('register')}>
              Join my circle
            </a>
            <a className="secondary" href="#welcome-account" onClick={() => changeMode('login')}>
              Sign in
            </a>
          </div>
          <p className="welcome-caption">
            A community marketplace for everyday things and a little help.
          </p>
        </div>
        <ExchangeExample />
      </div>
      <div className="account-grid welcome-account">
        <section
          className="card"
          id="welcome-account"
          tabIndex={-1}
          aria-labelledby="account-title"
        >
          <div className="card-heading">
            <h2 id="account-title">
              {mode === 'register'
                ? 'Create your account'
                : mode === 'reset'
                  ? 'Reset your password'
                  : 'Welcome back'}
            </h2>
          </div>
          <p className="muted">
            {mode === 'register'
              ? 'Use your work email for a company community, or a personal email for the Pune locality pilot.'
              : mode === 'reset'
                ? 'We’ll send you a link to choose a new password.'
                : 'Sign in to see offers from your community.'}
          </p>
          <form onSubmit={(event) => void submit(event)}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {mode !== 'reset' && (
              <>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={mode === 'register' ? 8 : undefined}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === 'register' && <small>Use at least 8 characters.</small>}
              </>
            )}
            <Notice error={error} message={message} />
            <button className="primary" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'register'
                  ? 'Create account →'
                  : mode === 'reset'
                    ? 'Send reset email'
                    : 'Sign in →'}
            </button>
          </form>
          <div className="form-links">
            <button
              className="text-button"
              disabled={busy}
              onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'New here? Create an account' : 'Back to sign in'}
            </button>
            {mode === 'login' && (
              <button className="text-button" disabled={busy} onClick={() => changeMode('reset')}>
                Forgot password?
              </button>
            )}
          </div>
        </section>
        <section className="journey welcome-guide" aria-labelledby="guide-title">
          <h2 id="guide-title">Inside your circle</h2>
          <ul>
            <li>
              <strong>Feed</strong>
              <span>Browse offers, ask for help, or post something you can share.</span>
            </li>
            <li>
              <strong>Requests</strong>
              <span>Follow up on offers and arrange the exchange once a request is accepted.</span>
            </li>
            <li>
              <strong>Profile</strong>
              <span>Manage your display name and community details.</span>
            </li>
          </ul>
          <p className="fine-print">
            Verify a work email to join your company’s circle. With a personal email, check local
            coverage after sign-in. The neighborhood pilot covers parts of Baner, Pune.
          </p>
        </section>
      </div>
    </div>
  );
}
