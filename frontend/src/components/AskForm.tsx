import { useState, type FormEvent } from 'react';
import { Timestamp } from 'firebase/firestore';
import { categories, postListing } from '../services/listings';
import type { Company } from '../companies';
import { useDraft } from '../hooks/useDraft';
import Sheet from './Sheet';

export default function AskForm({
  company,
  uid,
  onPublished,
}: {
  company: Pick<Company, 'id' | 'name'>;
  uid: string;
  onPublished: () => void;
}) {
  const { draft, save, clear, message: draftMessage } = useDraft(uid, company.id, 'ask');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const title = String(fields.get('title') ?? '').trim();
    const description = String(fields.get('description') ?? '').trim();
    const category = categories.find((value) => value === fields.get('category'));
    const deadline = new Date(String(fields.get('deadline') ?? '')).getTime();
    setError('');
    setMessage('');
    if (
      !title ||
      !description ||
      !category ||
      !Number.isFinite(deadline) ||
      deadline <= Date.now() ||
      deadline > Date.now() + 30 * 86400000
    ) {
      setError('Describe what you need and choose a future deadline within 30 days.');
      return;
    }
    setBusy(true);
    try {
      await postListing(company, uid, {
        title,
        description,
        category,
        pricePaise: 0,
        pickup: '',
        askDeadline: Timestamp.fromMillis(deadline),
      });
      if (clear(true)) setVersion((value) => value + 1);
      setMessage('Your ask is posted. Follow replies in Requests or open your ask in the feed.');
      onPublished();
    } catch {
      setError('Could not post your ask. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet id="ask-circle" title="Ask my circle" composer busy={busy}>
      <p>
        Post a need in {company.name}. Members can offer to help before your deadline. Accept one
        helper to start a private conversation.
      </p>
      <form key={version} onSubmit={submit} onChange={(event) => save(event.currentTarget)}>
        <label>
          What do you need?
          <input
            name="title"
            maxLength={100}
            defaultValue={draft?.title}
            placeholder="Movie ticket help for Saturday"
            required
          />
        </label>
        <label>
          Details
          <textarea
            name="description"
            maxLength={1500}
            defaultValue={draft?.description}
            required
          />
        </label>
        <label>
          Reply by
          <input name="deadline" type="datetime-local" defaultValue={draft?.deadline} required />
        </label>
        <label>
          Ask category
          <select name="category" defaultValue={draft?.category ?? 'services'}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'goods' ? 'Goods' : 'Services'}
              </option>
            ))}
          </select>
        </label>
        <small>
          Your device’s local time. Choose a deadline within 30 days. New replies close at the
          deadline.
        </small>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <small aria-live="polite">{draftMessage}</small>
        <button className="primary" disabled={busy}>
          {busy ? 'Posting ask…' : 'Post my ask'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={() => {
            clear();
            setVersion((value) => value + 1);
            setError('');
            setMessage('');
          }}
        >
          Discard ask draft
        </button>
      </form>
    </Sheet>
  );
}
