import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { onIdTokenChanged, type User } from 'firebase/auth';
import { configuration, firebase } from './services/firebase';
import Shell from './app/Shell';
import Workspace from './app/Workspace';
import { currentPage } from './app/navigation';
import AuthForm from './pages/AuthPage';
import FeedbackPage from './pages/FeedbackPage';
import type { AdminPath } from './pages/AdminArea';
import Verification from './pages/VerificationPage';
import { clearDrafts } from './services/drafts';
import { recordVerification } from './services/insightEvents';

const AdminArea = lazy(() => import('./pages/AdminArea'));

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  useEffect(() => {
    if (!firebase) {
      setLoading(false);
      return;
    }
    let previousUid: string | undefined;
    return onIdTokenChanged(firebase.auth, (next) => {
      if (previousUid && previousUid !== next?.uid) clearDrafts(previousUid);
      previousUid = next?.uid;
      setUser(next);
      setVerified(next?.emailVerified ?? false);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (user && verified) void recordVerification(user).catch(() => {});
  }, [user, verified]);

  if (!configuration.ready)
    return (
      <Shell>
        <p className="eyebrow">DEVELOPMENT SETUP</p>
        <h1>Your workspace is ready to connect.</h1>
        <section className="card narrow">
          <h2>Connect Firebase to begin</h2>
          <p>
            Copy <code>frontend/.env.example</code> to <code>frontend/.env.local</code>, start the
            local emulators, then restart the development server.
          </p>
          <p className="notice">{configuration.reason}</p>
          <p>
            See <code>docs/SETUP.md</code> for local and Firebase Spark setup.
          </p>
        </section>
      </Shell>
    );
  const current = currentPage();
  const path = location.pathname.replace(/\/$/, '');
  if (
    !loading &&
    user &&
    verified &&
    ['/admin', '/admin/feedback', '/admin/overview'].includes(path)
  ) {
    return (
      <Suspense fallback={<p role="status">Loading admin workspace…</p>}>
        <AdminArea key={user.uid} user={user} path={path as AdminPath} />
      </Suspense>
    );
  }
  let content: ReactNode;

  if (loading) {
    content = <p role="status">Loading your workspace…</p>;
  } else if (path === '/feedback') {
    content = <FeedbackPage key={user?.uid ?? 'visitor'} user={user} />;
  } else if (!user || user.isAnonymous) {
    content = <AuthForm />;
  } else if (!verified) {
    content = <Verification user={user} onVerified={() => setVerified(true)} />;
  } else if (current) {
    content = <Workspace key={user.uid} user={user} current={current} />;
  } else {
    content = (
      <>
        <h1>Page not found</h1>
        <p>
          <a href="/feed">Return to your feed</a>
        </p>
      </>
    );
  }

  return (
    <Shell user={user} feedback={!loading}>
      {content}
    </Shell>
  );
}
