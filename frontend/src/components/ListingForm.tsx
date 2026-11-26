import { useState, type FormEvent } from 'react';
import type { Company } from '../companies';
import { categories, postListing, type DiscountDetails } from '../services/listings';

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
  const [offer, setOffer] = useState(draft?.offer ?? 'free');
  const isDiscount = offer === 'discount';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    const form = event.currentTarget;
    const fields = new FormData(form);
    const value = (name: string) => String(fields.get(name) ?? '').trim();
    const title = value('title');
    const description = value('description');
    const pickup = isDiscount ? '' : value('pickup');
    const category = isDiscount
      ? 'services'
      : categories.find((item) => item === value('category'));
    const pricePaise = offer === 'free' ? 0 : Math.round(Number(value('price')) * 100);
    let discount: DiscountDetails | undefined;
    if (isDiscount) {
      const maxDiscountPaise = Math.round(Number(value('max-discount')) * 100);
      const bookedBy = value('booked-by');
      const paymentTerms = value('payment-terms');
      const failureTerms = value('failure-terms');
      const cancellationTerms = value('cancellation-terms');
      if (
        !Number.isSafeInteger(maxDiscountPaise) ||
        maxDiscountPaise > 100000000 ||
        maxDiscountPaise <= pricePaise ||
        !paymentTerms ||
        !failureTerms ||
        !cancellationTerms ||
        (bookedBy !== 'helper' && bookedBy !== 'buyer')
      ) {
        setError('Enter a discount greater than the helper fee and complete all booking terms.');
        return;
      }
      discount = { maxDiscountPaise, bookedBy, paymentTerms, failureTerms, cancellationTerms };
    }
    if (
      !title ||
      !description ||
      (!isDiscount && !pickup) ||
      !category ||
      !Number.isSafeInteger(pricePaise) ||
      pricePaise < (isDiscount ? 0 : offer === 'paid' ? 1 : 0) ||
      pricePaise > 100000000
    ) {
      setError('Enter the item details and a valid price.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await postListing(company, uid, {
        title,
        description,
        category,
        pickup,
        pricePaise,
        ...(discount ? { discount } : {}),
      });
      drafts?.delete(company.id);
      setFormVersion((v) => v + 1);
      setOffer('free');
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
      <p>
        {isDiscount
          ? 'Describe eligibility and conditions for the discount. Include any limits in the description.'
          : 'Include a shared pickup point instead of a private address.'}
      </p>
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
        {!isDiscount && (
          <label>
            Category
            <select name="category" defaultValue={draft?.category}>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          Offer type
          <select name="offer" value={offer} onChange={(e) => setOffer(e.target.value)}>
            <option value="free">Free</option>
            <option value="paid">For sale</option>
            <option value="discount">Discount offer</option>
          </select>
        </label>
        {offer !== 'free' && (
          <label>
            {isDiscount ? 'Helper fee (INR)' : 'Price (INR)'}
            <input
              name="price"
              defaultValue={draft?.price}
              type="number"
              min={isDiscount ? '0' : '0.01'}
              max="1000000"
              step="0.01"
              required
            />
          </label>
        )}
        {isDiscount ? (
          <fieldset className="discount-fields">
            <legend>Discount and booking terms</legend>
            <label>
              Maximum discount (INR)
              <input
                name="max-discount"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                defaultValue={draft?.['max-discount']}
                required
              />
            </label>
            <small>We subtract your fee from this amount to show the maximum net saving.</small>
            <label>
              Who books?
              <select name="booked-by" defaultValue={draft?.['booked-by'] ?? ''} required>
                <option value="">Choose who books</option>
                <option value="helper">Helper books</option>
                <option value="buyer">Buyer books</option>
              </select>
            </label>
            <label>
              When is the helper fee paid?
              <textarea
                name="payment-terms"
                maxLength={500}
                defaultValue={draft?.['payment-terms']}
                required
              />
            </label>
            <label>
              What happens if booking fails?
              <textarea
                name="failure-terms"
                maxLength={500}
                defaultValue={draft?.['failure-terms']}
                required
              />
            </label>
            <label>
              Cancellation and refund terms
              <textarea
                name="cancellation-terms"
                maxLength={500}
                defaultValue={draft?.['cancellation-terms']}
                required
              />
            </label>
          </fieldset>
        ) : (
          <label>
            Pickup location
            <input name="pickup" defaultValue={draft?.pickup} maxLength={120} required />
          </label>
        )}
        <button className="primary" disabled={busy}>
          Publish listing
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            drafts?.delete(company.id);
            setOffer('free');
            setFormVersion((v) => v + 1);
          }}
        >
          Discard draft
        </button>
      </form>
    </details>
  );
}
