export function linkedListing() {
  const params = new URLSearchParams(window.location.search);
  const board = params.get('board');
  const listing = params.get('listing');
  return board && listing && /^[A-Za-z0-9_-]{1,100}$/.test(listing) ? { board, listing } : null;
}

export function listingUrl(board: string, listing: string) {
  const url = new URL('/', window.location.origin);
  url.searchParams.set('board', board);
  url.searchParams.set('listing', listing);
  return url.toString();
}
