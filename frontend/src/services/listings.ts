import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  setDoc,
  startAfter,
  updateDoc,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { firebase } from './firebase';
import type { Company } from '../companies';

export const categories = ['goods', 'services'] as const;
export type DiscountDetails = {
  maxDiscountPaise: number;
  bookedBy: 'helper' | 'buyer';
  paymentTerms: string;
  failureTerms: string;
  cancellationTerms: string;
};
export type ListingDraft = {
  title: string;
  description: string;
  category: (typeof categories)[number];
  pricePaise: number;
  pickup: string;
  discount?: DiscountDetails;
  askDeadline?: Timestamp;
};
export type Listing = ListingDraft & {
  id: string;
  ownerId: string;
  status: 'available' | 'reserved' | 'exchanged';
};
export type Page = { items: Listing[]; next: QueryDocumentSnapshot | null };

function listings(company: Pick<Company, 'id' | 'name'>) {
  if (!firebase) throw new Error('Firebase is unavailable.');
  return collection(firebase.db, 'communities', company.id, 'listings');
}

export async function loadListings(
  company: Pick<Company, 'id' | 'name'>,
  category?: ListingDraft['category'],
  after?: QueryDocumentSnapshot,
): Promise<Page> {
  const pageSize = 20;
  const result = await getDocsFromServer(
    query(
      listings(company),
      ...(category ? [where('category', '==', category)] : []),
      orderBy('createdAt', 'desc'),
      ...(after ? [startAfter(after)] : []),
      limit(pageSize + 1),
    ),
  );
  const page = result.docs.slice(0, pageSize);
  return {
    items: page.map((snapshot) => ({ ...snapshot.data(), id: snapshot.id }) as Listing),
    next: result.size > pageSize ? page[page.length - 1] : null,
  };
}

export async function loadListing(
  company: Pick<Company, 'id' | 'name'>,
  id: string,
): Promise<Listing | null> {
  const snapshot = await getDocFromServer(doc(listings(company), id));
  return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as Listing) : null;
}

export async function postListing(
  company: Pick<Company, 'id' | 'name'>,
  uid: string,
  draft: ListingDraft,
) {
  await setDoc(doc(listings(company)), {
    ...draft,
    ownerId: uid,
    status: 'available',
    createdAt: serverTimestamp(),
  });
}

export async function markExchanged(company: Pick<Company, 'id' | 'name'>, id: string) {
  await updateDoc(doc(listings(company), id), { status: 'exchanged' });
}
