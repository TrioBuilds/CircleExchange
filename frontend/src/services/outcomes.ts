import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { firebase } from './firebase';
import { writeInsight } from './insightEvents';

export type Outcome = {
  ownerConfirmedAt: Timestamp | null;
  partnerConfirmedAt: Timestamp | null;
  confirmedAt: Timestamp | null;
};

function refs(board: string, listingId: string) {
  const item = doc(firebase!.db, 'communities', board, 'listings', listingId);
  return { item, outcome: doc(item, 'private', 'outcome') };
}

export async function loadOutcome(board: string, listingId: string) {
  const { outcome } = refs(board, listingId);
  return (await getDocFromServer(outcome)).data() as Outcome | undefined;
}

export function confirmOutcome(board: string, listingId: string, uid: string, isOwner: boolean) {
  const { item, outcome } = refs(board, listingId);
  return runTransaction(firebase!.db, async (tx) => {
    const [listing, snapshot] = await Promise.all([tx.get(item), tx.get(outcome)]);
    const data = snapshot.data() as Outcome | undefined;
    const own = isOwner ? 'ownerConfirmedAt' : 'partnerConfirmedAt';
    const other = isOwner ? 'partnerConfirmedAt' : 'ownerConfirmedAt';
    if (data?.[own]) return;
    const complete = !!data?.[other];
    tx.set(outcome, {
      ownerConfirmedAt: data?.ownerConfirmedAt ?? null,
      partnerConfirmedAt: data?.partnerConfirmedAt ?? null,
      [own]: serverTimestamp(),
      confirmedAt: complete ? serverTimestamp() : null,
    });
    if (complete) {
      writeInsight(tx, 'confirmed', uid, board, listingId);
      if (listing.data()?.status === 'reserved') tx.update(item, { status: 'exchanged' });
    }
  });
}
