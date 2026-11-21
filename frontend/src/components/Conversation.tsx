import { useEffect, useState, type FormEvent } from 'react';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { firebase } from '../services/firebase';

type Message = { id: string; senderId: string; text: string };

export default function Conversation({
  board,
  listingId,
  uid,
}: {
  board: string;
  listingId: string;
  uid: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebase) return;
    const messagesRef = collection(
      firebase.db,
      'communities',
      board,
      'listings',
      listingId,
      'messages',
    );
    return onSnapshot(
      query(messagesRef, orderBy('createdAt', 'desc'), limit(30)),
      (snapshot) => {
        setMessages(
          snapshot.docs
            .map((message) => ({
              id: message.id,
              senderId: String(message.data().senderId),
              text: String(message.data().text),
            }))
            .reverse(),
        );
        setError('');
      },
      () => setError('Could not load messages. Try reopening the conversation.'),
    );
  }, [board, listingId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!firebase || !body || body.length > 1000) return;
    setBusy(true);
    setError('');
    try {
      await addDoc(
        collection(firebase.db, 'communities', board, 'listings', listingId, 'messages'),
        { senderId: uid, text: body, createdAt: serverTimestamp() },
      );
      setText('');
    } catch {
      setError('Could not send your message. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Private conversation">
      <h4>Private conversation</h4>
      <p>
        Only the accepted buyer and seller can read these messages. Arrange a shared pickup point
        here.
      </p>
      {error && <p role="alert">{error}</p>}
      <ol aria-label="Messages">
        {messages.map((message) => (
          <li key={message.id}>
            <strong>{message.senderId === uid ? 'You' : 'Other member'}:</strong> {message.text}
          </li>
        ))}
      </ol>
      {!messages.length && !error && <p>No messages yet.</p>}
      <form onSubmit={send}>
        <label>
          Message
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={1000}
            required
          />
        </label>
        <button disabled={busy || !text.trim() || text.trim().length > 1000}>Send message</button>
      </form>
    </section>
  );
}
