import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Listings from './Listings';
import { COMPANIES } from './companies';
import { loadListing, loadListings, postListing, markExchanged } from './services/listings';
vi.mock('./services/listings', () => ({
  categories: ['goods', 'services'],
  loadListing: vi.fn(), loadListings: vi.fn(), postListing: vi.fn(), markExchanged: vi.fn(),
}));
vi.mock('./services/interest', () => ({ myInterest: vi.fn().mockResolvedValue(null), requestNames: vi.fn().mockResolvedValue([]) }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { window.history.replaceState({}, '', '/'); });

it('publishes a priced item, displays its details and lets its owner mark it exchanged', async () => {
  const company = COMPANIES[0];
  const item = { id: 'desk', ownerId: 'ada', title: 'Oak desk', description: 'Folding desk',
    category: 'goods' as const, pickup: 'Office lobby', pricePaise: 12550, status: 'available' as const };
  vi.mocked(loadListings).mockResolvedValueOnce({ items: [], next: null })
    .mockResolvedValueOnce({ items: [item], next: null })
    .mockResolvedValue({ items: [{ ...item, status: 'exchanged' }], next: null });
  const user = userEvent.setup();
  render(<Listings company={company} uid="ada" />);
  expect(await screen.findByText(/No listings yet/)).toBeVisible();
  await user.click(screen.getByText('Offer something to your community'));
  await user.type(screen.getByLabelText('Title'), item.title);
  await user.type(screen.getByLabelText('Description'), item.description);
  await user.selectOptions(screen.getByLabelText('Category'), item.category);
  await user.selectOptions(screen.getByLabelText('Offer type'), 'paid');
  await user.type(screen.getByLabelText('Price (INR)'), '125.50');
  await user.type(screen.getByLabelText('Pickup location'), item.pickup);
  await user.click(screen.getByRole('button', { name: 'Publish listing' }));
  expect(postListing).toHaveBeenCalledWith(company, 'ada', { title: item.title, description: item.description,
    category: item.category, pickup: item.pickup, pricePaise: 12550 });
  expect(await screen.findByText('goods · Pickup: Office lobby')).toBeVisible();
  await user.click(await screen.findByText('Oak desk'));
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

it('opens a linked listing directly with its interest action', async () => {
  const company = COMPANIES[0];
  const item = { id: 'desk', ownerId: 'other', title: 'Oak desk', description: 'Folding desk',
    category: 'goods' as const, pickup: 'Office lobby', pricePaise: 0, status: 'available' as const };
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
  vi.mocked(loadListings).mockResolvedValue({items:[],next:null});
  const drafts = new Map();
  const user = userEvent.setup();
  const board = (id:string) => <Listings key={id} company={{id,name:id}} uid="ada" drafts={drafts}/>;
  const view = render(board('Alacrity'));
  await user.click(screen.getByText('Offer something to your community'));
  await user.type(screen.getByLabelText('Title'),'My book');
  await user.selectOptions(screen.getByLabelText('Offer type'),'paid');
  await user.type(screen.getByLabelText('Price (INR)'),'12.50');
  view.rerender(board('Baner'));
  await user.click(screen.getByText('Offer something to your community'));
  expect(screen.getByLabelText('Title')).toHaveValue('');
  await user.type(screen.getByLabelText('Title'),'Baner draft');
  view.rerender(board('Alacrity'));
  await user.click(screen.getByText('Offer something to your community'));
  expect(screen.getByLabelText('Title')).toHaveValue('My book');
  expect(screen.getByLabelText('Price (INR)')).toHaveValue(12.5);
});
