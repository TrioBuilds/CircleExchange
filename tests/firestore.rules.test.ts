import { inboxPages, type Folder } from '../frontend/src/services/inbox';
import type { Firestore } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { COMPANIES } from '../frontend/src/companies';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Bytes,
  where,
  increment,
  writeBatch,
  Timestamp,
  query,
  orderBy,
  limit,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-circleexchange',
    firestore: {
      host: '127.0.0.1',
      port: Number(process.env.RULES_TEST_PORT ?? 8080),
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
});
afterAll(async () => {
  await env?.cleanup();
});
const profile = () => ({
  displayName: 'Ada',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
function user(uid = 'ada', verified = true) {
  return env.authenticatedContext(uid, { email_verified: verified }).firestore();
}
describe('private profiles', () => {
  it('permits verified owners to create, read and edit their own profile', async () => {
    const ref = doc(user(), 'users/ada');
    await assertSucceeds(setDoc(ref, profile()));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(
      updateDoc(ref, { displayName: 'Ada Lovelace', updatedAt: serverTimestamp() }),
    );
  });
  it('rejects anonymous and unverified writes', async () => {
    await assertFails(
      setDoc(doc(env.unauthenticatedContext().firestore(), 'users/ada'), profile()),
    );
    await assertFails(setDoc(doc(user('ada', false), 'users/ada'), profile()));
  });
  it('rejects cross-user access and profile enumeration', async () => {
    await setDoc(doc(user(), 'users/ada'), profile());
    const other = user('bob');
    await assertFails(getDoc(doc(other, 'users/ada')));
    await assertFails(setDoc(doc(other, 'users/ada'), profile()));
    await assertFails(getDocs(collection(user(), 'users')));
  });
  it('rejects self-assigned roles, verification and extra fields', async () => {
    await assertFails(
      setDoc(doc(user(), 'users/ada'), { ...profile(), role: 'admin', verified: true }),
    );
  });
  it('rejects invalid names and forged timestamps', async () => {
    const ref = doc(user(), 'users/ada');
    await assertFails(setDoc(ref, { ...profile(), displayName: ' ' }));
    await assertFails(setDoc(ref, { ...profile(), displayName: 'a'.repeat(61) }));
    await assertFails(setDoc(ref, { ...profile(), createdAt: new Date(0) }));
    await setDoc(ref, profile());
    await assertFails(updateDoc(ref, { createdAt: new Date(0), updatedAt: serverTimestamp() }));
  });
  it('keeps future community and marketplace collections closed', async () => {
    await assertFails(setDoc(doc(user(), 'communities/test/members/ada'), { role: 'admin' }));
    await assertFails(getDoc(doc(user(), 'communities/test/listings/one')));
  });
});

describe('automatic company membership', () => {
  const member = (domain = 'hp.com') => ({
    emailDomain: domain,
    role: 'member',
    status: 'active',
    workLocation: '',
    branch: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const employee = (email: string, uid = 'ada', verified = true) =>
    env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
  it.each([
    ...COMPANIES,
    { id: 'linkedin.com', domain: 'linkedin.com' },
    { id: 'new.co.uk', domain: 'new.co.uk' },
  ])('creates a member of $id from a verified exact domain', async ({ id, domain }) => {
    const ref = doc(employee(`ada@${domain}`), `communities/${id}/members/ada`);
    await assertSucceeds(setDoc(ref, member(domain)));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(
      updateDoc(ref, {
        workLocation: 'Bengaluru',
        branch: 'Campus A',
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it('keeps personal domains out and lookalike domains isolated', async () => {
    for (const domain of ['gmail.com', 'yahoo.co.in', 'outlook.com', 'pm.me']) {
      await assertFails(
        setDoc(
          doc(employee('ada@' + domain), 'communities/' + domain + '/members/ada'),
          member(domain),
        ),
      );
    }
    const db = employee('ada@linkedin.com.evil.org');
    await assertFails(
      setDoc(doc(db, 'communities/linkedin.com/members/ada'), member('linkedin.com')),
    );
    await assertSucceeds(
      setDoc(
        doc(db, 'communities/linkedin.com.evil.org/members/ada'),
        member('linkedin.com.evil.org'),
      ),
    );
  });
  it('accepts case-insensitive company domains', async () => {
    await assertSucceeds(
      setDoc(doc(employee('Ada@HP.COM'), 'communities/hp/members/ada'), member()),
    );
  });
  it.each([
    'ada@gmail.com',
    'ada@yahoo.com',
    'ada@other.com',
    'ada@hp.com.evil.org',
    'ada@fakehp.com',
    'ada@sub.hp.com',
    'ada@google.com',
  ])('rejects HP membership for %s', async (email) => {
    await assertFails(setDoc(doc(employee(email), 'communities/hp/members/ada'), member()));
  });
  it('rejects anonymous, unverified and missing-email identities', async () => {
    for (const db of [
      env.unauthenticatedContext().firestore(),
      employee('ada@hp.com', 'ada', false),
      user(),
    ]) {
      await assertFails(setDoc(doc(db, 'communities/hp/members/ada'), member()));
    }
  });
  it('rejects other-user creation, reading, editing and member enumeration', async () => {
    await setDoc(doc(employee('ada@hp.com'), 'communities/hp/members/ada'), member());
    const db = employee('bob@hp.com', 'bob');
    const ref = doc(db, 'communities/hp/members/ada');
    await assertFails(getDoc(ref));
    await assertFails(updateDoc(ref, { workLocation: 'Pune', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(db, 'communities/hp/members/charlie'), member()));
    await assertFails(getDocs(collection(db, 'communities/hp/members')));
  });
  it('rejects client-selected companies, identity fields and admin privileges', async () => {
    const ref = doc(employee('ada@hp.com'), 'communities/hp/members/ada');
    for (const extra of [
      { role: 'admin' },
      { emailDomain: 'google.com' },
      { status: 'approved' },
      { companyId: 'google' },
      { email: 'admin@hp.com' },
    ]) {
      await assertFails(setDoc(ref, { ...member(), ...extra }));
    }
    await assertFails(
      setDoc(doc(employee('ada@hp.com'), 'communities/google/members/ada'), member('google.com')),
    );
  });
  it('validates field types, lengths and timestamps', async () => {
    const ref = doc(employee('ada@hp.com'), 'communities/hp/members/ada');
    for (const extra of [
      { workLocation: 'x'.repeat(81) },
      { branch: 42 },
      { createdAt: new Date(0) },
      { updatedAt: new Date(0) },
    ]) {
      await assertFails(setDoc(ref, { ...member(), ...extra }));
    }
    await setDoc(ref, member());
    await assertFails(updateDoc(ref, { role: 'admin', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { createdAt: new Date(0), updatedAt: serverTimestamp() }));
  });
  it('denies old-company access after the verified email changes', async () => {
    await setDoc(doc(employee('ada@hp.com'), 'communities/hp/members/ada'), member());
    const ref = doc(employee('ada@google.com'), 'communities/hp/members/ada');
    await assertFails(getDoc(ref));
    await assertFails(updateDoc(ref, { branch: 'Other', updatedAt: serverTimestamp() }));
  });
  it('prevents restoring revoked membership, including delete and recreate', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'communities/hp/members/ada'), {
        ...member(),
        status: 'revoked',
      });
    });
    const ref = doc(employee('ada@hp.com'), 'communities/hp/members/ada');
    await assertSucceeds(getDoc(ref));
    await assertFails(updateDoc(ref, { status: 'active', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(ref, { branch: 'New office', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(ref));
    await assertFails(setDoc(ref, member()));
  });
  it('does not expose company metadata, listings or messages just because email is verified', async () => {
    const db = employee('ada@hp.com');
    await assertFails(setDoc(doc(db, 'communities/hp'), { name: 'HP' }));
    await assertFails(getDoc(doc(db, 'communities/hp/listings/test')));
    await assertFails(setDoc(doc(db, 'communities/hp/conversations/test'), { buyerId: 'ada' }));
  });
});

describe('company listings', () => {
  const path = 'communities/hp/listings';
  const employee = (uid: string, email = uid + '@hp.com', verified = true) =>
    env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
  const listing = () => ({
    ownerId: 'ada',
    title: 'Desk',
    description: 'Oak desk',
    pickup: 'Lobby',
    category: 'goods',
    pricePaise: 0,
    status: 'available',
    createdAt: serverTimestamp(),
  });
  async function enroll(uid: string, status = 'active') {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'communities/hp/members/' + uid), { status });
    });
  }
  it('lets colleagues browse and only the owner mark an item exchanged', async () => {
    await enroll('ada');
    await enroll('bob');
    const owner = doc(employee('ada'), path, 'one');
    const colleague = employee('bob');
    await assertSucceeds(setDoc(owner, listing()));
    await assertSucceeds(
      getDocs(query(collection(colleague, path), orderBy('createdAt', 'desc'), limit(21))),
    );
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
    for (const db of [
      employee('ada', 'ada@google.com'),
      employee('ada', 'ada@hp.com', false),
      employee('revoked'),
      employee('missing'),
      env.unauthenticatedContext().firestore(),
    ]) {
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
    for (const invalid of [
      { ownerId: 'bob' },
      { pricePaise: -1 },
      { pricePaise: 1.5 },
      { title: '  ' },
      { pickup: '' },
      { category: 'Unknown' },
      { status: 'exchanged' },
      { secret: true },
      { createdAt: new Date(0) },
    ]) {
      await assertFails(setDoc(doc(db, path, 'one'), { ...listing(), ...invalid }));
    }
    await assertSucceeds(setDoc(doc(db, path, 'one'), { ...listing(), pricePaise: 5999 }));
    await assertFails(getDocs(collection(db, path)));
  });
  it('validates discount fees, booking terms, and immutable deal details', async () => {
    await enroll('ada');
    await enroll('bob');
    const db = employee('ada');
    const discount = {
      maxDiscountPaise: 50000,
      bookedBy: 'helper',
      paymentTerms: 'After tickets are issued',
      failureTerms: 'No fee',
      cancellationTerms: 'Fee refunded if helper cancels',
    };
    const offer = { ...listing(), category: 'services', pickup: '', pricePaise: 20000, discount };
    const ref = doc(db, path, 'discount');
    await assertSucceeds(setDoc(ref, offer));
    await assertSucceeds(getDoc(doc(employee('bob'), path, 'discount')));
    await assertFails(updateDoc(ref, { pricePaise: 30000 }));
    await assertFails(updateDoc(ref, { discount: { ...discount, failureTerms: 'Fee retained' } }));
    await assertSucceeds(updateDoc(ref, { status: 'exchanged' }));
    await assertSucceeds(
      setDoc(doc(db, path, 'no-fee'), {
        ...offer,
        pricePaise: 0,
        discount: { ...discount, bookedBy: 'buyer' },
      }),
    );
    for (const invalid of [
      { pricePaise: -1 },
      { pricePaise: 1.5 },
      { pricePaise: 50000 },
      { category: 'goods' },
      { discount: null },
      { discount: { ...discount, maxDiscountPaise: 100000001 } },
      { discount: { ...discount, maxDiscountPaise: 50000.5 } },
      { discount: { ...discount, bookedBy: 'anyone' } },
      { discount: { ...discount, failureTerms: ' ' } },
      { discount: { ...discount, paymentTerms: 'x'.repeat(501) } },
      { discount: { ...discount, cancellationTerms: '' } },
      { discount: { ...discount, guaranteed: true } },
      { discount: { maxDiscountPaise: 50000 } },
    ]) {
      await assertFails(setDoc(doc(db, path, 'invalid'), { ...offer, ...invalid }));
    }
  });
});

describe('asks and help replies', () => {
  const path = 'communities/hp/listings/ask';
  const account = (uid: string) =>
    env.authenticatedContext(uid, { email: uid + '@hp.com', email_verified: true }).firestore();
  const ask = () => ({
    ownerId: 'asking',
    title: 'Movie ticket help',
    description: 'Two seats tonight',
    category: 'services',
    pickup: '',
    pricePaise: 0,
    status: 'available',
    createdAt: serverTimestamp(),
    askDeadline: Timestamp.fromMillis(Date.now() + 3600000),
  });
  const reply = () => ({
    name: 'Neighbor',
    note: 'I can help tonight for ₹100.',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  async function members() {
    await env.withSecurityRulesDisabled(async (context) => {
      for (const uid of ['asking', 'helper', 'other'])
        await setDoc(doc(context.firestore(), 'communities/hp/members/' + uid), {
          status: 'active',
        });
    });
  }
  const accept = (helper: string) => {
    const db = account('asking');
    const batch = writeBatch(db);
    batch.update(doc(db, path + '/requests/' + helper), { status: 'accepted' });
    batch.set(doc(db, path + '/private/reservation'), { buyer: helper });
    batch.update(doc(db, path), { status: 'reserved' });
    return batch.commit();
  };
  it('requires bounded future deadlines and preserves ask details after posting', async () => {
    await members();
    const db = account('asking');
    for (const invalid of [
      { askDeadline: Timestamp.fromMillis(Date.now() - 1000) },
      { askDeadline: Timestamp.fromMillis(Date.now() + 31 * 86400000) },
      { askDeadline: 'tomorrow' },
      { ownerId: 'helper' },
      { pricePaise: 100 },
      { pickup: 'Lobby' },
      { discount: {} },
    ])
      await assertFails(setDoc(doc(db, path), { ...ask(), ...invalid }));
    await assertSucceeds(setDoc(doc(db, path), ask()));
    await assertFails(
      updateDoc(doc(db, path), { askDeadline: Timestamp.fromMillis(Date.now() + 7200000) }),
    );
    await assertFails(getDoc(doc(account('outsider'), path)));
    await assertFails(setDoc(doc(db, path + '/requests/asking'), reply()));
    await assertSucceeds(updateDoc(doc(db, path), { status: 'exchanged' }));
    await assertFails(setDoc(doc(account('helper'), path + '/requests/helper'), reply()));
  });
  it('accepts one helper, exposes the reply in both inboxes, and protects the conversation', async () => {
    await members();
    await setDoc(doc(account('asking'), path), ask());
    await assertSucceeds(setDoc(doc(account('helper'), path + '/requests/helper'), reply()));
    await assertFails(setDoc(doc(account('helper'), path + '/requests/helper'), reply()));
    await assertFails(getDoc(doc(account('other'), path + '/requests/helper')));
    await setDoc(doc(account('other'), path + '/requests/other'), reply());
    const results = await Promise.allSettled([accept('helper'), accept('other')]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const winner = results[0].status === 'fulfilled' ? 'helper' : 'other';
    const loser = winner === 'helper' ? 'other' : 'helper';
    const sent = await inboxPages(
      account(winner),
      [{ id: 'hp', name: 'HP' }],
      winner,
      'Sent',
    ).next();
    expect(sent.value).toMatchObject([
      { status: 'accepted', askDeadline: expect.any(Number), note: 'I can help tonight for ₹100.' },
    ]);
    const received = await inboxPages(
      account('asking'),
      [{ id: 'hp', name: 'HP' }],
      'asking',
      'Received',
    ).next();
    expect(received.value.some((entry) => entry.status === 'accepted')).toBe(true);
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), path), {
        askDeadline: Timestamp.fromMillis(Date.now() - 1000),
      });
    });
    const message = {
      senderId: winner,
      text: 'I can book those seats',
      createdAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(account(winner), path + '/messages/one'), message));
    await assertSucceeds(
      getDocs(query(collection(account('asking'), path + '/messages'), limit(30))),
    );
    await assertFails(getDocs(query(collection(account(loser), path + '/messages'), limit(30))));
  });
  it('rejects new help and acceptance after expiry even with stale client data', async () => {
    await members();
    await setDoc(doc(account('asking'), path), ask());
    await setDoc(doc(account('helper'), path + '/requests/helper'), reply());
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), path), {
        askDeadline: Timestamp.fromMillis(Date.now() - 1000),
      });
    });
    await assertFails(setDoc(doc(account('other'), path + '/requests/other'), reply()));
    await assertFails(accept('helper'));
    await assertFails(getDocs(query(collection(account('helper'), path + '/messages'), limit(30))));
    await assertSucceeds(updateDoc(doc(account('asking'), path), { status: 'exchanged' }));
  });
  it('requires a bounded helper note and keeps it private and immutable', async () => {
    await members();
    await setDoc(doc(account('asking'), path), ask());
    const ref = doc(account('helper'), path + '/requests/helper');
    const legacy = { name: 'Helper', status: 'pending', createdAt: serverTimestamp() };
    await assertFails(setDoc(ref, legacy));
    for (const note of ['', ' ', 'x'.repeat(501), 123, null]) {
      await assertFails(setDoc(ref, { ...legacy, note }));
    }
    await assertSucceeds(setDoc(ref, reply()));
    expect((await getDoc(ref)).data()?.note).toBe(reply().note);
    expect((await getDoc(doc(account('asking'), path + '/requests/helper'))).data()?.note).toBe(
      reply().note,
    );
    await assertFails(getDoc(doc(account('other'), path + '/requests/helper')));
    await assertFails(updateDoc(ref, { note: 'Changed' }));
    await assertFails(
      updateDoc(doc(account('asking'), path + '/requests/helper'), { note: 'Changed' }),
    );
    await assertSucceeds(accept('helper'));
    expect((await getDoc(ref)).data()?.note).toBe(reply().note);
  });
  it('still lets the author accept a legacy ask reply without a note', async () => {
    await members();
    await setDoc(doc(account('asking'), path), ask());
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), path + '/requests/helper'), {
        name: 'Helper',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    });
    await assertSucceeds(getDoc(doc(account('asking'), path + '/requests/helper')));
    await assertSucceeds(accept('helper'));
  });
});

describe('Pune locality communities', () => {
  const apartment = 'local:pune:baner:alacrity',
    baner = 'local:pune:baner',
    pune = 'local:pune';
  const personal = (uid: string, email = uid + '@gmail.com', verified = true) =>
    env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
  it('allows confirmed residents to publish and browse in their hierarchy and drops old access after a move', async () => {
    const db = personal('ada');
    const membership = doc(db, 'localityMemberships/ada');
    await assertFails(
      getDocs(query(collection(db, 'communities', apartment, 'listings'), limit(21))),
    );
    await assertSucceeds(setDoc(membership, { areaId: apartment }));
    for (const area of [apartment, baner, pune]) {
      await assertSucceeds(
        setDoc(doc(db, 'communities', area, 'listings', 'one'), {
          ownerId: 'ada',
          title: 'Book',
          description: 'Paperback',
          pickup: 'Lobby',
          category: 'goods',
          pricePaise: 0,
          status: 'available',
          createdAt: serverTimestamp(),
        }),
      );
      await assertSucceeds(
        getDocs(query(collection(db, 'communities', area, 'listings'), limit(21))),
      );
    }
    await assertFails(getDocs(query(collection(db, 'communities', 'hp', 'listings'), limit(21))));
    await assertSucceeds(setDoc(membership, { areaId: pune }));
    await assertFails(getDoc(doc(db, 'communities', apartment, 'listings', 'one')));
    await assertFails(getDoc(doc(db, 'communities', baner, 'listings', 'one')));
    await assertSucceeds(getDoc(doc(db, 'communities', pune, 'listings', 'one')));
  });
  it('requires verified personal identity and an owner-selected directory entry', async () => {
    for (const db of [
      personal('ada', 'ada@hp.com'),
      personal('ada', 'ada@gmail.com', false),
      env.unauthenticatedContext().firestore(),
    ]) {
      await assertFails(setDoc(doc(db, 'localityMemberships/ada'), { areaId: apartment }));
    }
    const ref = doc(personal('ada'), 'localityMemberships/ada');
    await assertFails(setDoc(ref, { areaId: 'unknown' }));
    await assertFails(setDoc(ref, { areaId: pune, latitude: 18 }));
    await assertFails(setDoc(doc(personal('bob'), 'localityMemberships/ada'), { areaId: pune }));
    await assertSucceeds(setDoc(ref, { areaId: apartment }));
    await assertFails(getDoc(doc(personal('bob'), 'localityMemberships/ada')));
  });
});

describe('private interest requests', () => {
  const path = 'communities/hp/listings/book';
  const account = (uid: string) =>
    env.authenticatedContext(uid, { email: uid + '@hp.com', email_verified: true }).firestore();
  const request = () => ({ name: 'Buyer', status: 'pending', createdAt: serverTimestamp() });
  it('keeps requests private and requires acceptance and reservation to commit together', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      for (const id of ['seller', 'buyer', 'second', 'third'])
        await setDoc(doc(ctx.firestore(), 'communities/hp/members/' + id), { status: 'active' });
      await setDoc(doc(ctx.firestore(), path), { ownerId: 'seller', status: 'available' });
    });
    const seller = account('seller'),
      buyer = account('buyer');
    const own = doc(buyer, path + '/requests/buyer');
    await assertSucceeds(setDoc(own, request()));
    await assertFails(setDoc(own, request()));
    await assertFails(getDoc(doc(account('second'), path + '/requests/buyer')));
    await assertFails(getDocs(query(collection(buyer, path + '/requests'), limit(20))));
    await assertSucceeds(getDocs(query(collection(seller, path + '/requests'), limit(20))));
    await assertFails(updateDoc(own, { status: 'accepted' }));
    await assertFails(updateDoc(doc(seller, path), { status: 'reserved' }));
    await assertFails(updateDoc(doc(seller, path + '/requests/buyer'), { status: 'accepted' }));
    await assertFails(setDoc(doc(seller, path + '/requests/seller'), request()));
    await assertSucceeds(setDoc(doc(account('second'), path + '/requests/second'), request()));
    await assertSucceeds(updateDoc(doc(seller, path + '/requests/second'), { status: 'declined' }));
    await assertSucceeds(setDoc(doc(account('third'), path + '/requests/third'), request()));
    const accept = (id: string) => {
      const batch = writeBatch(seller);
      batch.update(doc(seller, path + '/requests/' + id), { status: 'accepted' });
      batch.set(doc(seller, path + '/private/reservation'), { buyer: id });
      batch.update(doc(seller, path), { status: 'reserved' });
      return batch.commit();
    };
    await assertSucceeds(accept('buyer'));
    await assertFails(accept('third'));
    await assertSucceeds(getDoc(own));
    await assertFails(getDoc(doc(account('third'), path + '/private/reservation')));
    await assertSucceeds(updateDoc(doc(seller, path), { status: 'exchanged' }));
  });
});
describe('accepted listing conversations', () => {
  const path = 'communities/hp/listings/book';
  const account = (uid: string) =>
    env.authenticatedContext(uid, { email: uid + '@hp.com', email_verified: true }).firestore();
  it('limits messages to the active accepted pair and authentic sender', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      for (const uid of ['seller', 'buyer', 'other'])
        await setDoc(doc(db, 'communities/hp/members/' + uid), { status: 'active' });
      await setDoc(doc(db, path), { ownerId: 'seller', status: 'reserved' });
      await setDoc(doc(db, path + '/private/reservation'), { buyer: 'buyer' });
      await setDoc(doc(db, path + '/requests/buyer'), { status: 'accepted' });
    });
    const seller = account('seller'),
      buyer = account('buyer'),
      other = account('other');
    const messages = path + '/messages';
    const text = { senderId: 'buyer', text: 'Meet at the lobby?', createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(buyer, messages, 'one'), text));
    await assertSucceeds(getDoc(doc(seller, messages, 'one')));
    await assertSucceeds(
      getDocs(query(collection(buyer, messages), orderBy('createdAt', 'desc'), limit(30))),
    );
    await assertFails(getDocs(collection(buyer, messages)));
    await assertFails(getDoc(doc(other, messages, 'one')));
    await assertFails(setDoc(doc(other, messages, 'two'), { ...text, senderId: 'other' }));
    await assertFails(setDoc(doc(buyer, messages, 'two'), { ...text, senderId: 'seller' }));
    await assertFails(setDoc(doc(buyer, messages, 'two'), { ...text, text: ' ' }));
    await assertFails(setDoc(doc(buyer, messages, 'two'), { ...text, text: 'x'.repeat(1001) }));
    await assertFails(updateDoc(doc(buyer, messages, 'one'), { text: 'Changed' }));
    await assertFails(deleteDoc(doc(buyer, messages, 'one')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'communities/hp/members/buyer'), { status: 'revoked' });
    });
    await assertFails(getDoc(doc(buyer, messages, 'one')));
    await assertFails(setDoc(doc(buyer, messages, 'two'), text));
  });
  it('blocks both users before acceptance', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      for (const uid of ['seller', 'buyer'])
        await setDoc(doc(db, 'communities/hp/members/' + uid), { status: 'active' });
      await setDoc(doc(db, path), { ownerId: 'seller', status: 'available' });
      await setDoc(doc(db, path + '/requests/buyer'), { status: 'pending' });
    });
    for (const uid of ['seller', 'buyer']) {
      const db = account(uid);
      await assertFails(getDocs(query(collection(db, path + '/messages'), limit(30))));
      await assertFails(
        setDoc(doc(db, path + '/messages/one'), {
          senderId: uid,
          text: 'Hello',
          createdAt: serverTimestamp(),
        }),
      );
    }
  });
});
it('shows a prior request in the two participants’ inboxes and reflects the seller decision', async () => {
  const board = { id: 'hp', name: 'HP' };
  const account = (uid: string) =>
    env.authenticatedContext(uid, { email: uid + '@hp.com', email_verified: true }).firestore();
  const seller = account('seller'),
    buyer = account('buyer'),
    other = account('other');
  const path = 'communities/hp/listings/book';
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const uid of ['seller', 'buyer', 'other'])
      await setDoc(doc(ctx.firestore(), 'communities/hp/members/' + uid), { status: 'active' });
    await setDoc(doc(ctx.firestore(), path), {
      ownerId: 'seller',
      title: 'Paperback',
      status: 'available',
      createdAt: serverTimestamp(),
    });
  });
  await setDoc(doc(buyer, path + '/requests/buyer'), {
    name: 'Ada',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  const inbox = async (db: ReturnType<typeof account>, uid: string, folder: Folder) => {
    const page = await inboxPages(db as unknown as Firestore, [board], uid, folder).next();
    return page.value;
  };
  expect(await inbox(seller, 'seller', 'Received')).toMatchObject([
    { title: 'Paperback', name: 'Ada', status: 'pending' },
  ]);
  expect(await inbox(buyer, 'buyer', 'Sent')).toMatchObject([{ status: 'pending' }]);
  expect(await inbox(other, 'other', 'Sent')).toEqual([]);
  expect(await inbox(other, 'other', 'Received')).toEqual([]);
  const batch = writeBatch(seller);
  batch.update(doc(seller, path + '/requests/buyer'), { status: 'accepted' });
  batch.set(doc(seller, path + '/private/reservation'), { buyer: 'buyer' });
  batch.update(doc(seller, path), { status: 'reserved' });
  await assertSucceeds(batch.commit());
  expect(await inbox(buyer, 'buyer', 'Sent')).toMatchObject([
    { status: 'accepted', available: false },
  ]);
});

describe('private feedback pilot', () => {
  const id = (uid = 'ada', suffix = 'A') => uid + '_' + suffix.repeat(20);
  const bytes = (size: number) => Bytes.fromUint8Array(new Uint8Array(size));
  function report(uid = 'ada') {
    return {
      reporterUid: uid,
      email: '',
      verified: uid !== 'guest',
      name: '',
      category: 'bug',
      body: 'I cannot open my circle.',
      screen: 'Email verification',
      version: 'abcd123',
      viewport: '390x844',
      browser: '',
      language: 'en',
      circle: '',
      createdAt: serverTimestamp(),
      status: 'new',
    };
  }
  function submit(
    db: Firestore,
    uid = 'ada',
    options: {
      suffix?: string;
      count?: number;
      imageSize?: number;
      slot?: string;
      data?: Record<string, unknown>;
    } = {},
  ) {
    const key = id(uid, options.suffix);
    const marker = { reportId: key, updatedAt: serverTimestamp() };
    const batch = writeBatch(db);
    const reportData = { ...report(uid), ...options.data };
    batch.set(doc(db, 'feedback', key), reportData);
    batch.set(doc(db, 'insightReports', key), {
      uid,
      guest: reportData.email === '',
      category: reportData.category,
      status: reportData.status,
      createdAt: reportData.createdAt,
      resolvedAt: null,
    });
    batch.set(doc(db, 'feedbackUsage/pilot'), { ...marker, count: options.count ?? increment(1) });
    batch.set(doc(db, 'feedbackLimits', uid), marker);
    if (options.imageSize !== undefined)
      batch.set(doc(db, 'feedback', key, 'feedbackImages', options.slot ?? '0'), {
        imageBytes: bytes(options.imageSize),
      });
    return batch.commit();
  }
  function guest() {
    return env
      .authenticatedContext('guest', { firebase: { sign_in_provider: 'anonymous' } })
      .firestore();
  }
  async function settings(values = { enabled: true, guests: true }) {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'feedbackConfig/pilot'), values);
      await setDoc(doc(context.firestore(), 'feedbackAdmins/founder'), {});
    });
  }
  const list = (db: Firestore, uid?: string) =>
    getDocs(
      query(
        collection(db, 'feedback'),
        ...(uid ? [where('reporterUid', '==', uid)] : []),
        orderBy('createdAt', 'desc'),
        limit(25),
      ),
    );
  const conversation = (db: Firestore) => doc(db, 'feedbackThreads', id());

  it('stores a complete guest submission and attachment only for the reporter and founder', async () => {
    await settings();
    const db = guest();
    await assertSucceeds(submit(db, 'guest', { imageSize: 153600 }));
    await assertSucceeds(list(db, 'guest'));
    await assertFails(list(db));
    await assertSucceeds(list(user('founder')));
    for (const path of [
      'feedback/' + id('guest'),
      'feedback/' + id('guest') + '/feedbackImages/0',
    ]) {
      await assertSucceeds(getDoc(doc(db, path)));
      await assertSucceeds(getDoc(doc(user('founder'), path)));
      await assertFails(getDoc(doc(user('founder', false), path)));
      await assertFails(getDoc(doc(user('bob'), path)));
      await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), path)));
    }
    await assertSucceeds(
      deleteDoc(doc(user('founder'), 'feedback', id('guest'), 'feedbackImages/0')),
    );
  });

  it('closes guest intake and all intake independently', async () => {
    await settings({ enabled: true, guests: false });
    await assertFails(submit(guest(), 'guest'));
    await assertSucceeds(submit(user()));
    await settings({ enabled: false, guests: true });
    await assertFails(submit(user('bob'), 'bob', { count: 2 }));
  });

  it('rejects bad identity snapshots and oversized or extra attachments atomically', async () => {
    await settings();
    await assertFails(submit(user(), 'ada', { data: { reporterUid: 'bob' } }));
    await assertFails(submit(user(), 'ada', { data: { email: 'other@example.com' } }));
    await assertFails(submit(user(), 'ada', { data: { name: 'Other person' } }));
    await assertFails(submit(user(), 'ada', { data: { body: '   ' } }));
    await assertFails(submit(user(), 'ada', { imageSize: 153601 }));
    await assertFails(submit(user(), 'ada', { slot: '2', imageSize: 1 }));
    await assertSucceeds(getDoc(doc(user(), 'feedback', id())));
    await assertFails(getDoc(doc(user(), 'feedbackUsage/pilot')));
    expect((await getDoc(doc(user('founder'), 'feedbackUsage/pilot'))).exists()).toBe(false);
    await assertSucceeds(submit(user()));
    await assertFails(
      setDoc(doc(user(), 'feedback', id(), 'feedbackImages/1'), { imageBytes: bytes(8) }),
    );
  });

  it('requires new reports and both quota markers to be written together', async () => {
    await settings();
    const db = user();
    await assertFails(setDoc(doc(db, 'feedback', id()), report()));
    await assertFails(
      setDoc(doc(db, 'feedbackUsage/pilot'), {
        count: 1,
        reportId: id(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(submit(db));
    await assertFails(submit(db, 'ada', { count: 2, suffix: 'B' }));
    await assertFails(submit(user('bob'), 'bob', { count: 1 }));
    await assertSucceeds(submit(user('bob'), 'bob', { count: 2 }));
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'feedbackUsage/pilot'), { count: 500 });
    });
    await assertFails(submit(user('cam'), 'cam', { count: 501 }));
  });

  it('allows the founder to triage privately and only participants to append replies', async () => {
    await settings();
    await submit(user());
    const founder = user('founder');
    const triage = { priority: 'high', issue: 42, notes: 'Internal investigation' };
    await assertFails(setDoc(doc(user(), 'feedbackAdmins/ada'), {}));
    await assertFails(setDoc(doc(user(), 'feedbackTriage', id()), triage));
    await assertSucceeds(setDoc(doc(founder, 'feedbackTriage', id()), triage));
    await assertFails(getDoc(doc(user(), 'feedbackTriage', id())));
    await assertSucceeds(getDoc(doc(founder, 'feedbackTriage', id())));
    await assertFails(
      updateDoc(doc(user(), 'feedback', id()), { status: 'closed', resolvedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(doc(founder, 'feedback', id()), {
        body: 'Altered',
        status: 'reviewing',
        resolvedAt: null,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(founder, 'feedback', id()), { status: 'reviewing', resolvedAt: null }),
    );
    const first = { author: 'team', body: 'Which screen showed the error?' };
    const second = { author: 'reporter', body: 'Email verification.' };
    const thread = (...messages: object[]) => ({ messages, updatedAt: serverTimestamp() });
    await assertFails(setDoc(conversation(user()), thread(first)));
    await assertSucceeds(setDoc(conversation(founder), thread(first)));
    await assertFails(getDoc(conversation(user('bob'))));
    await assertFails(setDoc(conversation(user()), thread(second)));
    await assertFails(setDoc(conversation(user('bob')), thread(first, second)));
    await assertSucceeds(setDoc(conversation(user()), thread(first, second)));
  });
});

describe('admin insights and confirmed exchanges', () => {
  const listing = 'communities/hp/listings/book';
  const path = listing + '/private/outcome';
  const hp = (uid: string) =>
    env.authenticatedContext(uid, { email: uid + '@hp.com', email_verified: true }).firestore();
  const event = (kind: string, uid: string, circle = '', post = '') => ({
    kind,
    uid,
    circle,
    post,
    at: serverTimestamp(),
  });

  it('separates insights from feedback and private source data', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'insightsAdmins/analyst'), {});
      await setDoc(doc(db, 'feedbackAdmins/support'), {});
      await setDoc(doc(db, 'insightReports/example'), { category: 'bug' });
      await setDoc(doc(db, 'feedback/example'), { reporterUid: 'member', body: 'Private report' });
      await setDoc(doc(db, 'users/member'), { displayName: 'Private' });
    });
    await assertSucceeds(getDoc(doc(user('analyst'), 'insightReports/example')));
    await assertFails(getDoc(doc(user('analyst', false), 'insightReports/example')));
    await assertFails(getDoc(doc(user('support'), 'insightReports/example')));
    await assertFails(getDoc(doc(user('analyst'), 'feedback/example')));
    await assertFails(getDoc(doc(user('analyst'), 'users/member')));
    await assertFails(setDoc(doc(user('member'), 'insightsAdmins/member'), {}));
    await assertSucceeds(getDocs(query(collection(user('analyst'), 'insightEvents'), limit(250))));
    await assertFails(getDocs(collection(user('analyst'), 'insightEvents')));
  });

  it('records onboarding once and ties a join to the underlying membership change', async () => {
    const member = env
      .authenticatedContext('local', { email: 'local@gmail.com', email_verified: true })
      .firestore();
    const unverified = env
      .authenticatedContext('new', { email: 'new@gmail.com', email_verified: false })
      .firestore();
    await assertFails(
      setDoc(doc(unverified, 'insightEvents/verified~new'), event('verified', 'new')),
    );
    await assertSucceeds(
      setDoc(doc(unverified, 'insightEvents/signup~new'), event('signup', 'new')),
    );
    await assertFails(setDoc(doc(unverified, 'insightEvents/signup~new'), event('signup', 'new')));
    const verified = env
      .authenticatedContext('new', { email: 'new@gmail.com', email_verified: true })
      .firestore();
    await assertSucceeds(
      setDoc(doc(verified, 'insightEvents/verified~new'), event('verified', 'new')),
    );
    const circle = 'local:pune:baner';
    const join = doc(member, 'insightEvents/join~' + circle + '~local');
    await assertSucceeds(getDoc(join));
    await assertFails(setDoc(join, event('join', 'local', circle)));
    const batch = writeBatch(member);
    batch.set(doc(member, 'localityMemberships/local'), { areaId: circle });
    batch.set(join, event('join', 'local', circle));
    await assertSucceeds(batch.commit());
  });

  it('records publishing, replies and matches only alongside the actual exchange action', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      for (const uid of ['seller', 'buyer']) {
        await setDoc(doc(context.firestore(), 'communities/hp/members', uid), { status: 'active' });
      }
    });
    const seller = hp('seller');
    const buyer = hp('buyer');
    const offer = doc(seller, 'insightEvents/offer~hp~book');
    const reply = doc(buyer, 'insightEvents/reply~hp~book~buyer');
    await assertFails(setDoc(offer, event('offer', 'seller', 'hp', 'book')));
    const publish = writeBatch(seller);
    publish.set(doc(seller, listing), {
      ownerId: 'seller',
      title: 'Book',
      description: 'Paperback',
      pickup: 'Lobby',
      category: 'goods',
      pricePaise: 0,
      status: 'available',
      createdAt: serverTimestamp(),
    });
    publish.set(offer, event('offer', 'seller', 'hp', 'book'));
    await assertSucceeds(publish.commit());
    await assertFails(getDoc(offer));
    await assertFails(setDoc(reply, event('reply', 'buyer', 'hp', 'book')));
    const respond = writeBatch(buyer);
    respond.set(doc(buyer, listing + '/requests/buyer'), {
      name: 'Buyer',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    respond.set(reply, event('reply', 'buyer', 'hp', 'book'));
    await assertSucceeds(respond.commit());
    const match = writeBatch(seller);
    match.update(doc(seller, listing + '/requests/buyer'), { status: 'accepted' });
    match.set(doc(seller, listing + '/private/reservation'), { buyer: 'buyer' });
    match.update(doc(seller, listing), { status: 'reserved' });
    match.set(doc(seller, 'insightEvents/match~hp~book'), event('match', 'seller', 'hp', 'book'));
    await assertSucceeds(match.commit());
  });

  it('requires a separate acknowledgement from each accepted participant', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      for (const uid of ['seller', 'buyer', 'other'])
        await setDoc(doc(db, 'communities/hp/members', uid), { status: 'active' });
      await setDoc(doc(db, listing), { ownerId: 'seller', status: 'reserved' });
      await setDoc(doc(db, listing + '/private/reservation'), { buyer: 'buyer' });
      await setDoc(doc(db, listing + '/requests/buyer'), { status: 'accepted' });
      await setDoc(doc(db, 'insightsAdmins/analyst'), {});
    });
    const seller = hp('seller'),
      buyer = hp('buyer'),
      other = hp('other');
    const first = {
      ownerConfirmedAt: serverTimestamp(),
      partnerConfirmedAt: null,
      confirmedAt: null,
    };
    await assertFails(getDoc(doc(other, path)));
    await assertFails(getDoc(doc(user('analyst'), path)));
    await assertFails(setDoc(doc(other, path), first));
    await assertFails(
      setDoc(doc(seller, path), { ...first, partnerConfirmedAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(doc(buyer, listing), { status: 'exchanged' }));
    await assertSucceeds(setDoc(doc(seller, path), first));
    const original = (await getDoc(doc(buyer, path))).data()?.ownerConfirmedAt;
    const confirmed = {
      ownerConfirmedAt: original,
      partnerConfirmedAt: serverTimestamp(),
      confirmedAt: serverTimestamp(),
    };
    await assertFails(setDoc(doc(seller, path), confirmed));
    await assertFails(setDoc(doc(buyer, path), confirmed));
    const finish = writeBatch(buyer);
    finish.set(doc(buyer, path), confirmed);
    finish.update(doc(buyer, listing), { status: 'exchanged' });
    finish.set(
      doc(buyer, 'insightEvents/confirmed~hp~book'),
      event('confirmed', 'buyer', 'hp', 'book'),
    );
    await assertSucceeds(finish.commit());
    await assertFails(setDoc(doc(buyer, path), confirmed));
    expect((await getDoc(doc(seller, listing))).data()?.status).toBe('exchanged');
    expect((await getDoc(doc(user('analyst'), 'insightEvents/confirmed~hp~book'))).exists()).toBe(
      true,
    );
  });
});
