import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, reload, sendEmailVerification,
  sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User,
} from 'firebase/auth';
import { configuration, firebase } from './services/firebase';
import { loadProfile, saveProfile } from './services/profile';
import { friendlyError } from './errors';

function Notice({ error, message }: { error: string; message: string }) {
  return <>{error && <p className="notice error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}</>;
}

function Shell({ children, user }: { children: ReactNode; user?: User | null }) {
  const [error, setError] = useState('');
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="CircleExchange home"><span className="brand-icon">↔</span><span>Circle<span className="brand-light">Exchange</span></span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <div className="nav-active"><span>◉</span> My account</div>
      <p className="sidebar-caption">A little closer.<br />A lot more useful.</p>
      <div className="sidebar-note"><span className="dot" /> First steps<br /><small>Build your profile. Your community comes next.</small></div>
    </aside>
    <main>
      <header><span>Workspace <span className="separator">/</span> My account</span><span className="phase">EARLY ACCESS</span></header>
      <div className="content">
        {user && <div className="session"><span>{user.email}</span><button className="text-button" onClick={() => { setError(''); void signOut(firebase!.auth).catch((err: unknown) => setError(friendlyError(err))); }}>Sign out</button></div>}
        {error && <p role="alert" className="notice error">{error}</p>}
        {children}
      </div>
      <footer>CircleExchange <span>Good things, within your circle.</span></footer>
    </main>
  </div>;
}

function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  function changeMode(next: typeof mode) { setMode(next); setError(''); setMessage(''); setPassword(''); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const auth = firebase!.auth;
      if (mode === 'register') {
        // The verification screen owns email sending, so a delivery failure never looks like failed registration.
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage('If this address has an account, a reset email will arrive shortly.');
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) { setError(friendlyError(err)); } finally { setBusy(false); }
  }
  return <>
    <p className="eyebrow">YOUR COMMUNITY STARTS HERE</p>
    <h1>A place for your people.</h1>
    <p className="intro">Make room for useful exchanges, familiar faces, and a stronger community.</p>
    <div className="account-grid">
      <section className="card">
        <div className="card-heading"><span className="step">01</span><h2>{mode === 'register' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}</h2></div>
        <p className="muted">{mode === 'register' ? 'Start with an email address you can verify.' : mode === 'reset' ? 'We’ll send you a link to choose a new password.' : 'Sign in to continue to your workspace.'}</p>
        <form onSubmit={(event) => void submit(event)}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== 'reset' && <><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} />{mode === 'register' && <small>Use at least 8 characters.</small>}</>}
          <Notice error={error} message={message} />
          <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account →' : mode === 'reset' ? 'Send reset email' : 'Sign in →'}</button>
        </form>
        <div className="form-links">
          <button className="text-button" disabled={busy} onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'New here? Create an account' : 'Back to sign in'}</button>
          {mode === 'login' && <button className="text-button" disabled={busy} onClick={() => changeMode('reset')}>Forgot password?</button>}
        </div>
      </section>
      <section className="journey"><p className="eyebrow">ONE STEP AT A TIME</p><h2>Start with a name.<br />Grow into a circle.</h2><ol><li><strong>Create your account</strong><span>A private space that belongs to you.</span></li><li><strong>Verify your email</strong><span>Confirm that you own your email address.</span></li><li><strong>Save your profile</strong><span>Choose how you’d like to be known.</span></li></ol><p className="fine-print">Community membership is a separate approval step. Trading opens when community features are ready.</p></section>
    </div>
  </>;
}

function Verification({ user, onVerified }: { user: User; onVerified: () => void }) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(action: 'send' | 'check') {
    setBusy(true); setError(''); setMessage('');
    try {
      if (action === 'send') { await sendEmailVerification(user); setMessage('Verification email sent. Check your inbox and spam folder.'); }
      else {
        await reload(user);
        await user.getIdToken(true);
        if (user.emailVerified) onVerified();
        else setMessage('Your email is not verified yet. Open the email link, then check again.');
      }
    } catch (err) { setError(friendlyError(err)); } finally { setBusy(false); }
  }
  return <><p className="eyebrow">STEP 02 / EMAIL VERIFICATION</p><h1>Let’s make it yours.</h1><section className="card narrow"><h2>Verify your email address</h2><p>Send a verification link to <strong>{user.email}</strong>. After opening it, return here to continue.</p><Notice error={error} message={message} /><div className="button-row"><button className="primary" disabled={busy} onClick={() => void act('send')}>Send verification email</button><button className="secondary" disabled={busy} onClick={() => void act('check')}>I’ve verified my email</button></div><p className="fine-print">Email verification confirms email ownership. It does not grant access to a community.</p></section></>;
}

function Profile({ user }: { user: User }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setLoadFailed(false);
    void loadProfile(user.uid).then((value) => { if (active) setName(value); }).catch((err: unknown) => {
      if (active) { setError(friendlyError(err)); setLoadFailed(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.uid, attempt]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await saveProfile(user.uid, name); setName(name.trim()); setMessage('Your profile is saved.'); }
    catch (err) { setError(friendlyError(err)); } finally { setBusy(false); }
  }
  return <><p className="eyebrow">YOUR ACCOUNT</p><h1>Make yourself at home.</h1><p className="intro">A simple profile. A good place to begin.</p><div className="account-grid">
    <section className="card"><div className="card-heading"><span className="step">03</span><h2>Your profile</h2></div><span className="verified">✓ Email verified</span>
      <form onSubmit={(event) => void submit(event)}><label htmlFor="name">Display name</label><input id="name" autoComplete="nickname" required minLength={2} maxLength={60} value={name} disabled={loading || loadFailed} onChange={(e) => setName(e.target.value)} /><small>Between 2 and 60 characters. Your profile is currently private.</small><Notice error={error} message={message} />{loadFailed ? <button type="button" className="secondary" onClick={() => setAttempt((n) => n + 1)}>Retry loading profile</button> : <button className="primary" disabled={busy || loading || name.trim().length < 2}>{loading ? 'Loading profile…' : busy ? 'Saving…' : 'Save profile'}</button>}</form>
    </section>
    <section className="journey"><p className="eyebrow">COMING NEXT</p><h2>Find your circle.</h2><p>Community joining and membership approval are the next milestone.</p><div className="empty-icon">◎</div><p className="fine-print">No community access has been granted. Listings and messaging will follow verified membership.</p></section>
  </div></>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  useEffect(() => {
    if (!firebase) { setLoading(false); return; }
    return onAuthStateChanged(firebase.auth, (next) => { setUser(next); setVerified(next?.emailVerified ?? false); setLoading(false); });
  }, []);
  if (!configuration.ready) return <Shell><p className="eyebrow">DEVELOPMENT SETUP</p><h1>Your workspace is ready to connect.</h1><section className="card narrow"><h2>Connect Firebase to begin</h2><p>Copy <code>frontend/.env.example</code> to <code>frontend/.env.local</code>, start the local emulators, then restart the development server.</p><p className="notice">{configuration.reason}</p><p>See <code>documentation/SETUP.md</code> for local and Firebase Spark setup.</p></section></Shell>;
  return <Shell user={user}>{loading ? <p role="status">Loading your workspace…</p> : !user ? <AuthForm /> : !verified ? <Verification user={user} onVerified={() => setVerified(true)} /> : <Profile key={user.uid} user={user} />}</Shell>;
}
