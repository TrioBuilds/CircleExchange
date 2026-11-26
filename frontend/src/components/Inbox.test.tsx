import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import Inbox from './Inbox';
import { decide } from '../services/interest';
import { inboxPages, type Entry } from '../services/inbox';
vi.mock('../services/firebase', () => ({ firebase: { db: {} } }));
vi.mock('../services/interest', () => ({ decide: vi.fn() }));
vi.mock('../services/inbox', () => ({ inboxPages: vi.fn() }));
it('accepts a received request in place and shows accepted requests in Sent', async () => {
  const board = { id: 'hp', name: 'HP' };
  const row: Entry = {
    board,
    listingId: 'book',
    title: 'Paperback',
    buyer: 'ada',
    name: 'Ada',
    status: 'pending',
    available: true,
    createdAt: 1,
  };
  vi.mocked(inboxPages).mockImplementation(async function* (_db, _boards, _uid, folder) {
    yield [folder === 'Sent' ? { ...row, status: 'accepted' as const, available: false } : row];
    return [];
  });
  const user = userEvent.setup();
  render(<Inbox boards={[board]} uid="seller" />);
  await user.click(screen.getByRole('button', { name: 'Received' }));
  expect(await screen.findByText('HP · Ada')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Accept' }));
  expect(decide).toHaveBeenCalledWith('hp', 'book', 'ada', true);
  expect(await screen.findByText('Accepted')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Sent' }));
  expect(await screen.findByText('Accepted')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
});
it('shows the private helper note in Received and Sent', async () => {
  const row: Entry = {
    board: { id: 'hp', name: 'HP' },
    listingId: 'ask',
    title: 'Ticket help',
    buyer: 'sam',
    name: 'Sam',
    status: 'pending',
    available: true,
    createdAt: 1,
    askDeadline: Date.now() + 3600000,
    note: 'I can book tonight for ₹100.',
  };
  vi.mocked(inboxPages).mockImplementation(async function* () {
    yield [row];
    return [];
  });
  const user = userEvent.setup();
  render(<Inbox boards={[row.board]} uid="asking" />);
  await user.click(screen.getByRole('button', { name: 'Received' }));
  expect(await screen.findByText(row.note!)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Sent' }));
  expect(await screen.findByText(row.note!)).toBeVisible();
});
