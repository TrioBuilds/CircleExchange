import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
  where,
} from 'firebase/firestore';
import { firebase } from './firebase';
import { writeInsight } from './insightEvents';

export type InterestStatus = 'pending' | 'accepted' | 'declined';
export type InterestReply = { uid: string; name: string; note?: string };
function listing(board: string, id: string) {
  if (!firebase) throw new Error('Sign in to continue.');
  return doc(firebase.db, 'communities', board, 'listings', id);
}
export async function myInterest(board: string, id: string, uid: string) {
  const result = await getDocFromServer(doc(listing(board, id), 'requests', uid));
  return result.data()?.status as InterestStatus | undefined;
}
export async function requestInterest(
  board: string,
  id: string,
  uid: string,
  name: string,
  note?: string,
) {
  if (note !== undefined && (!note.trim() || note.trim().length > 500))
    throw new Error('Enter a reply of up to 500 characters.');
  const item = listing(board, id);
  const batch = writeBatch(firebase!.db);
  batch.set(doc(item, 'requests', uid), {
    status: 'pending',
    name: name.trim(),
    ...(note !== undefined ? { note: note.trim() } : {}),
    createdAt: serverTimestamp(),
  });
  writeInsight(batch, 'reply', uid, board, id);
  await batch.commit();
}
export async function requestNames(
  board: string,
  id: string,
  status: InterestStatus,
): Promise<InterestReply[]> {
  const result = await getDocsFromServer(
    query(collection(listing(board, id), 'requests'), where('status', '==', status), limit(20)),
  );
  return result.docs.map((snapshot) => ({
    uid: snapshot.id,
    name: String(snapshot.data().name),
    note: typeof snapshot.data().note === 'string' ? (snapshot.data().note as string) : undefined,
  }));
}
export async function decide(board: string, id: string, buyer: string, accept: boolean) {
  const item = listing(board, id);
  const request = doc(item, 'requests', buyer);
  await runTransaction(firebase!.db, async (tx) => {
    const offer = await tx.get(item);
    const interest = await tx.get(request);
    if (
      offer.data()?.status !== 'available' ||
      interest.data()?.status !== 'pending' ||
      (accept && offer.data()?.askDeadline?.toMillis() <= Date.now())
    )
      throw new Error('Offer changed.');
    tx.update(request, { status: accept ? 'accepted' : 'declined' });
    if (accept) {
      tx.set(doc(item, 'private', 'reservation'), { buyer });
      tx.update(item, { status: 'reserved' });
      writeInsight(tx, 'match', String(offer.data()?.ownerId), board, id);
    }
  });
}
