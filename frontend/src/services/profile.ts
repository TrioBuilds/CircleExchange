import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firebase } from './firebase';

export async function loadProfile(uid: string): Promise<string> {
  if (!firebase) throw new Error('Firebase is not configured.');
  const snapshot = await getDoc(doc(firebase.db, 'users', uid));
  return snapshot.exists() ? String(snapshot.data().displayName) : '';
}
export async function saveProfile(uid: string, name: string): Promise<void> {
  if (!firebase) throw new Error('Firebase is not configured.');
  const displayName = name.trim();
  if (displayName.length < 2 || displayName.length > 60) throw new Error('Use a name between 2 and 60 characters.');
  const reference = doc(firebase.db, 'users', uid);
  await runTransaction(firebase.db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (snapshot.exists()) transaction.update(reference, { displayName, updatedAt: serverTimestamp() });
    else transaction.set(reference, { displayName, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
}
