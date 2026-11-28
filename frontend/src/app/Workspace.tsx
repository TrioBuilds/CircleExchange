import type { User } from 'firebase/auth';
import CompanyPanel from '../components/CompanyPanel';
import { linkedListing } from '../listingLink';
import { isPersonalEmail } from '../companies';
import ProfilePage from '../pages/ProfilePage';
import { openAsk, type Page } from './navigation';

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
        <section className="circle-hero">
          <div>
            <h1>What do you need?</h1>
            <p>
              {isPersonalEmail(user.email)
                ? 'See who’s looking for a benefit nearby.'
                : 'See who’s looking for a benefit in your work circle.'}
            </p>
          </div>
          <button className="primary" onClick={openAsk}>
            Ask my circle
          </button>
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
