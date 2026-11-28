import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import ListingCard from './ListingCard';
import ListingForm from './ListingForm';
import AskForm from './AskForm';
import { openPost } from '../app/navigation';
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

const feedTypes = ['Everything', 'Offers', 'Asks'] as const;
type FeedType = (typeof feedTypes)[number];

export default function Listings({
  company,
  uid,
  inboxRevision = 0,
}: {
  company: Pick<Company, 'id' | 'name'>;
  uid: string;
  inboxRevision?: number;
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
  const [type, setType] = useState<FeedType>('Everything');
  const selectedType = useRef<FeedType>('Everything');
  const transition = useRef<ViewTransition>(null);
  const loadGeneration = useRef(0);

  useEffect(() => {
    let active = true;
    loadGeneration.current += 1;
    setLoading(true);
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

  useEffect(
    () => () => {
      transition.current?.skipTransition();
      transition.current = null;
    },
    [],
  );

  function refresh() {
    setError('');
    setRevision((value) => value + 1);
  }

  async function more() {
    if (!page?.next) return;
    const generation = loadGeneration.current;
    setBusy(true);
    setError('');
    try {
      const next = await loadListings(company, category || undefined, page.next);
      if (generation === loadGeneration.current) {
        setPage((current) =>
          current === page ? { items: [...page.items, ...next.items], next: next.next } : current,
        );
      }
    } catch {
      if (generation === loadGeneration.current)
        setError('Could not load more listings. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function changeCategory(value: typeof category) {
    if (value === category) return;
    setPage(null);
    setLoading(true);
    setError('');
    setCategory(value);
  }

  function changeType(value: FeedType) {
    if (value === selectedType.current) return;
    selectedType.current = value;
    transition.current?.skipTransition();
    if (
      !document.startViewTransition ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setType(value);
      return;
    }
    const next = document.startViewTransition(() => {
      if (transition.current === next && selectedType.current === value)
        flushSync(() => setType(value));
    });
    transition.current = next;
    const finish = () => {
      if (transition.current === next) transition.current = null;
    };
    void next.finished.then(finish, finish);
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

  const filtered = page?.items.filter(
    (item) => type === 'Everything' || Boolean(item.askDeadline) === (type === 'Asks'),
  );

  return (
    <section aria-label="Community listings" id="feed">
      <div className="feed-heading">
        <div>
          <h2>{company.name} listings</h2>
        </div>
        <button className="secondary" disabled={busy || loading} onClick={refresh}>
          {loading && page ? 'Refreshing…' : 'Refresh feed'}
        </button>
      </div>
      <div className="feed-toolbar">
        <div
          className="feed-types"
          role="group"
          aria-label="Filter by post type"
          data-index={feedTypes.indexOf(type)}
        >
          {feedTypes.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => changeType(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <button type="button" className="text-button feed-post" onClick={openPost}>
          Post an offer
        </button>
      </div>
      <fieldset className="feed-filter">
        <legend>Filter by category</legend>
        <div className="filter-options">
          <button type="button" aria-pressed={!category} onClick={() => changeCategory('')}>
            All
          </button>
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={category === item}
              onClick={() => changeCategory(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </fieldset>
      {loading && !page && (
        <p role="status" className="feed-loading">
          Loading listings…
        </p>
      )}
      <div className="listing-results" aria-busy={loading}>
        {filtered?.length === 0 && !loading && (
          <p className="feed-empty">
            {type !== 'Everything'
              ? page?.next
                ? `No ${type.toLowerCase()} in the posts loaded so far. Load more listings to keep looking.`
                : `No ${type.toLowerCase()} here yet.`
              : category
                ? `No ${category} listings yet. Try another category.`
                : 'No listings yet. Be the first to offer something useful.'}
          </p>
        )}
        <div className="listing-grid" key={type}>
          {filtered?.map((item) => (
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
      </div>
      {page?.next && (
        <button className="secondary" disabled={busy || loading} onClick={() => void more()}>
          Load more listings
        </button>
      )}
      <ListingForm
        key={company.id}
        company={company}
        uid={uid}
        busy={busy}
        setBusy={setBusy}
        onPublished={refresh}
      />
      <AskForm key={'ask:' + company.id} company={company} uid={uid} onPublished={refresh} />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
