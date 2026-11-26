import Interest from './Interest';
import { useEffect, useState } from 'react';
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
  const deadline = item.askDeadline?.toMillis();
  const [expanded, setExpanded] = useState(focused);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (deadline === undefined || deadline <= now) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(deadline - now, 2147483647));
    return () => window.clearTimeout(timer);
  }, [deadline, now]);
  const expired = deadline !== undefined && deadline <= now;
  const askState =
    item.status === 'exchanged'
      ? 'Closed'
      : item.status === 'reserved'
        ? 'Helper accepted'
        : expired
          ? 'Expired'
          : 'Open ask';
  return (
    <details
      className={item.askDeadline ? 'listing-card ask-card' : 'listing-card'}
      open={focused ? true : undefined}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <span className="listing-title">{item.title}</span>
        <span className="listing-meta">
          <span>
            {item.askDeadline
              ? 'Ask my circle'
              : item.discount
                ? `Helper fee ${currency.format(item.pricePaise / 100)}`
                : item.pricePaise === 0
                  ? 'Free'
                  : currency.format(item.pricePaise / 100)}
          </span>
          <span className="status-tag">{item.askDeadline ? askState : item.status}</span>
        </span>
        {item.askDeadline ? (
          <span className="listing-location">
            Reply by {item.askDeadline.toDate().toLocaleString()}
          </span>
        ) : item.discount ? (
          <>
            <span className="discount-saving">
              Save up to {currency.format((item.discount.maxDiscountPaise - item.pricePaise) / 100)}{' '}
              after the fee
            </span>
            <span className="listing-location">
              Discount up to {currency.format(item.discount.maxDiscountPaise / 100)} ·{' '}
              {item.discount.bookedBy === 'helper' ? 'Helper books' : 'Buyer books'}
            </span>
          </>
        ) : (
          <span className="listing-location">
            {item.category} · Pickup: {item.pickup}
          </span>
        )}
      </summary>
      <p>{item.description}</p>
      {item.discount && (
        <section className="discount-terms" aria-label="Booking terms">
          <h3>Booking terms</h3>
          <dl>
            <dt>Who books</dt>
            <dd>{item.discount.bookedBy === 'helper' ? 'Helper books' : 'Buyer books'}</dd>
            <dt>Helper fee payment</dt>
            <dd>{item.discount.paymentTerms}</dd>
            <dt>If booking fails</dt>
            <dd>{item.discount.failureTerms}</dd>
            <dt>Cancellations and refunds</dt>
            <dd>{item.discount.cancellationTerms}</dd>
          </dl>
          <p>
            Terms are provided by the poster. Actual savings depend on eligibility and availability.
            Agree on the details before paying. CircleExchange does not process payments or
            guarantee refunds.
          </p>
        </section>
      )}
      {!focused && <a href={listingUrl(board, item.id)}>Open shareable page</a>}
      {focused && <button onClick={() => void copyLink(item.id)}>Copy listing link</button>}
      {item.ownerId === uid && item.status !== 'exchanged' && (
        <button disabled={busy} onClick={() => void exchange(item.id)}>
          {item.askDeadline ? 'Close ask' : 'Mark exchanged'}
        </button>
      )}
      <Interest
        board={board}
        item={item}
        uid={uid}
        refresh={refresh}
        autoLoad={focused || (!!item.askDeadline && expanded)}
      />
    </details>
  );
}
