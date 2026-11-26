import { linkedListing } from '../listingLink';

export type Page = 'feed' | 'requests' | 'profile';
export function currentPage(): Page | null {
  switch (window.location.pathname) {
    case '/':
    case '/feed':
      return 'feed';
    case '/requests':
      return 'requests';
    case '/profile':
      return 'profile';
    default:
      return null;
  }
}

export function openPost() {
  openComposer('.compose:not(.ask-compose)', '#post-offer');
}

export function openAsk() {
  openComposer('.ask-compose', '#ask-circle');
}

function openComposer(selector: string, hash: string) {
  const composer = document.querySelector<HTMLDetailsElement>(selector);
  if (composer) {
    composer.open = true;
    composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (currentPage() !== 'feed' || linkedListing()) window.location.href = '/feed' + hash;
  else
    document
      .querySelector('[aria-label="Your community"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
