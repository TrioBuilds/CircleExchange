import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  type Timestamp,
  type DocumentReference,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { firebase } from './firebase';

export type InsightKind =
  | 'signup'
  | 'verified'
  | 'join'
  | 'offer'
  | 'ask'
  | 'reply'
  | 'match'
  | 'closed'
  | 'confirmed';
export type InsightEvent = {
  kind: InsightKind;
  uid: string;
  circle: string;
  post: string;
  at: Timestamp | null;
};

function eventId(kind: InsightKind, uid: string, circle: string, post: string) {
  if (kind === 'signup' || kind === 'verified') return [kind, uid].join('~');
  if (kind === 'join') return [kind, circle, uid].join('~');
  return [kind, circle, post, ...(kind === 'reply' ? [uid] : [])].join('~');
}

function reference(kind: InsightKind, uid: string, circle: string, post: string) {
  return doc(firebase!.db, 'insightEvents', eventId(kind, uid, circle, post));
}

export function writeInsight(
  batch: { set(ref: DocumentReference, data: Record<string, unknown>): unknown },
  kind: InsightKind,
  uid: string,
  circle = '',
  post = '',
) {
  const data = { kind, uid, circle, post, at: serverTimestamp() };
  const ref = reference(kind, uid, circle, post);
  batch.set(ref, data);
}

export async function recordSignup(user: User) {
  if (!firebase || user.isAnonymous) return;
  await user.getIdToken();
  await runTransaction(firebase.db, async (tx) => {
    if (!(await tx.get(reference('signup', user.uid, '', ''))).exists())
      writeInsight(tx, 'signup', user.uid);
  });
}

export async function recordVerification(user: User) {
  if (!firebase || !user.emailVerified || user.isAnonymous) return;
  const db = firebase.db;
  const signup = await getDocFromServer(reference('signup', user.uid, '', ''));
  if (!signup.exists()) return;
  await runTransaction(db, async (tx) => {
    if (!(await tx.get(reference('verified', user.uid, '', ''))).exists())
      writeInsight(tx, 'verified', user.uid);
  });
}

export async function saveLocalityMembership(uid: string, areaId: string) {
  const db = firebase!.db;
  const member = doc(db, 'localityMemberships', uid);
  await runTransaction(db, async (tx) => {
    const [current, recorded] = await Promise.all([
      tx.get(member),
      tx.get(reference('join', uid, areaId, '')),
    ]);
    if (current.data()?.areaId === areaId) return;
    tx.set(member, { areaId });
    if (!recorded.exists()) writeInsight(tx, 'join', uid, areaId);
  });
}
