import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { loadProfile, saveProfile } from '../services/profile';
import { friendlyError } from '../errors';
import Notice from '../components/Notice';

export default function ProfilePage({ user }: { user: User }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setLoadFailed(false);
    void loadProfile(user.uid)
      .then((value) => {
        if (active) setName(value);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(friendlyError(err));
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.uid, attempt]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await saveProfile(user.uid, name);
      setName(name.trim());
      setMessage('Your profile is saved.');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card" id="profile">
      <div className="card-heading">
        <span className="step">03</span>
        <h2>Your profile</h2>
      </div>
      <span className="verified">✓ Email verified</span>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="name">Display name</label>
        <input
          id="name"
          autoComplete="nickname"
          required
          minLength={2}
          maxLength={60}
          value={name}
          disabled={loading || loadFailed}
          onChange={(e) => setName(e.target.value)}
        />
        <small>Between 2 and 60 characters. Your profile is currently private.</small>
        <Notice error={error} message={message} />
        {loadFailed ? (
          <button type="button" className="secondary" onClick={() => setAttempt((n) => n + 1)}>
            Retry loading profile
          </button>
        ) : (
          <button className="primary" disabled={busy || loading || name.trim().length < 2}>
            {loading ? 'Loading profile…' : busy ? 'Saving…' : 'Save profile'}
          </button>
        )}
      </form>
    </section>
  );
}
