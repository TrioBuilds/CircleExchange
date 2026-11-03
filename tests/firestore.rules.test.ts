import { inboxPages, type Folder } from '../frontend/src/services/inbox';
import type { Firestore } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { COMPANIES } from '../frontend/src/companies';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { writeBatch, query, orderBy, limit, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
let env: RulesTestEnvironment;
beforeAll(async () => { env = await initializeTestEnvironment({ projectId: 'demo-circleexchange', firestore: { host: '127.0.0.1', port: Number(process.env.RULES_TEST_PORT ?? 8080), rules: readFileSync('firestore.rules', 'utf8') } }); });
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

describe('Pune locality communities', () => {
  const apartment = 'local:pune:baner:alacrity', baner = 'local:pune:baner', pune = 'local:pune';
  const personal = (uid: string, email = uid + '@gmail.com', verified = true) =>
    env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
  it('allows confirmed residents to publish and browse in their hierarchy and drops old access after a move', async () => {
    const db = personal('ada');
    const membership = doc(db, 'localityMemberships/ada');
    await assertFails(getDocs(query(collection(db,'communities',apartment,'listings'),limit(21))));
    await assertSucceeds(setDoc(membership,{areaId:apartment}));
    for (const area of [apartment,baner,pune]) {
      await assertSucceeds(setDoc(doc(db,'communities',area,'listings','one'),{
        ownerId:'ada', title:'Book', description:'Paperback', pickup:'Lobby', category:'goods',
        pricePaise:0, status:'available', createdAt:serverTimestamp()
      }));
      await assertSucceeds(getDocs(query(collection(db,'communities',area,'listings'),limit(21))));
    }
    await assertFails(getDocs(query(collection(db,'communities','hp','listings'),limit(21))));
    await assertSucceeds(setDoc(membership,{areaId:pune}));
    await assertFails(getDoc(doc(db,'communities',apartment,'listings','one')));
    await assertFails(getDoc(doc(db,'communities',baner,'listings','one')));
    await assertSucceeds(getDoc(doc(db,'communities',pune,'listings','one')));
  });
  it('requires verified personal identity and an owner-selected directory entry', async () => {
    for(const db of [personal('ada','ada@hp.com'), personal('ada','ada@gmail.com',false), env.unauthenticatedContext().firestore()]) {
      await assertFails(setDoc(doc(db,'localityMemberships/ada'),{areaId:apartment}));
    }
    const ref=doc(personal('ada'),'localityMemberships/ada');
    await assertFails(setDoc(ref,{areaId:'unknown'}));
    await assertFails(setDoc(ref,{areaId:pune,latitude:18}));
    await assertFails(setDoc(doc(personal('bob'),'localityMemberships/ada'),{areaId:pune}));
    await assertSucceeds(setDoc(ref,{areaId:apartment}));
    await assertFails(getDoc(doc(personal('bob'),'localityMemberships/ada')));
  });
});

describe('private interest requests', () => {
  const path = 'communities/hp/listings/book';
  const account = (uid: string) => env.authenticatedContext(uid,{email:uid+'@hp.com',email_verified:true}).firestore();
  const request = () => ({name:'Buyer',status:'pending',createdAt:serverTimestamp()});
  it('keeps requests private and requires acceptance and reservation to commit together', async () => {
    await env.withSecurityRulesDisabled(async ctx => {
      for(const id of ['seller','buyer','second','third']) await setDoc(doc(ctx.firestore(),'communities/hp/members/'+id),{status:'active'});
      await setDoc(doc(ctx.firestore(),path),{ownerId:'seller',status:'available'});
    });
    const seller = account('seller'), buyer = account('buyer');
    const own = doc(buyer,path+'/requests/buyer');
    await assertSucceeds(setDoc(own,request()));
    await assertFails(setDoc(own,request()));
    await assertFails(getDoc(doc(account('second'),path+'/requests/buyer')));
    await assertFails(getDocs(query(collection(buyer,path+'/requests'),limit(20))));
    await assertSucceeds(getDocs(query(collection(seller,path+'/requests'),limit(20))));
    await assertFails(updateDoc(own,{status:'accepted'}));
    await assertFails(updateDoc(doc(seller,path),{status:'reserved'}));
    await assertFails(updateDoc(doc(seller,path+'/requests/buyer'),{status:'accepted'}));
    await assertFails(setDoc(doc(seller,path+'/requests/seller'),request()));
    await assertSucceeds(setDoc(doc(account('second'),path+'/requests/second'),request()));
    await assertSucceeds(updateDoc(doc(seller,path+'/requests/second'),{status:'declined'}));
    await assertSucceeds(setDoc(doc(account('third'),path+'/requests/third'),request()));
    const accept = (id:string) => {
      const batch = writeBatch(seller);
      batch.update(doc(seller,path+'/requests/'+id),{status:'accepted'});
      batch.set(doc(seller,path+'/private/reservation'),{buyer:id});
      batch.update(doc(seller,path),{status:'reserved'});
      return batch.commit();
    };
    await assertSucceeds(accept('buyer'));
    await assertFails(accept('third'));
    await assertSucceeds(getDoc(own));
    await assertFails(getDoc(doc(account('third'),path+'/private/reservation')));
    await assertSucceeds(updateDoc(doc(seller,path),{status:'exchanged'}));
  });
});
it('shows a prior request in the two participants’ inboxes and reflects the seller decision',async () => {
  const board = {id:'hp',name:'HP'};
  const account = (uid:string) => env.authenticatedContext(uid,{email:uid+'@hp.com',email_verified:true}).firestore();
  const seller = account('seller'), buyer = account('buyer'), other = account('other');
  const path = 'communities/hp/listings/book';
  await env.withSecurityRulesDisabled(async ctx => {
    for(const uid of ['seller','buyer','other']) await setDoc(doc(ctx.firestore(),'communities/hp/members/'+uid),{status:'active'});
    await setDoc(doc(ctx.firestore(),path),{ownerId:'seller',title:'Paperback',status:'available',createdAt:serverTimestamp()});
  });
  await setDoc(doc(buyer,path+'/requests/buyer'),{name:'Ada',status:'pending',createdAt:serverTimestamp()});
  const inbox = async (db:ReturnType<typeof account>, uid:string, folder:Folder) => {
    const page = await inboxPages(db as unknown as Firestore,[board],uid,folder).next();
    return page.value;
  };
  expect(await inbox(seller,'seller','Received')).toMatchObject([{title:'Paperback',name:'Ada',status:'pending'}]);
  expect(await inbox(buyer,'buyer','Sent')).toMatchObject([{status:'pending'}]);
  expect(await inbox(other,'other','Sent')).toEqual([]);
  expect(await inbox(other,'other','Received')).toEqual([]);
  const batch = writeBatch(seller);
  batch.update(doc(seller,path+'/requests/buyer'),{status:'accepted'});
  batch.set(doc(seller,path+'/private/reservation'),{buyer:'buyer'});
  batch.update(doc(seller,path),{status:'reserved'});
  await assertSucceeds(batch.commit());
  expect(await inbox(buyer,'buyer','Sent')).toMatchObject([{status:'accepted',available:false}]);
});
