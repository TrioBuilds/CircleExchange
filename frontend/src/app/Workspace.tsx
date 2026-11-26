import type { User } from 'firebase/auth';
import CompanyPanel from '../components/CompanyPanel';
import { linkedListing } from '../listingLink';
import { isPersonalEmail } from '../companies';
import ProfilePage from '../pages/ProfilePage';
import { openPost, openAsk, type Page } from './navigation';

export default function Workspace({ user, current }: { user: User; current: Page }) {
  const listingLink = current === 'feed' && linkedListing();
  return (
    <>
      {listingLink ? (
        <>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>An exchange in your circle.</h1>
          <p className="intro">View this listing and its replies in your community.</p>
        </>
      ) : current === 'feed' ? (
        <section className="hero">
          <div>
            <p className="eyebrow">YOUR CIRCLE, YOUR PEOPLE</p>
            <h1>
              {isPersonalEmail(user.email)
                ? 'Good things, close to home.'
                : 'Good things, within your circle.'}
            </h1>
            <p>Find offers, ask for help, and share with your community.</p>
            <div className="hero-actions">
              <button className="hero-post" onClick={openPost}>
                Post an offer <span aria-hidden="true">→</span>
              </button>
              <button className="secondary" onClick={openAsk}>
                Ask my circle
              </button>
            </div>
          </div>
          <span className="hero-art" aria-hidden="true" />
        </section>
      ) : (
        <>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>{current === 'requests' ? 'Your requests.' : 'Your profile.'}</h1>
          <p className="intro">
            {current === 'requests'
              ? 'Keep conversations and decisions in one place.'
              : 'Manage your details and community.'}
          </p>
        </>
      )}
      <div className="profile-stack">
        {current === 'profile' && <ProfilePage user={user} />}
        <CompanyPanel
          key={user.uid + user.email}
          uid={user.uid}
          email={user.email}
          page={current}
        />
      </div>
    </>
  );
}
