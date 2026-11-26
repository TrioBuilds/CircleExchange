import { act, render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { expect, it, vi } from 'vitest';
import ListingCard from './ListingCard';
vi.mock('./Interest', () => ({ default: () => null }));
it('expires an ask on screen at its deadline and lets its owner close it', () => {
  vi.useFakeTimers();
  try {
    const item = {
      id: 'ask',
      ownerId: 'ada',
      title: 'Ticket help',
      description: 'Tonight',
      category: 'services' as const,
      pricePaise: 0,
      pickup: '',
      status: 'available' as const,
      askDeadline: Timestamp.fromMillis(Date.now() + 1000),
    };
    render(
      <ListingCard
        item={item}
        board="hp"
        uid="ada"
        busy={false}
        exchange={vi.fn()}
        copyLink={vi.fn()}
        refresh={vi.fn()}
        focused
      />,
    );
    expect(screen.getByText('Open ask')).toBeInTheDocument();
    expect(screen.queryByText('Free')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close ask' })).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
