import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import Interest from './Interest';
import { Timestamp } from 'firebase/firestore';
import { decide, myInterest, requestInterest, requestNames } from '../services/interest';
vi.mock('../services/interest', () => ({
  myInterest: vi.fn(),
  requestNames: vi.fn(),
  requestInterest: vi.fn(),
  decide: vi.fn(),
}));
vi.mock('./Conversation', () => ({ default: () => <p>Conversation loaded</p> }));
const item = {
  id: 'book',
  ownerId: 'seller',
  title: 'Book',
  status: 'available',
  category: 'goods',
  description: 'Paperback',
  pricePaise: 0,
  pickup: 'Lobby',
} as const;
it('sends one request with the name chosen by the buyer', async () => {
  let complete!: () => void;
  vi.mocked(requestInterest).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  const user = userEvent.setup();
  render(<Interest board="hp" item={item} uid="buyer" refresh={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'View my interest' }));
  await user.type(await screen.findByLabelText('Name to share with the seller'), 'Ada');
  await user.click(screen.getByRole('button', { name: 'I’m interested' }));
  expect(myInterest).toHaveBeenCalledWith('hp', 'book', 'buyer');
  expect(requestInterest).toHaveBeenCalledWith('hp', 'book', 'buyer', 'Ada');
  expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await act(async () => complete());
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Request sent. Follow up in Requests.',
  );
  expect(screen.getByRole('status')).toHaveFocus();
  expect(screen.queryByRole('button', { name: 'I’m interested' })).toBeNull();
});
it('shows the seller pending requests and refreshes the offer after acceptance', async () => {
  vi.mocked(requestNames).mockResolvedValue([{ uid: 'buyer', name: 'Ada' }]);
  const refresh = vi.fn(),
    user = userEvent.setup();
  render(<Interest board="hp" item={item} uid="seller" refresh={refresh} />);
  await user.click(screen.getByRole('button', { name: 'View interest requests' }));
  await user.click(await screen.findByRole('button', { name: 'Accept' }));
  expect(decide).toHaveBeenCalledWith('hp', 'book', 'buyer', true);
  expect(refresh).toHaveBeenCalled();
});
it('opens a conversation only for an accepted request', async () => {
  vi.mocked(myInterest).mockResolvedValue('accepted');
  const user = userEvent.setup();
  render(
    <Interest board="hp" item={{ ...item, status: 'reserved' }} uid="buyer" refresh={vi.fn()} />,
  );
  await user.click(screen.getByRole('button', { name: 'View my interest' }));
  await user.click(await screen.findByRole('button', { name: 'Open conversation' }));
  expect(screen.getByText('Conversation loaded')).toBeVisible();
});
it('lets a neighbor offer help and prevents new replies after expiry', async () => {
  vi.mocked(myInterest).mockResolvedValue(undefined);
  vi.mocked(requestInterest).mockClear();
  const user = userEvent.setup();
  const ask = { ...item, askDeadline: Timestamp.fromMillis(Date.now() + 3600000) };
  const view = render(<Interest board="hp" item={ask} uid="neighbor" refresh={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'View my reply' }));
  await user.type(await screen.findByLabelText('Name to share with the person asking'), 'Sam');
  expect(screen.getByRole('button', { name: 'I can help' })).toBeDisabled();
  await user.type(
    screen.getByLabelText('How can you help?'),
    'I can book two tickets after 6pm. My fee is ₹100.',
  );
  await user.click(screen.getByRole('button', { name: 'I can help' }));
  expect(requestInterest).toHaveBeenCalledWith(
    'hp',
    'book',
    'neighbor',
    'Sam',
    'I can book two tickets after 6pm. My fee is ₹100.',
  );
  view.unmount();
  render(
    <Interest
      board="hp"
      item={{ ...ask, askDeadline: Timestamp.fromMillis(Date.now() - 1000) }}
      uid="neighbor"
      refresh={vi.fn()}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'View my reply' }));
  expect(screen.queryByRole('button', { name: 'I can help' })).not.toBeInTheDocument();
});
it('shows help notes before accepting and supports an earlier reply without a note', async () => {
  vi.mocked(requestNames).mockResolvedValue([
    { uid: 'helper', name: 'Sam', note: 'I can help tonight for ₹100.' },
    { uid: 'older', name: 'Ada' },
  ]);
  const user = userEvent.setup();
  render(
    <Interest
      board="hp"
      item={{ ...item, askDeadline: Timestamp.fromMillis(Date.now() + 3600000) }}
      uid="seller"
      refresh={vi.fn()}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'View helpers' }));
  expect(await screen.findByText('I can help tonight for ₹100.')).toBeVisible();
  expect(screen.getByText('This earlier reply has no note.')).toBeVisible();
  expect(screen.getAllByRole('button', { name: 'Accept' })).toHaveLength(2);
});
it('retains a helper note after a failed reply', async () => {
  vi.mocked(myInterest).mockResolvedValue(undefined);
  vi.mocked(requestInterest).mockRejectedValueOnce(new Error('offline'));
  const user = userEvent.setup();
  render(
    <Interest
      board="hp"
      item={{ ...item, askDeadline: Timestamp.fromMillis(Date.now() + 3600000) }}
      uid="neighbor"
      refresh={vi.fn()}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'View my reply' }));
  await user.type(await screen.findByLabelText('Name to share with the person asking'), 'Sam');
  await user.type(screen.getByLabelText('How can you help?'), 'I can help tonight.');
  await user.click(screen.getByRole('button', { name: 'I can help' }));
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.getByLabelText('How can you help?')).toHaveValue('I can help tonight.');
});
