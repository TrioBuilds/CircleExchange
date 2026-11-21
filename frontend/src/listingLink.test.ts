import { afterEach, expect, it } from 'vitest';
import { linkedListing, listingUrl } from './listingLink';

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

it('builds a shareable URL and rejects malformed listing IDs', () => {
  const url = listingUrl('local:pune:baner', 'abc123');
  expect(new URL(url).searchParams.get('board')).toBe('local:pune:baner');
  window.history.replaceState({}, '', url);
  expect(linkedListing()).toEqual({ board: 'local:pune:baner', listing: 'abc123' });
  window.history.replaceState({}, '', '/?board=local:pune:baner&listing=bad%2Fid');
  expect(linkedListing()).toBeNull();
});
