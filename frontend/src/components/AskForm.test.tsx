import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import AskForm from './AskForm';
import { postListing } from '../services/listings';
import { saveDraft, loadDraft } from '../services/drafts';
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
  saveDraft('ada', 'hp', 'ask', {
    title: 'Ticket help',
    description: 'Two seats for tonight',
    deadline,
  });
  const onPublished = vi.fn();
  vi.mocked(postListing).mockRejectedValueOnce(new Error()).mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  render(<AskForm company={company} uid="ada" onPublished={onPublished} />);
  await user.click(screen.getByText('Ask my circle'));
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your draft is still here');
  expect(loadDraft('ada', 'hp', 'ask')).toBeDefined();
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
  expect(loadDraft('ada', 'hp', 'ask')).toBeUndefined();
  expect(onPublished).toHaveBeenCalledOnce();
});
it('rejects past and overly distant deadlines without writing', async () => {
  const user = userEvent.setup();
  saveDraft('ada', 'hp', 'ask', {
    title: 'Help',
    description: 'Please help',
    deadline: dateInput(Date.now() - 3600000),
  });
  render(<AskForm company={company} uid="ada" onPublished={vi.fn()} />);
  await user.click(screen.getByText('Ask my circle'));
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('future deadline within 30 days');
  fireEvent.change(screen.getByLabelText('Reply by'), {
    target: { value: dateInput(Date.now() + 31 * 86400000) },
  });
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  expect(postListing).not.toHaveBeenCalled();
});
it('restores an ask after leaving the page and keeps other accounts and offer drafts separate', async () => {
  const user = userEvent.setup();
  const view = render(<AskForm company={company} uid="ada" onPublished={vi.fn()} />);
  await user.click(screen.getByText('Ask my circle'));
  await user.type(screen.getByLabelText('What do you need?'), 'Projector for tonight');
  fireEvent.change(screen.getByLabelText('Reply by'), {
    target: { value: dateInput(Date.now() + 3600000) },
  });
  const saved = loadDraft('ada', 'hp', 'ask');
  view.unmount();
  const other = render(<AskForm company={company} uid="bea" onPublished={vi.fn()} />);
  expect(screen.getByLabelText('What do you need?')).toHaveValue('');
  other.unmount();
  render(<AskForm company={company} uid="ada" onPublished={vi.fn()} />);
  expect(screen.getByLabelText('What do you need?')).toHaveValue(saved?.title);
  expect(screen.getByLabelText('Reply by')).toHaveValue(saved?.deadline);
  expect(loadDraft('ada', 'hp', 'offer')).toBeUndefined();
  await user.click(screen.getByText('Ask my circle'));
  await user.click(screen.getByRole('button', { name: 'Discard ask draft' }));
  expect(loadDraft('ada', 'hp', 'ask')).toBeUndefined();
  expect(screen.getByLabelText('What do you need?')).toHaveValue('');
});
it('keeps the form usable and shows a warning when storage is blocked', async () => {
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  try {
    render(<AskForm company={company} uid="ada" onPublished={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('What do you need?'), {
      target: { value: 'Help tonight' },
    });
    expect(screen.getByText(/Draft storage is unavailable/)).toBeInTheDocument();
    expect(screen.getByLabelText('What do you need?')).toHaveValue('Help tonight');
  } finally {
    blocked.mockRestore();
  }
});
it('keeps a newer draft when an earlier submission finishes', async () => {
  saveDraft('ada', 'hp', 'ask', {
    title: 'First ask',
    description: 'Please help',
    deadline: dateInput(Date.now() + 3600000),
  });
  let finish!: () => void;
  vi.mocked(postListing).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<AskForm company={company} uid="ada" onPublished={vi.fn()} />);
  const user = userEvent.setup();
  await user.click(screen.getByText('Ask my circle'));
  await user.click(screen.getByRole('button', { name: 'Post my ask' }));
  fireEvent.change(screen.getByLabelText('What do you need?'), {
    target: { value: 'My next ask' },
  });
  await act(async () => finish());
  expect(loadDraft('ada', 'hp', 'ask')?.title).toBe('My next ask');
  expect(screen.getByLabelText('What do you need?')).toHaveValue('My next ask');
});
