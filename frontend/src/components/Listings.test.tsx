import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Listings from './Listings';
import { COMPANIES } from '../companies';
import { loadListing, loadListings, postListing, markExchanged } from '../services/listings';
import { saveDraft, loadDraft } from '../services/drafts';
import { Timestamp } from 'firebase/firestore';
import type { Listing, Page } from '../services/listings';
vi.mock('../services/listings', () => ({
  categories: ['goods', 'services'],
  loadListing: vi.fn(),
  loadListings: vi.fn(),
  postListing: vi.fn(),
  markExchanged: vi.fn(),
}));
vi.mock('../services/interest', () => ({
  myInterest: vi.fn().mockResolvedValue(null),
  requestNames: vi.fn().mockResolvedValue([]),
}));
beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  window.history.replaceState({}, '', '/');
});

it('keeps older offers visible and lets the asks filter find posts on later pages', async () => {
  const olderOffer: Listing = {
    id: 'older-offer',
    ownerId: 'neighbor',
    title: 'Spare book',
    description: 'Paperback',
    category: 'goods',
    pickup: 'Lobby',
    pricePaise: 0,
    status: 'available',
  };
  const ask: Listing = {
    ...olderOffer,
    id: 'ask',
    title: 'Ticket help',
    askDeadline: Timestamp.fromMillis(Date.now() + 3600000),
  };
  const next = {} as NonNullable<Page['next']>;
  vi.mocked(loadListings)
    .mockResolvedValueOnce({ items: [olderOffer], next })
    .mockResolvedValueOnce({ items: [ask], next: null });
  render(<Listings company={COMPANIES[0]} uid="ada" />);
  expect(await screen.findByRole('button', { name: /Spare book/ })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Asks' }));
  expect(screen.getByRole('button', { name: 'Asks' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText(/Load more listings to keep looking/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Load more listings' }));
  expect(await screen.findByRole('button', { name: /Ticket help/ })).toBeVisible();
  expect(loadListings).toHaveBeenLastCalledWith(COMPANIES[0], undefined, next);
  fireEvent.click(screen.getByRole('button', { name: 'Offers' }));
  expect(screen.getByRole('button', { name: /Spare book/ })).toBeVisible();
  expect(screen.queryByRole('button', { name: /Ticket help/ })).not.toBeInTheDocument();
});

it('opens a composer from its existing shareable hash', async () => {
  vi.mocked(loadListings).mockResolvedValue({ items: [], next: null });
  window.history.replaceState({}, '', '/feed#ask-circle');
  render(<Listings company={COMPANIES[0]} uid="ada" />);
  expect(await screen.findByRole('dialog', { name: 'Ask my circle' })).toBeVisible();
  expect(screen.queryByRole('dialog', { name: 'Post an offer' })).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('publishes a priced item, displays its details and lets its owner mark it exchanged', async () => {
  const company = COMPANIES[0];
  const item = {
    id: 'desk',
    ownerId: 'ada',
    title: 'Oak desk',
    description: 'Folding desk',
    category: 'goods' as const,
    pickup: 'Office lobby',
    pricePaise: 12550,
    status: 'available' as const,
  };
  vi.mocked(loadListings)
    .mockResolvedValueOnce({ items: [], next: null })
    .mockResolvedValueOnce({ items: [item], next: null })
    .mockResolvedValue({ items: [{ ...item, status: 'exchanged' }], next: null });
  const user = userEvent.setup();
  render(<Listings company={company} uid="ada" />);
  expect(await screen.findByText(/No listings yet/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: item.title } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: item.description } });
  await user.selectOptions(screen.getByLabelText('Category'), item.category);
  await user.selectOptions(screen.getByLabelText('Offer type'), 'paid');
  fireEvent.change(screen.getByLabelText('Price (INR)'), { target: { value: '125.50' } });
  fireEvent.change(screen.getByLabelText('Pickup location'), { target: { value: item.pickup } });
  await user.click(screen.getByRole('button', { name: 'Publish listing' }));
  expect(postListing).toHaveBeenCalledWith(company, 'ada', {
    title: item.title,
    description: item.description,
    category: item.category,
    pickup: item.pickup,
    pricePaise: 12550,
  });
  expect(await screen.findByText('Listing published.')).toHaveAttribute('role', 'status');
  await user.click(screen.getByRole('button', { name: 'Close' }));
  expect(await screen.findByText('goods · Pickup: Office lobby')).toBeVisible();
  expect(loadDraft('ada', company.id, 'offer')).toBeUndefined();
  await user.click(await screen.findByRole('button', { name: /Oak desk/ }));
  expect(screen.getByText(item.description)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Mark exchanged' }));
  expect(markExchanged).toHaveBeenCalledWith(company, item.id);
  expect(await screen.findByText('exchanged')).toBeVisible();
});

it('filters the feed by category before loading listings', async () => {
  const company = COMPANIES[0];
  vi.mocked(loadListings).mockResolvedValue({ items: [], next: null });
  const user = userEvent.setup();
  render(<Listings company={company} uid="ada" />);
  await screen.findByText(/No listings yet/);
  await user.click(screen.getByRole('button', { name: 'Services' }));
  expect(loadListings).toHaveBeenLastCalledWith(company, 'services');
  expect(await screen.findByText('No services listings yet. Try another category.')).toBeVisible();
});

it('publishes a discount with booking terms and shows net savings before interest', async () => {
  vi.mocked(loadListings).mockResolvedValue({ items: [], next: null });
  vi.mocked(postListing).mockResolvedValue(undefined);
  const company = COMPANIES[0];
  const user = userEvent.setup();
  render(<Listings company={company} uid="ada" />);
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  await user.type(screen.getByLabelText('Title'), 'Movie tickets');
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'Two eligible tickets, subject to availability' },
  });
  await user.selectOptions(screen.getByLabelText('Offer type'), 'discount');
  expect(screen.queryByLabelText('Pickup location')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('Helper fee (INR)'), '200');
  await user.type(screen.getByLabelText('Maximum discount (INR)'), '500');
  await user.selectOptions(screen.getByLabelText('Who books?'), 'helper');
  fireEvent.change(screen.getByLabelText('When is the helper fee paid?'), {
    target: { value: 'After tickets are issued' },
  });
  fireEvent.change(screen.getByLabelText('What happens if booking fails?'), {
    target: { value: 'No fee is due' },
  });
  fireEvent.change(screen.getByLabelText('Cancellation and refund terms'), {
    target: { value: 'Fee refunded if helper cancels' },
  });
  const discount = {
    maxDiscountPaise: 50000,
    bookedBy: 'helper' as const,
    paymentTerms: 'After tickets are issued',
    failureTerms: 'No fee is due',
    cancellationTerms: 'Fee refunded if helper cancels',
  };
  const item = {
    id: 'tickets',
    ownerId: 'ada',
    title: 'Movie tickets',
    description: 'Two eligible tickets, subject to availability',
    category: 'services' as const,
    pickup: '',
    pricePaise: 20000,
    discount,
    status: 'available' as const,
  };
  vi.mocked(loadListings).mockResolvedValue({ items: [item], next: null });
  await user.click(screen.getByRole('button', { name: 'Publish listing' }));
  expect(postListing).toHaveBeenCalledWith(company, 'ada', {
    title: item.title,
    description: item.description,
    category: 'services',
    pickup: '',
    pricePaise: 20000,
    discount,
  });
  expect(await screen.findByText('Listing published.')).toHaveAttribute('role', 'status');
  await user.click(screen.getByRole('button', { name: 'Close' }));
  expect(await screen.findByText('Save up to ₹300.00 after the fee')).toBeVisible();
  expect(screen.getByText('Helper fee ₹200.00')).toBeVisible();
  await user.click(screen.getByRole('button', { name: /Movie tickets/ }));
  expect(screen.getByRole('region', { name: 'Booking terms' })).toHaveTextContent('No fee is due');
  expect(screen.getByRole('region', { name: 'Booking terms' })).toHaveTextContent(
    'Fee refunded if helper cancels',
  );
});

it('rejects a helper fee that eliminates the discount and retains the draft', async () => {
  vi.mocked(loadListings).mockResolvedValue({ items: [], next: null });
  saveDraft('ada', 'hp', 'offer', {
    offer: 'discount',
    title: 'Tickets',
    description: 'Weekend tickets',
    price: '500',
    'max-discount': '500',
    'booked-by': 'buyer',
    'payment-terms': 'After booking',
    'failure-terms': 'No fee',
    'cancellation-terms': 'Discuss before booking',
  });
  const user = userEvent.setup();
  render(<Listings company={COMPANIES[0]} uid="ada" />);
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  await user.click(screen.getByRole('button', { name: 'Publish listing' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'discount greater than the helper fee',
  );
  expect(postListing).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Maximum discount (INR)')).toHaveValue(500);
});

it('opens a linked listing directly with its interest action', async () => {
  const company = COMPANIES[0];
  const item = {
    id: 'desk',
    ownerId: 'other',
    title: 'Oak desk',
    description: 'Folding desk',
    category: 'goods' as const,
    pickup: 'Office lobby',
    pricePaise: 0,
    status: 'available' as const,
  };
  window.history.replaceState({}, '', '/?board=' + company.id + '&listing=desk');
  vi.mocked(loadListing).mockResolvedValue(item);
  render(<Listings company={company} uid="ada" />);
  expect(await screen.findByText('Oak desk')).toBeVisible();
  expect(loadListing).toHaveBeenCalledWith(company, 'desk');
  expect(loadListings).not.toHaveBeenCalledWith(company, undefined);
  expect(screen.getByRole('link', { name: /Back to your feed/ })).toHaveAttribute('href', '/feed');
  expect(await screen.findByRole('button', { name: 'I’m interested' })).toBeVisible();
});

it('gives a safe unavailable state for a missing linked listing', async () => {
  const company = COMPANIES[0];
  window.history.replaceState({}, '', '/?board=' + company.id + '&listing=missing');
  vi.mocked(loadListing).mockResolvedValue(null);
  render(<Listings company={company} uid="ada" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('no longer available');
  expect(screen.getByRole('link', { name: /Back to your feed/ })).toHaveAttribute('href', '/feed');
});

it('restores each feed’s draft after switching away and back', async () => {
  vi.mocked(loadListings).mockResolvedValue({ items: [], next: null });
  const user = userEvent.setup();
  const board = (id: string) => <Listings key={id} company={{ id, name: id }} uid="ada" />;
  const view = render(board('Alacrity'));
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  await user.type(screen.getByLabelText('Title'), 'My book');
  await user.selectOptions(screen.getByLabelText('Offer type'), 'paid');
  await user.type(screen.getByLabelText('Price (INR)'), '12.50');
  view.rerender(board('Baner'));
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  expect(screen.getByLabelText('Title')).toHaveValue('');
  await user.type(screen.getByLabelText('Title'), 'Baner draft');
  view.rerender(board('Alacrity'));
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  expect(screen.getByLabelText('Title')).toHaveValue('My book');
  expect(screen.getByLabelText('Price (INR)')).toHaveValue(12.5);
  expect(Number(loadDraft('ada', 'Alacrity', 'offer')?.price)).toBe(12.5);
  view.unmount();
  render(board('Alacrity'));
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  expect(screen.getByLabelText('Title')).toHaveValue('My book');
  await user.click(screen.getByRole('button', { name: 'Discard draft' }));
  expect(loadDraft('ada', 'Alacrity', 'offer')).toBeUndefined();
  expect(screen.getByLabelText('Title')).toHaveValue('');
});
it('restores the discount fee and booking terms after a full form remount', async () => {
  vi.mocked(loadListings).mockResolvedValue({ items: [], next: null });
  const user = userEvent.setup();
  const view = render(<Listings company={COMPANIES[0]} uid="ada" />);
  await user.click(screen.getByRole('button', { name: 'Post an offer' }));
  await user.selectOptions(screen.getByLabelText('Offer type'), 'discount');
  await user.type(screen.getByLabelText('Helper fee (INR)'), '200');
  await user.type(screen.getByLabelText('Maximum discount (INR)'), '500');
  await user.selectOptions(screen.getByLabelText('Who books?'), 'helper');
  await user.type(screen.getByLabelText('When is the helper fee paid?'), 'After booking');
  await user.type(screen.getByLabelText('What happens if booking fails?'), 'No fee');
  await user.type(screen.getByLabelText('Cancellation and refund terms'), 'Refund if I cancel');
  view.unmount();
  render(<Listings company={COMPANIES[0]} uid="ada" />);
  expect(screen.getByLabelText('Offer type')).toHaveValue('discount');
  expect(screen.getByLabelText('Helper fee (INR)')).toHaveValue(200);
  expect(screen.getByLabelText('Maximum discount (INR)')).toHaveValue(500);
  expect(screen.getByLabelText('Who books?')).toHaveValue('helper');
  expect(screen.getByLabelText('When is the helper fee paid?')).toHaveValue('After booking');
  expect(screen.getByLabelText('What happens if booking fails?')).toHaveValue('No fee');
  expect(screen.getByLabelText('Cancellation and refund terms')).toHaveValue('Refund if I cancel');
});
