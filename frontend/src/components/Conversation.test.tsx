import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import Conversation from './Conversation';
import { addDoc, onSnapshot } from 'firebase/firestore';

vi.mock('../services/firebase', () => ({ firebase: { db: {} } }));
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(() => ({})),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  onSnapshot: vi.fn((_query, receive) => {
    receive({
      docs: [{ id: 'one', data: () => ({ senderId: 'buyer', text: 'Meet in the lobby?' }) }],
    });
    return () => {};
  }),
}));

it('shows accepted-pair messages and sends a trimmed reply', async () => {
  const user = userEvent.setup();
  render(<Conversation board="hp" listingId="book" uid="seller" />);
  expect(await screen.findByText('Meet in the lobby?')).toBeVisible();
  await user.type(screen.getByRole('textbox', { name: 'Message' }), '  Yes, at 5.  ');
  await user.click(screen.getByRole('button', { name: 'Send message' }));
  expect(addDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ senderId: 'seller', text: 'Yes, at 5.' }),
  );
  expect(onSnapshot).toHaveBeenCalledOnce();
});
