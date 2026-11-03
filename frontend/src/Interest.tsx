import { useState } from 'react';
import { decide, myInterest, requestInterest, requestNames, type InterestStatus } from './services/interest';
import type { Listing } from './services/listings';

export default function Interest({board,item,uid,refresh}:{board:string;item:Listing;uid:string;refresh:()=>void}) {
  const owner = uid === item.ownerId;
  const [loaded,setLoaded] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [name,setName] = useState('');
  const [status,setStatus] = useState<InterestStatus>();
  const [requests,setRequests] = useState<{uid:string;name:string}[]>([]);
  async function run(action:()=>Promise<void>) {
    setBusy(true); setError('');
    try { await action(); } catch { setError('Could not complete this action. Refresh requests and try again.'); }
    finally { setBusy(false); }
  }
  async function load() {
    if (owner) setRequests(await requestNames(board,item.id,item.status === 'available' ? 'pending' : 'accepted'));
    else setStatus(await myInterest(board,item.id,uid));
    setLoaded(true);
  }
  return <div>
    <button disabled={busy} onClick={() => void run(load)}>{loaded ? 'Refresh requests' : owner ? 'View interest requests' : 'View my interest'}</button>
    {error && <p role="alert">{error}</p>}
    {loaded && owner && item.status === 'available' && (requests.length ? requests.map(request =>
      <div key={request.uid}><strong>{request.name}</strong>
        {['Accept','Decline'].map(choice => <button key={choice} disabled={busy} onClick={() => void run(async () => {
          await decide(board,item.id,request.uid,choice === 'Accept');
          if (choice === 'Accept') refresh(); else await load();
        })}>{choice}</button>)}</div>) : <p>No pending requests.</p>)}
    {loaded && owner && item.status !== 'available' && <p>{requests[0] ? 'Accepted buyer: ' + requests[0].name : 'No accepted request.'}</p>}
    {loaded && !owner && (status ? <p>Your request: {status === 'pending' && item.status !== 'available' ? 'offer closed' : status}</p> :
      item.status === 'available' && <form onSubmit={e => { e.preventDefault(); void run(async () => {
        await requestInterest(board,item.id,uid,name); setStatus('pending');
      }); }}>
        <label>Name to share with the seller<input value={name} onChange={e=>setName(e.target.value)} required maxLength={60}/></label>
        <button disabled={busy || !name.trim()}>I’m interested</button>
      </form>)}
  </div>;
}
