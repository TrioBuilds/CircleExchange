import { useEffect, useRef, useState } from 'react';
import {
  decide,
  myInterest,
  requestInterest,
  requestNames,
  type InterestStatus,
  type InterestReply,
} from '../services/interest';
import type { Listing } from '../services/listings';
import Conversation from './Conversation';

export default function Interest({
  board,
  item,
  uid,
  refresh,
  autoLoad = false,
}: {
  board: string;
  item: Listing;
  uid: string;
  refresh: () => void;
  autoLoad?: boolean;
}) {
  const owner = uid === item.ownerId;
  const isAsk = !!item.askDeadline;
  const expired = !!item.askDeadline && item.askDeadline.toMillis() <= Date.now();
  const acceptingReplies = item.status === 'available' && !expired;
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<InterestStatus>();
  const [requests, setRequests] = useState<InterestReply[]>([]);
  const [conversationOpen, setConversationOpen] = useState(false);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch {
      setError('Could not complete this action. Refresh requests and try again.');
    } finally {
      setBusy(false);
    }
  }
  async function load() {
    if (owner)
      setRequests(
        await requestNames(board, item.id, item.status === 'available' ? 'pending' : 'accepted'),
      );
    else {
      const next = await myInterest(board, item.id, uid);
      setStatus(next);
      if (next !== 'pending') setSent(false);
    }
    setLoaded(true);
  }
  useEffect(() => {
    if (autoLoad || loaded) void run(load);
  }, [autoLoad, item.status]);
  useEffect(() => {
    const receipt = confirmation.current;
    if (sent && receipt && !receipt.closest('dialog:not([open])'))
      receipt.focus({ preventScroll: true });
  }, [sent]);
  return (
    <div>
      <button disabled={busy} onClick={() => void run(load)}>
        {loaded
          ? 'Refresh requests'
          : owner
            ? isAsk
              ? 'View helpers'
              : 'View interest requests'
            : isAsk
              ? 'View my reply'
              : 'View my interest'}
      </button>
      {error && <p role="alert">{error}</p>}
      {loaded &&
        owner &&
        acceptingReplies &&
        (requests.length ? (
          requests.map((request) => (
            <div key={request.uid}>
              <strong>{request.name}</strong>
              {(isAsk || request.note) && (
                <p className="reply-note">{request.note || 'This earlier reply has no note.'}</p>
              )}
              {['Accept', 'Decline'].map((choice) => (
                <button
                  key={choice}
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await decide(board, item.id, request.uid, choice === 'Accept');
                      if (choice === 'Accept') {
                        setRequests([request]);
                        refresh();
                      } else await load();
                    })
                  }
                >
                  {choice}
                </button>
              ))}
            </div>
          ))
        ) : (
          <p>No pending requests.</p>
        ))}
      {loaded && owner && item.status !== 'available' && (
        <p>
          {requests[0]
            ? (isAsk ? 'Accepted helper: ' : 'Accepted buyer: ') + requests[0].name
            : 'No accepted request.'}
        </p>
      )}
      {loaded && owner && item.status !== 'available' && requests[0]?.note && (
        <p className="reply-note">{requests[0].note}</p>
      )}
      {loaded &&
        !owner &&
        (status && !sent ? (
          <p>
            {isAsk ? 'Your reply: ' : 'Your request: '}
            {status === 'pending' && !acceptingReplies
              ? isAsk
                ? 'ask closed'
                : 'offer closed'
              : status}
          </p>
        ) : (
          (acceptingReplies || sent) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (busy || sent) return;
                setSending(true);
                void run(async () => {
                  if (isAsk) await requestInterest(board, item.id, uid, name, note);
                  else await requestInterest(board, item.id, uid, name);
                  setStatus('pending');
                  setSent(true);
                }).finally(() => setSending(false));
              }}
            >
              <label>
                {isAsk ? 'Name to share with the person asking' : 'Name to share with the seller'}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={60}
                  readOnly={sending || sent}
                />
              </label>
              {isAsk && (
                <>
                  <label>
                    How can you help?
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={500}
                      required
                      readOnly={sending || sent}
                      aria-describedby={'reply-help-' + item.id}
                    />
                  </label>
                  <small id={'reply-help-' + item.id}>
                    Describe your help, availability, and any fee. Only you and the person asking
                    can read this reply.
                  </small>
                </>
              )}
              <div className="request-action">
                {sent ? (
                  <p
                    className="request-confirmation"
                    ref={confirmation}
                    role="status"
                    tabIndex={-1}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                    {isAsk ? 'Reply sent.' : 'Request sent.'} Follow up in Requests.
                  </p>
                ) : (
                  <button
                    className="primary"
                    disabled={busy || !name.trim() || (isAsk && !note.trim())}
                    data-sending={sending || undefined}
                  >
                    {sending ? 'Sending…' : isAsk ? 'I can help' : 'I’m interested'}
                  </button>
                )}
              </div>
            </form>
          )
        ))}
      {loaded && (owner ? !!requests[0] && item.status !== 'available' : status === 'accepted') && (
        <>
          <button onClick={() => setConversationOpen((open) => !open)}>
            {conversationOpen ? 'Close conversation' : 'Open conversation'}
          </button>
          {conversationOpen && (
            <Conversation board={board} listingId={item.id} uid={uid} isOwner={owner} />
          )}
        </>
      )}
    </div>
  );
}
