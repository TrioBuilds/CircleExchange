import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { firebase } from '../services/firebase';
import { friendlyError } from '../errors';
import Notice from '../components/Notice';

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
    <>
      <p className="eyebrow">YOUR COMMUNITY STARTS HERE</p>
      <h1>A place for your people.</h1>
      <p className="intro">
        Make room for useful exchanges, familiar faces, and a stronger community.
      </p>
      <div className="account-grid">
        <section className="card">
          <div className="card-heading">
            <span className="step">01</span>
            <h2>
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
                : 'Sign in to continue to your workspace.'}
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
        <section className="journey">
          <p className="eyebrow">ONE STEP AT A TIME</p>
          <h2>
            Start with a name.
            <br />
            Grow into a circle.
          </h2>
          <ol>
            <li>
              <strong>Create your account</strong>
              <span>A private space that belongs to you.</span>
            </li>
            <li>
              <strong>Verify your email</strong>
              <span>Confirm ownership of your email address.</span>
            </li>
            <li>
              <strong>Save your profile</strong>
              <span>Join your workplace or choose your locality.</span>
            </li>
          </ol>
          <p className="fine-print">
            Verify your work email to join the community for its exact domain. Personal email users
            can join our Pune locality pilot.
          </p>
        </section>
      </div>
    </>
  );
}
