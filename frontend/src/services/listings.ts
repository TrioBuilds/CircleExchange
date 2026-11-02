import {
  collection, doc, getDocsFromServer, limit, orderBy, query, serverTimestamp,
  setDoc, startAfter, updateDoc, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firebase } from './firebase';
import type { Company } from '../companies';

export const categories = ['goods', 'services'] as const;
export type ListingDraft = {
  title: string;
  description: string;
  category: typeof categories[number];
  pricePaise: number;
  pickup: string;
};
export type Listing = ListingDraft & { id: string; ownerId: string; status: 'available' | 'exchanged' };
export type Page = { items: Listing[]; next: QueryDocumentSnapshot | null };

function listings(company: Company) {
  if (!firebase) throw new Error('Firebase is unavailable.');
  return collection(firebase.db, 'communities', company.id, 'listings');
}

export async function loadListings(company: Company, after?: QueryDocumentSnapshot): Promise<Page> {
  const pageSize = 20;
  const result = await getDocsFromServer(query(listings(company), orderBy('createdAt', 'desc'),
    ...(after ? [startAfter(after)] : []), limit(pageSize + 1)));
  const page = result.docs.slice(0, pageSize);
  return {
    items: page.map(snapshot => ({ ...snapshot.data(), id: snapshot.id }) as Listing),
    next: result.size > pageSize ? page[page.length - 1] : null,
  };
}

export async function postListing(company: Company, uid: string, draft: ListingDraft) {
  await setDoc(doc(listings(company)), {
    ...draft, ownerId: uid, status: 'available', createdAt: serverTimestamp(),
  });
}

export async function markExchanged(company: Company, id: string) {
  await updateDoc(doc(listings(company), id), { status: 'exchanged' });
}
