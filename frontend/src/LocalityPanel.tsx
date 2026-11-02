import { useEffect, useState } from 'react';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { firebase } from './services/firebase';
import { areas, hierarchy, suggestArea } from './localities';
import Listings from './Listings';

export default function LocalityPanel({ uid }: { uid: string }) {
  const [primary, setPrimary] = useState('');
  const [choice, setChoice] = useState('');
  const [feed, setFeed] = useState('');
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
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
      setPrimary(current); setFeed(current); setChoice(current); setReady(true);
    }
    void load().catch(() => { if (active) setError('Could not load your locality.'); });
    return () => { active = false; };
  }, [uid, attempt]);

  function locate() {
    if (!navigator.geolocation) { setHint('Location is unavailable. Choose your area below.'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const area = suggestArea(coords.latitude, coords.longitude, coords.accuracy);
      if (area) setChoice(area.id);
      setHint(area ? 'Nearby available area: ' + area.name + '. Choose your apartment if listed, then confirm.' :
        'No confident match in the pilot. Choose your area if it is listed.');
      setBusy(false);
    }, () => { setBusy(false); setHint('Location was unavailable. Choose your area manually.'); },
    { timeout: 10000, maximumAge: 0 });
  }

  async function confirm() {
    if (!firebase || !hierarchy(choice).length) return;
    setBusy(true); setError('');
    try {
      await setDoc(doc(firebase.db, 'localityMemberships', uid), { areaId: choice });
      setPrimary(choice); setFeed(choice); setEditing(false); setHint('');
    } catch { setError('Could not save your locality. Please try again.'); }
    finally { setBusy(false); }
  }

  const permitted = hierarchy(primary);
  const selected = permitted.find(area => area.id === feed);
  return <section aria-label="Locality community">
    <h2>Your locality community</h2>
    {error && <p role="alert">{error}</p>}
    {!ready ? error ? <button onClick={() => setAttempt(n => n + 1)}>Retry</button> : <p>Loading locality…</p> :
      !primary || editing ? <>
        <p>Our Pune pilot includes Alacrity Apartment in Baner. Choose the most specific community you belong to.</p>
        <p>Your location is used on this device to suggest an area. We save only your confirmed community.</p>
        <button disabled={busy} onClick={locate}>Use my current location</button>
        {hint && <p role="status">{hint}</p>}
        <label>Choose my locality manually<select disabled={busy} value={choice} onChange={e => setChoice(e.target.value)}>
          <option value="">Select your area</option>
          {areas.map(area => <option key={area.id} value={area.id}>{hierarchy(area.id).map(a => a.name).join(' → ')}</option>)}
        </select></label>
        <button disabled={busy || !choice} onClick={confirm}>Confirm locality</button>
        {primary && <button disabled={busy} onClick={() => setEditing(false)}>Cancel</button>}
      </> : <>
        <p>Self-selected locality: {permitted.map(area => area.name).join(' → ')}</p>
        <button onClick={() => { setChoice(primary); setEditing(true); }}>Change locality</button>
        <label>Community feed<select value={feed} onChange={e => setFeed(e.target.value)}>
          {permitted.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
        </select></label>
        {selected && <Listings key={selected.id} company={selected} uid={uid} />}
      </>}
  </section>;
}
