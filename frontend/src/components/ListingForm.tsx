import { useState, type FormEvent } from 'react';
import type { Company } from '../companies';
import { categories, postListing } from '../services/listings';

export type FormDraft = Record<string, string>;

export default function ListingForm({
  company,
  uid,
  drafts,
  busy,
  setBusy,
  setError,
  setNotice,
  onPublished,
}: {
  company: Pick<Company, 'id' | 'name'>;
  uid: string;
  drafts?: Map<string, FormDraft>;
  busy: boolean;
  setBusy: (value: boolean) => void;
  setError: (value: string) => void;
  setNotice: (value: string) => void;
  onPublished: () => void;
}) {
  const [formVersion, setFormVersion] = useState(0);
  const draft = drafts?.get(company.id);
  const [free, setFree] = useState(draft?.offer !== 'paid');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const value = (name: string) => String(fields.get(name) ?? '').trim();
    const title = value('title');
    const description = value('description');
    const pickup = value('pickup');
    const category = categories.find((item) => item === value('category'));
    const pricePaise = free ? 0 : Math.round(Number(value('price')) * 100);
    setNotice('');
    if (
      !title ||
      !description ||
      !pickup ||
      !category ||
      (!free && (!Number.isSafeInteger(pricePaise) || pricePaise < 1 || pricePaise > 100000000))
    ) {
      setError('Enter the item details and a valid price.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await postListing(company, uid, { title, description, category, pickup, pricePaise });
      drafts?.delete(company.id);
      setFormVersion((v) => v + 1);
      setFree(true);
      onPublished();
    } catch {
      setError('Could not publish the listing. Your draft is still here.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details
      className="compose"
      id="post-offer"
      open={window.location.hash === '#post-offer' ? true : undefined}
    >
      <summary>
        <span>Offer something to your community</span>
        <small>Free items, goods, and services</small>
      </summary>
      <p>Include a shared pickup point instead of a private address.</p>
      <form
        key={formVersion}
        onSubmit={submit}
        onChange={(event) => {
          const values = Object.fromEntries(new FormData(event.currentTarget)) as FormDraft;
          drafts?.set(company.id, values);
        }}
      >
        <label>
          Title
          <input name="title" defaultValue={draft?.title} maxLength={100} required />
        </label>
        <label>
          Description
          <textarea
            name="description"
            defaultValue={draft?.description}
            maxLength={1500}
            required
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue={draft?.category}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Offer type
          <select
            name="offer"
            value={free ? 'free' : 'paid'}
            onChange={(e) => setFree(e.target.value === 'free')}
          >
            <option value="free">Free</option>
            <option value="paid">For sale</option>
          </select>
        </label>
        {!free && (
          <label>
            Price (INR)
            <input
              name="price"
              defaultValue={draft?.price}
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              required
            />
          </label>
        )}
        <label>
          Pickup location
          <input name="pickup" defaultValue={draft?.pickup} maxLength={120} required />
        </label>
        <button className="primary" disabled={busy}>
          Publish listing
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            drafts?.delete(company.id);
            setFree(true);
            setFormVersion((v) => v + 1);
          }}
        >
          Discard draft
        </button>
      </form>
    </details>
  );
}
