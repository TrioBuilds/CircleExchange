import { useEffect, useState, type FormEvent } from 'react';
import Interest from './Interest';
import type { Company } from './companies';
import { categories, loadListings, markExchanged, postListing, type Page } from './services/listings';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export type FormDraft = Record<string, string>;

export default function Listings({ company, uid, drafts, inboxRevision = 0 }: { company: Pick<Company, 'id' | 'name'>; uid: string; inboxRevision?: number; drafts?: Map<string, FormDraft> }) {
  const [page, setPage] = useState<Page | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formVersion,setFormVersion] = useState(0);
  const draft = drafts?.get(company.id);
  const [free, setFree] = useState(draft?.offer !== "paid");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPage(null);
    loadListings(company).then(result => {
      if (active) setPage(result);
    }).catch(() => {
      if (active) setError('Could not load listings. Refresh the feed to try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [company, revision, inboxRevision]);

  function refresh() {
    setError('');
    setRevision(value => value + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const value = (name: string) => String(fields.get(name) ?? '').trim();
    const title = value('title'), description = value('description'), pickup = value('pickup');
    const category = categories.find(item => item === value('category'));
    const pricePaise = free ? 0 : Math.round(Number(value('price')) * 100);
    setNotice('');
    if (!title || !description || !pickup || !category || (!free && (!Number.isSafeInteger(pricePaise) || pricePaise < 1 || pricePaise > 100000000))) {
      setError('Enter the item details and a valid price.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await postListing(company, uid, { title, description, category, pickup, pricePaise });
      drafts?.delete(company.id);
      setFormVersion(v=>v+1);
      setFree(true);
      setNotice('Listing published.');
      refresh();
    } catch { setError('Could not publish the listing. Your draft is still here.'); }
    finally { setBusy(false); }
  }

  async function more() {
    if (!page?.next) return;
    setBusy(true);
    setError('');
    try {
      const next = await loadListings(company, page.next);
      setPage({ items: [...page.items, ...next.items], next: next.next });
    } catch { setError('Could not load more listings. Try again.'); }
    finally { setBusy(false); }
  }

  async function exchange(id: string) {
    setBusy(true);
    setError('');
    try {
      await markExchanged(company, id);
      setNotice('Listing marked as exchanged.');
      refresh();
    } catch { setError('Could not update this listing. Refresh and try again.'); }
    finally { setBusy(false); }
  }

  return <section aria-label="Community listings">
    <div className="feed-heading"><div><p className="eyebrow">EXPLORE YOUR CIRCLE</p><h2>{company.name} listings</h2></div><button className="secondary" disabled={busy || loading} onClick={refresh}>Refresh feed</button></div>
    {loading && <p role="status">Loading listings…</p>}
    {page?.items.length === 0 && <p className="feed-empty">No listings yet. Be the first to offer something useful.</p>}
    <div className="listing-grid">{page?.items.map(item => <details className="listing-card" key={item.id}>
      <summary><span className="listing-title">{item.title}</span><span className="listing-meta"><span>{item.pricePaise === 0 ? 'Free' : currency.format(item.pricePaise / 100)}</span><span className="status-tag">{item.status}</span></span></summary>
      <p>{item.description}</p><p>{item.category} · Pickup at {item.pickup}</p>
      {item.ownerId === uid && item.status !== 'exchanged' &&
        <button disabled={busy} onClick={() => void exchange(item.id)}>Mark exchanged</button>}
      <Interest board={company.id} item={item} uid={uid} refresh={refresh} />
    </details>)}</div>
    {page?.next && <button disabled={busy} onClick={() => void more()}>Load more listings</button>}
    <details className="compose" key={company.id}>
      <summary><span>Offer something to your community</span><small>Free items, goods, and services</small></summary>
      <p>Include a shared pickup point instead of a private address.</p>
      <form key={formVersion} onSubmit={submit} onChange={event => {
      const values = Object.fromEntries(new FormData(event.currentTarget)) as FormDraft;
      drafts?.set(company.id, values);
    }}>
      <label>Title<input name="title" defaultValue={draft?.title} maxLength={100} required /></label>
      <label>Description<textarea name="description" defaultValue={draft?.description} maxLength={1500} required /></label>
      <label>Category<select name="category" defaultValue={draft?.category}>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Offer type<select name="offer" value={free ? 'free' : 'paid'} onChange={e => setFree(e.target.value === 'free')}>
        <option value="free">Free</option><option value="paid">For sale</option>
      </select></label>
      {!free && <label>Price (INR)<input name="price" defaultValue={draft?.price} type="number" min="0.01" max="1000000" step="0.01" required /></label>}
      <label>Pickup location<input name="pickup" defaultValue={draft?.pickup} maxLength={120} required /></label>
      <button className="primary" disabled={busy}>Publish listing</button>
      <button type="button" disabled={busy} onClick={() => {
        drafts?.delete(company.id);
        setFree(true);
        setFormVersion(v => v + 1);
      }}>Discard draft</button>
      </form>
    </details>
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
