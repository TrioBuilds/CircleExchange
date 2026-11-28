import { signInAnonymously, type User } from 'firebase/auth';
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { companyForEmail, isPersonalEmail } from '../companies';
import { firebase } from './firebase';

export const categories = {
  bug: 'Something broke',
  idea: 'I have an idea',
  experience: 'My experience',
};
export type Category = keyof typeof categories;
export const statuses = [
  'new',
  'reviewing',
  'planned',
  'in progress',
  'shipped',
  'closed',
] as const;
export type Status = (typeof statuses)[number];

export type Report = {
  id: string;
  reporterUid: string;
  email: string;
  verified: boolean;
  name: string;
  category: Category;
  body: string;
  screen: string;
  version: string;
  viewport: string;
  browser: string;
  language: string;
  circle: string;
  status: Status;
  createdAt: Timestamp;
  resolvedAt?: Timestamp | null;
};
export type Triage = { priority: 'normal' | 'high'; notes: string; issue: number };
export type Reply = { author: 'team' | 'reporter'; body: string };
export type ReportCursor = QueryDocumentSnapshot<DocumentData>;
export const maxImageBytes = 150 * 1024;

export function feedbackScreen(user: User | null) {
  if (!user || user.isAnonymous) return 'Welcome';
  if (!user.emailVerified) return 'Email verification';
  const path = location.pathname.replace(/\/$/, '');
  if (path === '/profile') return 'Profile';
  if (path === '/requests') return 'Requests';
  if (path === '/feedback') return 'Feedback history';
  if (path === '' || path === '/feed')
    return new URLSearchParams(location.search).has('listing') ? 'Shared listing' : 'Feed';
  return 'Other';
}

export async function prepareFeedbackImage(file: File): Promise<Blob> {
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose an image under 12 MB.');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => header[i] === byte);
  const jpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const webp =
    String.fromCharCode(...header.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  if (!png && !jpeg && !webp) throw new Error('Choose a PNG, JPEG, or WebP image.');

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('That image could not be opened. Try a different one.');
  });
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Your browser could not prepare this image.');
    for (const size of [1600, 1200, 800, 560]) {
      const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.8),
      );
      if (blob && blob.size <= maxImageBytes) return blob;
    }
    throw new Error('This image is too large after compression. Try a cropped screenshot.');
  } finally {
    bitmap.close();
  }
}

export function newFeedbackKey() {
  return doc(collection(firebase!.db, 'feedback')).id;
}

async function loadCircle(user: User) {
  if (!user.emailVerified) return '';
  const { db } = firebase!;
  if (isPersonalEmail(user.email)) {
    const membership = await getDocFromServer(doc(db, 'localityMemberships', user.uid));
    return String(membership.data()?.areaId ?? '');
  }
  const company = companyForEmail(user.email);
  if (!company) return '';
  const membership = await getDocFromServer(
    doc(db, 'communities', company.id, 'members', user.uid),
  );
  return membership.data()?.status === 'active' ? company.name : '';
}

export async function submitFeedback(
  key: string,
  category: Category,
  body: string,
  screen: string,
  images: Blob[],
) {
  const { auth, db } = firebase!;
  const settings = (await getDocFromServer(doc(db, 'feedbackConfig', 'pilot'))).data();
  if (settings?.enabled !== true) throw new Error('Feedback is currently paused.');
  let user = auth.currentUser;
  if ((!user || user.isAnonymous) && settings.guests !== true)
    throw new Error('Sign in to send feedback.');
  user ??= (await signInAnonymously(auth)).user;
  const { uid } = user;
  const reference = doc(db, 'feedback', uid + '_' + key);
  const usageRef = doc(db, 'feedbackUsage', 'pilot');
  const limitRef = doc(db, 'feedbackLimits', uid);
  const [token, bytes, circle] = await Promise.all([
    user.getIdTokenResult(),
    Promise.all(
      images.map(async (blob) => Bytes.fromUint8Array(new Uint8Array(await blob.arrayBuffer()))),
    ),
    loadCircle(user).catch(() => ''),
  ]);
  return runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    if (existing.exists()) return reference.id;
    const [cooldown, profile] = await Promise.all([
      transaction.get(limitRef),
      transaction.get(doc(db, 'users', uid)),
    ]);
    const last = cooldown.data()?.updatedAt as Timestamp | undefined;
    if (last && Date.now() < last.toMillis() + 300_000)
      throw new Error('Please wait five minutes between feedback reports.');
    const marker = { reportId: reference.id, updatedAt: serverTimestamp() };
    transaction.set(usageRef, { ...marker, count: increment(1) });
    transaction.set(limitRef, marker);
    transaction.set(reference, {
      reporterUid: uid,
      email: token.claims.email ?? '',
      verified: token.claims.email_verified === true,
      name: profile.data()?.displayName ?? '',
      category,
      body,
      screen,
      version: (import.meta.env.VITE_APP_VERSION || 'local').slice(0, 40),
      viewport: innerWidth + 'x' + innerHeight,
      browser: navigator.userAgent.slice(0, 255),
      language: navigator.language.slice(0, 35),
      circle: circle.slice(0, 253),
      createdAt: serverTimestamp(),
      status: 'new',
    });
    bytes.forEach((imageBytes, i) =>
      transaction.set(doc(reference, 'feedbackImages', String(i)), { imageBytes }),
    );
    return reference.id;
  });
}

export async function canManageFeedback(user: User) {
  return (
    user.emailVerified &&
    (await getDocFromServer(doc(firebase!.db, 'feedbackAdmins', user.uid))).exists()
  );
}

export async function listFeedback(uid: string, admin: boolean, cursor?: ReportCursor) {
  const snapshot = await getDocsFromServer(
    query(
      collection(firebase!.db, 'feedback'),
      ...(admin ? [] : [where('reporterUid', '==', uid)]),
      orderBy('createdAt', 'desc'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(25),
    ),
  );
  return {
    reports: snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Report),
    next: snapshot.size === 25 ? snapshot.docs.at(-1) : undefined,
  };
}

export async function loadFeedbackDetail(id: string, admin: boolean) {
  const { db } = firebase!;
  const [thread, triage, ...images] = await Promise.all([
    getDocFromServer(doc(db, 'feedbackThreads', id)),
    admin ? getDocFromServer(doc(db, 'feedbackTriage', id)) : undefined,
    ...['0', '1'].map((slot) => getDocFromServer(doc(db, 'feedback', id, 'feedbackImages', slot))),
  ]);
  return {
    messages: (thread.data()?.messages ?? []) as Reply[],
    triage: (triage?.data() ?? { priority: 'normal', notes: '', issue: 0 }) as Triage,
    images: images.flatMap((image) => {
      const bytes = image.data()?.imageBytes as Bytes | undefined;
      return bytes
        ? [
            {
              slot: image.id,
              blob: new Blob([new Uint8Array(bytes.toUint8Array())], { type: 'image/jpeg' }),
            },
          ]
        : [];
    }),
  };
}

export function sendFeedbackReply(id: string, author: Reply['author'], body: string) {
  const { db } = firebase!;
  const ref = doc(db, 'feedbackThreads', id);
  return runTransaction(db, async (transaction) => {
    const previous = (await transaction.get(ref)).data()?.messages ?? [];
    if (previous.length >= 30) throw new Error('This report has reached its reply limit.');
    const messages: Reply[] = [...previous, { author, body }];
    transaction.set(ref, { messages, updatedAt: serverTimestamp() });
    return messages;
  });
}

export async function saveFeedbackTriage(
  id: string,
  status: Status,
  triage: Triage,
  original: Status,
) {
  const { db } = firebase!;
  const batch = writeBatch(db);
  batch.set(doc(db, 'feedbackTriage', id), triage);
  if (status !== original)
    batch.update(doc(db, 'feedback', id), {
      status,
      resolvedAt: status === 'closed' || status === 'shipped' ? serverTimestamp() : null,
    });
  await batch.commit();
}

export function removeFeedbackImage(id: string, slot: string) {
  return deleteDoc(doc(firebase!.db, 'feedback', id, 'feedbackImages', slot));
}
