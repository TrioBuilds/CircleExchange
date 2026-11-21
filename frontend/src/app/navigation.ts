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
  const composer = document.querySelector<HTMLDetailsElement>('.compose');
  if (composer) {
    composer.open = true;
    composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (currentPage() !== 'feed' || linkedListing()) window.location.href = '/feed#post-offer';
  else
    document
      .querySelector('[aria-label="Your community"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
