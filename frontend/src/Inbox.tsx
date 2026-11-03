import { useEffect, useRef, useState } from 'react';
import { firebase } from './services/firebase';
import { decide } from './services/interest';
import { inboxPages, type Board, type Entry, type Folder } from './services/inbox';

export default function Inbox({ boards, uid, onDecision }: { boards: Board[]; uid: string; onDecision?: () => void }) {
  const [folder,setFolder] = useState<Folder>('Received');
  const [open,setOpen] = useState(false);
  const [entries,setEntries] = useState<Entry[]>([]);
  const [busy,setBusy] = useState(false);
  const [done,setDone] = useState(false);
  const [error,setError] = useState('');
  const reader = useRef<ReturnType<typeof inboxPages> | null>(null);
  useEffect(() => () => { reader.current = null; }, []);

  async function read(stream: ReturnType<typeof inboxPages>, first: boolean) {
    setError('');
    setBusy(true);
    try {
      const page = await stream.next();
      if (reader.current !== stream) return;
      setDone(!!page.done);
      const rows = page.value ?? [];
      setEntries(previous => [...(first ? [] : previous), ...rows].sort((a,b)=>b.createdAt-a.createdAt));
    } catch {
      if (reader.current === stream) { setDone(true); setError('Could not load requests. Refresh the inbox to try again.'); }
    } finally { if (reader.current === stream) setBusy(false); }
  }
  function start(next: Folder) {
    if (!firebase) return;
    setOpen(true); setFolder(next); setEntries([]); setDone(false);
    const stream = inboxPages(firebase.db,boards,uid,next);
    reader.current = stream;
    void read(stream,true);
  }
  async function respond(row: Entry, accept: boolean) {
    setBusy(true); setError('');
    try {
      await decide(row.board.id,row.listingId,row.buyer,accept);
      onDecision?.();
      setEntries(previous => previous.map(other => {
        if (other.board.id !== row.board.id || other.listingId !== row.listingId) return other;
        return {...other, available: !accept && other.available,
          status: other.buyer === row.buyer ? (accept ? 'accepted' : 'declined') : other.status};
      }));
    } catch { setError('Could not update that request. Refresh to check its current status.'); }
    finally { setBusy(false); }
  }
  return <section aria-label="Requests inbox"><h2>Requests inbox</h2>
    {(['Received','Sent'] as const).map(tab => <button key={tab} disabled={busy}
      aria-pressed={open && folder === tab} onClick={()=>start(tab)}>{tab}</button>)}
    {open && <>
      <button disabled={busy} onClick={()=>start(folder)}>Refresh inbox</button>
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">Loading…</p>}
      {!busy && !entries.length && !error && <p>{done ? 'No requests.' : 'No requests in this batch.'}</p>}
      {entries.map(row => <article key={[row.board.id,row.listingId,row.buyer].join('/')}>
        <h3>{row.title}</h3><p>{row.board.name}{folder === 'Received' && ' · ' + row.name}</p>
        <strong>{row.status === 'pending' && !row.available ? 'Offer closed' :
          row.status.charAt(0).toUpperCase()+row.status.slice(1)}</strong>
        {folder === 'Received' && row.available && row.status === 'pending' && <>
          <button disabled={busy} onClick={()=>void respond(row,true)}>Accept</button>
          <button disabled={busy} onClick={()=>void respond(row,false)}>Decline</button>
        </>}
      </article>)}
      {!done && <button disabled={busy} onClick={()=>reader.current && void read(reader.current,false)}>Load more requests</button>}
    </>}
  </section>;
}
