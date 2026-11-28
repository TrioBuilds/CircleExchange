import { useState, type ReactNode } from 'react';
import { signOut, type User } from 'firebase/auth';
import { firebase } from '../services/firebase';
import { friendlyError } from '../errors';
import { currentPage, openPost } from './navigation';
import FeedbackComposer from '../components/FeedbackComposer';
import AdminLink from '../components/AdminLink';

export default function Shell({
  children,
  user,
  feedback,
}: {
  children: ReactNode;
  user?: User | null;
  feedback?: boolean;
}) {
  const [error, setError] = useState('');
  const signedIn = !!user?.emailVerified;
  const current = currentPage();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/feed" aria-label="CircleExchange home">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M4 14c2-6 7-9 14-9h9m0 0-5-4m5 4-5 4M28 18c-2 6-7 9-14 9H5m0 0 5 4m-5-4 5-4"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            Circle<span className="brand-light">Exchange</span>
          </span>
        </a>
        {signedIn && (
          <nav className="desktop-nav" aria-label="Primary">
            <a href="/feed" aria-current={current === 'feed' ? 'page' : undefined}>
              Feed
            </a>
            <a href="/requests" aria-current={current === 'requests' ? 'page' : undefined}>
              Requests
            </a>
            <a href="/profile" aria-current={current === 'profile' ? 'page' : undefined}>
              Profile
            </a>
            <button className="primary" onClick={openPost}>
              Post an offer
            </button>
          </nav>
        )}
      </header>
      <main id="main-content">
        <div className="content">
          {user && !user.isAnonymous && (
            <div className="session">
              <span>{user.email}</span>
              {current === 'profile' && signedIn && <AdminLink key={user.uid} user={user} />}
              <button
                className="text-button"
                onClick={() => {
                  setError('');
                  void signOut(firebase!.auth).catch((err: unknown) =>
                    setError(friendlyError(err)),
                  );
                }}
              >
                Sign out
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
          {children}
        </div>
        <footer>
          CircleExchange
          {feedback ? (
            <FeedbackComposer
              key={user?.isAnonymous ? 'guest' : (user?.uid ?? 'guest')}
              user={user ?? null}
            />
          ) : (
            <span>Good things, within your circle.</span>
          )}
        </footer>
      </main>
      {signedIn && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <a href="/feed" aria-current={current === 'feed' ? 'page' : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m3 11 9-7 9 7v9H3zM9 20v-6h6v6" />
            </svg>
            Feed
          </a>
          <a href="/requests" aria-current={current === 'requests' ? 'page' : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 5h16v12H8l-4 3z" />
            </svg>
            Requests
          </a>
          <button onClick={openPost}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
            Post
          </button>
          <a href="/profile" aria-current={current === 'profile' ? 'page' : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
            </svg>
            Profile
          </a>
        </nav>
      )}
    </div>
  );
}
