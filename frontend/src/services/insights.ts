import {
  collection,
  doc,
  documentId,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { firebase } from './firebase';
import type { Category, Status } from './feedback';
import type { InsightEvent } from './insightEvents';

export type ReportInsight = {
  uid: string;
  guest: boolean;
  category: Category;
  status: Status;
  createdAt: Timestamp;
  resolvedAt: Timestamp | null;
};
export type Insights = {
  events: InsightEvent[];
  reports: ReportInsight[];
  importedAt?: Timestamp;
};

export async function canViewInsights(user: User) {
  return (
    user.emailVerified &&
    (await getDocFromServer(doc(firebase!.db, 'insightsAdmins', user.uid))).exists()
  );
}

async function readRows<T>(path: string): Promise<T[]> {
  const ref = collection(firebase!.db, path);
  const rows: T[] = [];
  let cursor: QueryDocumentSnapshot<DocumentData> | undefined;
  // shortcut: bounded on-demand reads for the pilot, add dated rollups before exceeding this cap.
  for (let page = 0; page < 20; page++) {
    const snapshot = await getDocsFromServer(
      query(ref, orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(250)),
    );
    rows.push(...snapshot.docs.map((item) => item.data() as T));
    if (snapshot.size < 250) return rows;
    cursor = snapshot.docs.at(-1);
  }
  throw new Error(
    'Insights reached the pilot read limit. Add summary rollups before loading more records.',
  );
}

export async function loadInsights(): Promise<Insights> {
  const [events, reports, coverage] = await Promise.all([
    readRows<InsightEvent>('insightEvents'),
    readRows<ReportInsight>('insightReports'),
    getDocFromServer(doc(firebase!.db, 'insightCoverage', 'current')),
  ]);
  return { events, reports, importedAt: coverage.data()?.importedAt as Timestamp | undefined };
}
