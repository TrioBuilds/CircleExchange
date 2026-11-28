import { linkedListing } from '../listingLink';
import type { MouseEvent } from 'react';

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

export function openPost(event: MouseEvent<HTMLButtonElement>) {
  openComposer('post-offer', event.currentTarget);
}

export function openAsk(event: MouseEvent<HTMLButtonElement>) {
  openComposer('ask-circle', event.currentTarget);
}

export function openSheet(id: string, trigger?: HTMLButtonElement) {
  const sheet = document.getElementById(id);
  if (!(sheet instanceof HTMLDialogElement)) return false;
  if (!sheet.open) {
    trigger?.focus({ preventScroll: true });
    sheet.showModal();
  }
  return true;
}

function openComposer(id: string, trigger: HTMLButtonElement) {
  if (openSheet(id, trigger)) return;
  if (currentPage() !== 'feed' || linkedListing()) {
    window.location.href = '/feed#' + id;
    return;
  }
  document.querySelector('[aria-label="Your community"]')?.scrollIntoView({ block: 'start' });
}
