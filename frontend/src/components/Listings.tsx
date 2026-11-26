import { useEffect, useState } from 'react';
import ListingCard from './ListingCard';
import ListingForm, { type FormDraft } from './ListingForm';
import AskForm from './AskForm';
import { openAsk } from '../app/navigation';
import type { Company } from '../companies';
import { linkedListing, listingUrl } from '../listingLink';
import {
  categories,
  loadListing,
  loadListings,
  markExchanged,
  type Listing,
  type Page,
} from '../services/listings';

export default function Listings({
  company,
  uid,
  drafts,
  inboxRevision = 0,
}: {
  company: Pick<Company, 'id' | 'name'>;
  uid: string;
  inboxRevision?: number;
  drafts?: Map<string, FormDraft>;
}) {
  const link = linkedListing();
  const linkedId = link?.board === company.id ? link.listing : '';
  const [page, setPage] = useState<Page | null>(null);
  const [linkedItem, setLinkedItem] = useState<Listing | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [category, setCategory] = useState<'' | (typeof categories)[number]>('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setPage(null);
    setLinkedItem(null);
    (linkedId ? loadListing(company, linkedId) : loadListings(company, category || undefined))
      .then((result) => {
        if (!active) return;
        if (linkedId) setLinkedItem(result as Listing | null);
        else setPage(result as Page);
      })
      .catch(() => {
        if (active)
          setError(
            linkedId
              ? 'This listing is unavailable or outside your community.'
              : 'Could not load listings. Refresh the feed to try again.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [company, category, linkedId, revision, inboxRevision]);

  function refresh() {
    setError('');
    setRevision((value) => value + 1);
  }

  async function more() {
    if (!page?.next) return;
    setBusy(true);
    setError('');
    try {
      const next = await loadListings(company, category || undefined, page.next);
      setPage({ items: [...page.items, ...next.items], next: next.next });
    } catch {
      setError('Could not load more listings. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function exchange(id: string) {
    setBusy(true);
    setError('');
    try {
      await markExchanged(company, id);
      setNotice('Listing closed.');
      refresh();
    } catch {
      setError('Could not update this listing. Refresh and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(id: string) {
    try {
      await navigator.clipboard.writeText(listingUrl(company.id, id));
      setNotice('Link copied.');
    } catch {
      setError('Could not copy the link. Copy it from your address bar instead.');
    }
  }

  if (linkedId)
    return (
      <section aria-label="Listing details" className="listing-page">
        <a href="/feed">← Back to your feed</a>
        {loading && <p role="status">Loading listing…</p>}
        {!loading && !linkedItem && (
          <p role="alert">{error || 'This listing is no longer available.'}</p>
        )}
        {linkedItem && (
          <ListingCard
            item={linkedItem}
            board={company.id}
            uid={uid}
            busy={busy}
            focused
            exchange={exchange}
            copyLink={copyLink}
            refresh={refresh}
          />
        )}
        {notice && <p role="status">{notice}</p>}
        {error && linkedItem && <p role="alert">{error}</p>}
      </section>
    );

  return (
    <section aria-label="Community listings" id="feed">
      <div className="feed-heading">
        <div>
          <p className="eyebrow">EXPLORE YOUR CIRCLE</p>
          <h2>{company.name} listings</h2>
        </div>
        <button className="secondary" disabled={busy || loading} onClick={refresh}>
          Refresh feed
        </button>
        <button className="primary" onClick={openAsk}>
          Ask my circle
        </button>
      </div>
      <fieldset className="feed-filter">
        <legend>Filter by category</legend>
        <div className="filter-options">
          <button type="button" aria-pressed={!category} onClick={() => setCategory('')}>
            All
          </button>
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>
      {loading && <p role="status">Loading listings…</p>}
      {page?.items.length === 0 && (
        <p className="feed-empty">
          {category
            ? `No ${category} listings yet. Try another category.`
            : 'No listings yet. Be the first to offer something useful.'}
        </p>
      )}
      <div className="listing-grid">
        {page?.items.map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            board={company.id}
            uid={uid}
            busy={busy}
            exchange={exchange}
            copyLink={copyLink}
            refresh={refresh}
          />
        ))}
      </div>
      {page?.next && (
        <button disabled={busy} onClick={() => void more()}>
          Load more listings
        </button>
      )}
      <ListingForm
        key={company.id}
        company={company}
        uid={uid}
        drafts={drafts}
        busy={busy}
        setBusy={setBusy}
        setError={setError}
        setNotice={setNotice}
        onPublished={() => {
          setNotice('Listing published.');
          refresh();
        }}
      />
      <AskForm
        key={'ask:' + company.id}
        company={company}
        uid={uid}
        drafts={drafts}
        onPublished={refresh}
      />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
