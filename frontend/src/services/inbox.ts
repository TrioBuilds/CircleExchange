import {
  collection, doc, getDocFromServer, getDocsFromServer, limit, orderBy, query, startAfter, where,
  type Firestore, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { InterestStatus } from './interest';

export type Board = { id: string; name: string };
export type Folder = 'Sent' | 'Received';
export type Entry = {
  board: Board; listingId: string; title: string; buyer: string; name: string;
  status: InterestStatus; available: boolean; createdAt: number;
};

// Read canonical requests so previously submitted requests and live decisions appear without migration.
// Yield after each bounded batch. Empty batches can be followed by older matching requests.
async function* boardPages(db: Firestore, board: Board, uid: string, folder: Folder): AsyncGenerator<Entry[], Entry[]> {
  let after: QueryDocumentSnapshot | undefined;
  while (true) {
    const listings = collection(db,'communities',board.id,'listings');
    const page = await getDocsFromServer(query(listings,
      ...(folder === 'Received' ? [where('ownerId','==',uid)] : []),
      ...(folder === 'Sent' ? [orderBy('createdAt','desc')] : []),
      ...(after ? [startAfter(after)] : []), limit(10)));
    const entries: Entry[] = [];
    for (const item of page.docs) {
      const data = item.data();
      const requests = collection(item.ref,'requests');
      const entry = (buyer: string, request: Record<string, unknown>): Entry => ({
        board, listingId:item.id, title:String(data.title), buyer, name:String(request.name),
        status:request.status as InterestStatus, available:data.status === 'available',
        createdAt:(request.createdAt as {toMillis:()=>number}).toMillis(),
      });
      if (folder === 'Sent') {
        if (data.ownerId === uid) continue;
        const own = await getDocFromServer(doc(requests,uid));
        if (own.exists()) entries.push(entry(uid,own.data()));
      } else {
        let cursor: QueryDocumentSnapshot | undefined;
        while (true) {
          const batch = await getDocsFromServer(query(requests,orderBy('createdAt','desc'),
            ...(cursor ? [startAfter(cursor)] : []),limit(20)));
          entries.push(...batch.docs.map(request => entry(request.id,request.data())));
          if (batch.size < 20) break;
          yield entries.splice(0);
          cursor = batch.docs[batch.size-1];
        }
      }
    }
    if (page.size < 10) return entries;
    yield entries;
    after = page.docs[page.size-1];
  }
}

export async function* inboxPages(db: Firestore, boards: Board[], uid: string, folder: Folder): AsyncGenerator<Entry[], Entry[]> {
  let readers = boards.map(board => boardPages(db,board,uid,folder));
  while (readers.length) {
    const pages = await Promise.all(readers.map(reader => reader.next()));
    const rows = pages.flatMap(page => page.value);
    readers = readers.filter((_,index) => !pages[index].done);
    if (!readers.length) return rows;
    yield rows;
  }
  return [];
}
