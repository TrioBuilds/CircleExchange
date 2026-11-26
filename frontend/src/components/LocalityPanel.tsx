import { useEffect, useRef, useState } from 'react';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { firebase } from '../services/firebase';
import { hierarchy, matchLocation } from '../localities';
import Inbox from './Inbox';
import Listings from './Listings';
import type { FormDraft } from './ListingForm';
import { linkedListing } from '../listingLink';

export default function LocalityPanel({
  uid,
  page = 'feed',
}: {
  uid: string;
  page?: 'feed' | 'requests' | 'profile';
}) {
  const drafts = useRef(new Map<string, FormDraft>());
  const [primary, setPrimary] = useState('');
  const [feed, setFeed] = useState('');
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [inboxRevision, setInboxRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true;
    setError('');
    async function load() {
      if (!firebase) throw new Error();
      const snapshot = await getDocFromServer(doc(firebase.db, 'localityMemberships', uid));
      if (!active) return;
      const current = snapshot.data()?.areaId ?? '';
      const linkedBoard = page === 'feed' ? linkedListing()?.board : undefined;
      setPrimary(current);
      setFeed(hierarchy(current).some((area) => area.id === linkedBoard) ? linkedBoard! : current);
      setReady(true);
    }
    void load().catch(() => {
      if (active) setError('Could not load your locality.');
    });
    return () => {
      active = false;
    };
  }, [uid, attempt, page]);

  function locate() {
    setError('');
    setHint('');
    if (!navigator.geolocation) {
      setError(
        'Location is unavailable in this browser. Try a phone with location services enabled.',
      );
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 60000) {
          setError('The location reading is out of date. Please try again.');
          setBusy(false);
          return;
        }
        const match = matchLocation(coords.latitude, coords.longitude, coords.accuracy);
        if (match.status === 'outside') {
          setHint(
            'CircleExchange hasn’t launched in your area yet. Local circles are currently available only in parts of Baner, Pune.',
          );
          setBusy(false);
          return;
        }
        if (match.status === 'uncertain') {
          setError(
            'Your location reading is too imprecise or overlaps the edge of our coverage. Try again outdoors with precise location enabled.',
          );
          setBusy(false);
          return;
        }
        const area = match.area;
        void setDoc(doc(firebase!.db, 'localityMemberships', uid), { areaId: area.id })
          .then(() => {
            setPrimary(area.id);
            setFeed(area.id);
            setEditing(false);
            setHint('Your circle is ready: ' + area.name + '.');
          })
          .catch(() => setError('Could not save your circle. Please try again.'))
          .finally(() => setBusy(false));
      },
      (failure) => {
        setBusy(false);
        setError(
          failure.code === 1
            ? 'Location access was denied. Allow location for this site in your browser settings, then try again.'
            : failure.code === 3
              ? 'The location check timed out. Try again with location services enabled.'
              : 'Your device could not find its location. Try again outdoors with location services enabled.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const permitted = hierarchy(primary);
  const selected = permitted.find((area) => area.id === feed);
  const link = page === 'feed' ? linkedListing() : null;
  return (
    <section aria-label="Locality community">
      <h2>{primary ? 'Your locality community' : 'Local community setup'}</h2>
      {error && <p role="alert">{error}</p>}
      {hint && <p role="status">{hint}</p>}
      {!ready ? (
        error ? (
          <button onClick={() => setAttempt((n) => n + 1)}>Retry</button>
        ) : (
          <p>Loading locality…</p>
        )
      ) : !primary || editing ? (
        <>
          <h3>Find your local circle</h3>
          <p>
            Tap Find my circle to check whether a local community is available where you are. Your
            browser will ask for location access if needed.
          </p>
          <p>
            Current service coverage: parts of Baner, Pune. We’ll check your location when you tap
            the button below.
          </p>
          <p>
            Your coordinates are processed on this device. If a circle is available, we save its
            community ID to your account.
          </p>
          {primary && (
            <p>
              Changing your circle can remove access to requests and conversations in your previous
              community.
            </p>
          )}
          <button className="primary" disabled={busy} onClick={locate}>
            {busy ? 'Finding your circle…' : 'Find my circle'}
          </button>
          {busy && <p role="status">Checking your location and saving your circle…</p>}
          {primary && (
            <button disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </>
      ) : (
        <>
          <p>
            Your circle: <strong>{permitted.map((area) => area.name).join(' → ')}</strong>
          </p>
          {page === 'feed' && link && !permitted.some((area) => area.id === link.board) && (
            <p role="alert">
              This listing is outside your selected community.{' '}
              <a href="/feed">Return to your feed</a>
            </p>
          )}
          {!link && page === 'profile' && (
            <button
              onClick={() => {
                setError('');
                setHint('');
                setEditing(true);
              }}
            >
              Check my location again
            </button>
          )}
          {page === 'feed' && !link && (
            <label>
              Community feed
              <select value={feed} onChange={(e) => setFeed(e.target.value)}>
                {permitted.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {page === 'feed' && selected && (!link || link.board === selected.id) && (
            <Listings
              inboxRevision={inboxRevision}
              key={selected.id}
              company={selected}
              uid={uid}
              drafts={drafts.current}
            />
          )}
          {page === 'requests' && (
            <Inbox
              onDecision={() => setInboxRevision((n) => n + 1)}
              key={'inbox:' + primary}
              uid={uid}
              boards={permitted}
            />
          )}
        </>
      )}
    </section>
  );
}
