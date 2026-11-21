import Interest from './Interest';
import { listingUrl } from '../listingLink';
import type { Listing } from '../services/listings';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function ListingCard({
  item,
  board,
  uid,
  busy,
  focused = false,
  exchange,
  copyLink,
  refresh,
}: {
  item: Listing;
  board: string;
  uid: string;
  busy: boolean;
  focused?: boolean;
  exchange: (id: string) => Promise<void>;
  copyLink: (id: string) => Promise<void>;
  refresh: () => void;
}) {
  return (
    <details className="listing-card" open={focused ? true : undefined}>
      <summary>
        <span className="listing-title">{item.title}</span>
        <span className="listing-meta">
          <span>{item.pricePaise === 0 ? 'Free' : currency.format(item.pricePaise / 100)}</span>
          <span className="status-tag">{item.status}</span>
        </span>
        <span className="listing-location">
          {item.category} · Pickup: {item.pickup}
        </span>
      </summary>
      <p>{item.description}</p>
      {!focused && <a href={listingUrl(board, item.id)}>Open shareable page</a>}
      {focused && <button onClick={() => void copyLink(item.id)}>Copy listing link</button>}
      {item.ownerId === uid && item.status !== 'exchanged' && (
        <button disabled={busy} onClick={() => void exchange(item.id)}>
          Mark exchanged
        </button>
      )}
      <Interest board={board} item={item} uid={uid} refresh={refresh} autoLoad={focused} />
    </details>
  );
}
