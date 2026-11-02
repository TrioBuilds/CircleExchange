import { readFileSync } from 'node:fs';
import { COMPANIES } from '../frontend/src/companies';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { query, orderBy, limit, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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

describe('automatic company membership', () => {
  const member = (domain = 'hp.com') => ({ emailDomain: domain, role: 'member', status: 'active', workLocation: '', branch: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  const employee = (email: string, uid = 'ada', verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
  it.each([...COMPANIES, {id:'linkedin.com', domain:'linkedin.com'}, {id:'new.co.uk', domain:'new.co.uk'}])('creates a member of $id from a verified exact domain', async ({id,domain}) => {
    const ref = doc(employee(`ada@${domain}`), `communities/${id}/members/ada`);
    await assertSucceeds(setDoc(ref, member(domain)));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { workLocation:'Bengaluru', branch:'Campus A', updatedAt:serverTimestamp() }));
  });
  it('keeps personal domains out and lookalike domains isolated', async () => {
    for (const domain of ['gmail.com','yahoo.co.in','outlook.com','pm.me']) {
      await assertFails(setDoc(doc(employee('ada@' + domain), 'communities/' + domain + '/members/ada'), member(domain)));
    }
    const db = employee('ada@linkedin.com.evil.org');
    await assertFails(setDoc(doc(db,'communities/linkedin.com/members/ada'),member('linkedin.com')));
    await assertSucceeds(setDoc(doc(db,'communities/linkedin.com.evil.org/members/ada'),member('linkedin.com.evil.org')));
  });
  it('accepts case-insensitive company domains', async () => {
    await assertSucceeds(setDoc(doc(employee('Ada@HP.COM'), 'communities/hp/members/ada'), member()));
  });
  it.each(['ada@gmail.com','ada@yahoo.com','ada@other.com','ada@hp.com.evil.org','ada@fakehp.com','ada@sub.hp.com','ada@google.com'])('rejects HP membership for %s', async (email) => {
    await assertFails(setDoc(doc(employee(email), 'communities/hp/members/ada'), member()));
  });
  it('rejects anonymous, unverified and missing-email identities', async () => {
    for (const db of [env.unauthenticatedContext().firestore(), employee('ada@hp.com','ada',false), user()]) {
      await assertFails(setDoc(doc(db,'communities/hp/members/ada'),member()));
    }
  });
  it('rejects other-user creation, reading, editing and member enumeration', async () => {
    await setDoc(doc(employee('ada@hp.com'),'communities/hp/members/ada'),member());
    const db=employee('bob@hp.com','bob'); const ref=doc(db,'communities/hp/members/ada');
    await assertFails(getDoc(ref)); await assertFails(updateDoc(ref,{workLocation:'Pune',updatedAt:serverTimestamp()}));
    await assertFails(setDoc(doc(db,'communities/hp/members/charlie'),member()));
    await assertFails(getDocs(collection(db,'communities/hp/members')));
  });
  it('rejects client-selected companies, identity fields and admin privileges', async () => {
    const ref=doc(employee('ada@hp.com'),'communities/hp/members/ada');
    for (const extra of [{role:'admin'},{emailDomain:'google.com'},{status:'approved'},{companyId:'google'},{email:'admin@hp.com'}]) {
      await assertFails(setDoc(ref,{...member(),...extra}));
    }
    await assertFails(setDoc(doc(employee('ada@hp.com'),'communities/google/members/ada'),member('google.com')));
  });
  it('validates field types, lengths and timestamps', async () => {
    const ref=doc(employee('ada@hp.com'),'communities/hp/members/ada');
    for(const extra of [{workLocation:'x'.repeat(81)},{branch:42},{createdAt:new Date(0)},{updatedAt:new Date(0)}]) {
      await assertFails(setDoc(ref,{...member(),...extra}));
    }
    await setDoc(ref,member());
    await assertFails(updateDoc(ref,{role:'admin',updatedAt:serverTimestamp()}));
    await assertFails(updateDoc(ref,{createdAt:new Date(0),updatedAt:serverTimestamp()}));
  });
  it('denies old-company access after the verified email changes', async () => {
    await setDoc(doc(employee('ada@hp.com'),'communities/hp/members/ada'),member());
    const ref=doc(employee('ada@google.com'),'communities/hp/members/ada');
    await assertFails(getDoc(ref)); await assertFails(updateDoc(ref,{branch:'Other',updatedAt:serverTimestamp()}));
  });
  it('prevents restoring revoked membership, including delete and recreate', async () => {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(),'communities/hp/members/ada'),{...member(),status:'revoked'});
    });
    const ref=doc(employee('ada@hp.com'),'communities/hp/members/ada');
    await assertSucceeds(getDoc(ref));
    await assertFails(updateDoc(ref,{status:'active',updatedAt:serverTimestamp()}));
    await assertFails(updateDoc(ref,{branch:'New office',updatedAt:serverTimestamp()}));
    await assertFails(deleteDoc(ref));
    await assertFails(setDoc(ref,member()));
  });
  it('does not expose company metadata, listings or messages just because email is verified', async () => {
    const db=employee('ada@hp.com');
    await assertFails(setDoc(doc(db,'communities/hp'),{name:'HP'}));
    await assertFails(getDoc(doc(db,'communities/hp/listings/test')));
    await assertFails(setDoc(doc(db,'communities/hp/conversations/test'),{buyerId:'ada'}));
  });
});

describe('company listings', () => {
  const path = 'communities/hp/listings';
  const employee = (uid: string, email = uid + '@hp.com', verified = true) =>
    env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
  const listing = () => ({ ownerId: 'ada', title: 'Desk', description: 'Oak desk', pickup: 'Lobby',
    category: 'goods', pricePaise: 0, status: 'available', createdAt: serverTimestamp() });
  async function enroll(uid: string, status = 'active') {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'communities/hp/members/' + uid), { status });
    });
  }
  it('lets colleagues browse and only the owner mark an item exchanged', async () => {
    await enroll('ada'); await enroll('bob');
    const owner = doc(employee('ada'), path, 'one');
    const colleague = employee('bob');
    await assertSucceeds(setDoc(owner, listing()));
    await assertSucceeds(getDocs(query(collection(colleague, path), orderBy('createdAt', 'desc'), limit(21))));
    await assertSucceeds(getDoc(doc(colleague, path, 'one')));
    await assertFails(updateDoc(doc(colleague, path, 'one'), { status: 'exchanged' }));
    await assertSucceeds(updateDoc(owner, { status: 'exchanged' }));
    await assertFails(updateDoc(owner, { status: 'available' }));
    await assertFails(deleteDoc(owner));
  });
  it('denies direct reads, feed queries and writes outside active verified membership', async () => {
    await enroll('ada');
    await setDoc(doc(employee('ada'), path, 'one'), listing());
    await enroll('revoked', 'revoked');
    for (const db of [employee('ada', 'ada@google.com'), employee('ada', 'ada@hp.com', false),
      employee('revoked'), employee('missing'), env.unauthenticatedContext().firestore()]) {
      await assertFails(getDoc(doc(db, path, 'one')));
      await assertFails(getDocs(query(collection(db, path), limit(21))));
    }
    await enroll('ada', 'revoked');
    await assertFails(setDoc(doc(employee('ada'), path, 'new'), listing()));
    await assertFails(updateDoc(doc(employee('ada'), path, 'one'), { status: 'exchanged' }));
  });
  it('rejects forged or malformed offers and unbounded feed reads', async () => {
    await enroll('ada');
    const db = employee('ada');
    for (const invalid of [{ ownerId: 'bob' }, { pricePaise: -1 }, { pricePaise: 1.5 }, { title: '  ' },
      { pickup: '' }, { category: 'Unknown' }, { status: 'exchanged' }, { secret: true }, { createdAt: new Date(0) }]) {
      await assertFails(setDoc(doc(db, path, 'one'), { ...listing(), ...invalid }));
    }
    await assertSucceeds(setDoc(doc(db, path, 'one'), { ...listing(), pricePaise: 5999 }));
    await assertFails(getDocs(collection(db, path)));
  });
});
