import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
let env: RulesTestEnvironment;
beforeAll(async () => { env = await initializeTestEnvironment({ projectId: 'demo-circleexchange', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } }); });
beforeEach(async () => { await env.clearFirestore(); });
afterAll(async () => { await env?.cleanup(); });
const profile = () => ({ displayName: 'Ada', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
function user(uid = 'ada', verified = true) { return env.authenticatedContext(uid, { email_verified: verified }).firestore(); }
describe('private profiles', () => {
  it('permits verified owners to create, read and edit their own profile', async () => {
    const ref = doc(user(), 'users/ada'); await assertSucceeds(setDoc(ref, profile()));
    await assertSucceeds(getDoc(ref)); await assertSucceeds(updateDoc(ref, { displayName: 'Ada Lovelace', updatedAt: serverTimestamp() }));
  });
  it('rejects anonymous and unverified writes', async () => {
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), 'users/ada'), profile()));
    await assertFails(setDoc(doc(user('ada', false), 'users/ada'), profile()));
  });
  it('rejects cross-user access and profile enumeration', async () => {
    await setDoc(doc(user(), 'users/ada'), profile()); const other = user('bob');
    await assertFails(getDoc(doc(other, 'users/ada'))); await assertFails(setDoc(doc(other, 'users/ada'), profile()));
    await assertFails(getDocs(collection(user(), 'users')));
  });
  it('rejects self-assigned roles, verification and extra fields', async () => {
    await assertFails(setDoc(doc(user(), 'users/ada'), { ...profile(), role: 'admin', verified: true }));
  });
  it('rejects invalid names and forged timestamps', async () => {
    const ref = doc(user(), 'users/ada');
    await assertFails(setDoc(ref, { ...profile(), displayName: ' ' }));
    await assertFails(setDoc(ref, { ...profile(), displayName: 'a'.repeat(61) }));
    await assertFails(setDoc(ref, { ...profile(), createdAt: new Date(0) }));
    await setDoc(ref, profile()); await assertFails(updateDoc(ref, { createdAt: new Date(0), updatedAt: serverTimestamp() }));
  });
  it('keeps future community and marketplace collections closed', async () => {
    await assertFails(setDoc(doc(user(), 'communities/test/members/ada'), { role: 'admin' }));
    await assertFails(getDoc(doc(user(), 'communities/test/listings/one')));
  });
});
