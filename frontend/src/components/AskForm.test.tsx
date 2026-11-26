import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import AskForm from './AskForm';
import { postListing } from '../services/listings';
vi.mock('../services/listings', () => ({
  categories: ['goods', 'services'],
  postListing: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
const company = { id: 'hp', name: 'HP' };
const dateInput = (milliseconds: number) => {
  const date = new Date(milliseconds);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
it('posts a need with a local deadline and clears the draft only after success', async () => {
  const deadline = dateInput(Date.now() + 3600000);
  const drafts = new Map([
    ['hp:ask', { title: 'Ticket help', description: 'Two seats for tonight', deadline }],
  ]);
  const onPublished = vi.fn();
  vi.mocked(postListing).mockRejectedValueOnce(new Error()).mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  render(<AskForm company={company} uid="ada" drafts={drafts} onPublished={onPublished} />);
  await user.click(screen.getByText('Ask my circle'));
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your draft is still here');
  expect(drafts.has('hp:ask')).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Your ask is posted');
  const data = vi.mocked(postListing).mock.calls[1][2];
  expect(data).toMatchObject({
    title: 'Ticket help',
    description: 'Two seats for tonight',
    category: 'services',
    pricePaise: 0,
    pickup: '',
  });
  expect(data.askDeadline?.toMillis()).toBe(new Date(deadline).getTime());
  expect(drafts.has('hp:ask')).toBe(false);
  expect(onPublished).toHaveBeenCalledOnce();
});
it('rejects past and overly distant deadlines without writing', async () => {
  const user = userEvent.setup();
  render(
    <AskForm
      company={company}
      uid="ada"
      drafts={
        new Map([
          [
            'hp:ask',
            {
              title: 'Help',
              description: 'Please help',
              deadline: dateInput(Date.now() - 3600000),
            },
          ],
        ])
      }
      onPublished={vi.fn()}
    />,
  );
  await user.click(screen.getByText('Ask my circle'));
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('future deadline within 30 days');
  fireEvent.change(screen.getByLabelText('Reply by'), {
    target: { value: dateInput(Date.now() + 31 * 86400000) },
  });
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  expect(postListing).not.toHaveBeenCalled();
});
