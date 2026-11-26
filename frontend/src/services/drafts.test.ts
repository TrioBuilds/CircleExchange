import { expect, it, vi } from 'vitest';
import { clearDrafts, deleteDraft, loadDraft, saveDraft } from './drafts';

it('keeps account, community, and draft type independent', () => {
  saveDraft('ada', 'hp', 'offer', { title: 'Desk' });
  saveDraft('ada', 'hp', 'ask', { title: 'Ticket help' });
  saveDraft('ada', 'google', 'offer', { title: 'Book' });
  saveDraft('bea', 'hp', 'offer', { title: 'Bike' });
  sessionStorage.setItem('unrelated', 'keep');
  expect(loadDraft('ada', 'hp', 'ask')).toEqual({ title: 'Ticket help' });
  expect(loadDraft('ada', 'hp', 'offer')).toEqual({ title: 'Desk' });
  expect(deleteDraft('ada', 'hp', 'ask')).toBe(true);
  expect(loadDraft('ada', 'hp', 'ask')).toBeUndefined();
  clearDrafts('ada');
  expect(loadDraft('ada', 'hp', 'offer')).toBeUndefined();
  expect(loadDraft('ada', 'google', 'offer')).toBeUndefined();
  expect(loadDraft('bea', 'hp', 'offer')).toEqual({ title: 'Bike' });
  expect(sessionStorage.getItem('unrelated')).toBe('keep');
});
it('rejects malformed or oversized data and tolerates disabled storage', () => {
  saveDraft('ada', 'hp', 'ask', { title: 'Help' });
  const key = sessionStorage.key(0)!;
  for (const invalid of [
    'broken',
    'null',
    '[]',
    '{"title": 123}',
    JSON.stringify({ title: 'x'.repeat(1501) }),
    'x'.repeat(20001),
  ]) {
    sessionStorage.setItem(key, invalid);
    expect(loadDraft('ada', 'hp', 'ask')).toBeUndefined();
  }
  const blocked = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  try {
    expect(loadDraft('ada', 'hp', 'ask')).toBeUndefined();
  } finally {
    blocked.mockRestore();
  }
});
it('does not confuse account or community IDs containing separators', () => {
  saveDraft('a:b', 'c', 'ask', { title: 'First' });
  saveDraft('a', 'b:c', 'ask', { title: 'Second' });
  clearDrafts('a');
  expect(loadDraft('a:b', 'c', 'ask')).toEqual({ title: 'First' });
  expect(loadDraft('a', 'b:c', 'ask')).toBeUndefined();
});
