import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ token: vi.fn(), get: vi.fn(), set: vi.fn(), update: vi.fn(), path: vi.fn() }));
vi.mock('./firebase', () => ({ firebase: {auth:{currentUser:{uid:'ada',email:'untrusted@gmail.com',getIdTokenResult:mocks.token}},db:{}} }));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown,...parts: string[]) => { mocks.path(parts); return parts.join('/'); },
  serverTimestamp: () => 'server-time',
  runTransaction: (_db: unknown, callback: (transaction: unknown) => unknown) => callback({get:mocks.get,set:mocks.set,update:mocks.update}),
}));
import { ensureCompanyMembership, saveWorkDetails } from './company';
beforeEach(() => { vi.clearAllMocks(); mocks.token.mockResolvedValue({claims:{email:'ada@hp.com',email_verified:true}}); mocks.get.mockResolvedValue({exists:()=>false}); });
it('uses fresh signed claims instead of editable user/profile email and creates a member', async () => {
  expect((await ensureCompanyMembership('ada'))?.company.id).toBe('hp');
  expect(mocks.token).toHaveBeenCalledWith(true);
  expect(mocks.path).toHaveBeenCalledWith(['communities','hp','members','ada']);
  expect(mocks.set.mock.calls[0][1]).toMatchObject({role:'member',status:'active',emailDomain:'hp.com'});
});
it('does not rewrite existing membership or reset work details on subsequent visits', async () => {
  mocks.get.mockResolvedValue({exists:()=>true,data:()=>({emailDomain:'hp.com',status:'active',workLocation:'Pune',branch:'Campus'})});
  expect(await ensureCompanyMembership('ada')).toMatchObject({workLocation:'Pune',branch:'Campus'});
  expect(mocks.set).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
});
it('preserves revoked status instead of re-enrolling', async () => {
  mocks.get.mockResolvedValue({exists:()=>true,data:()=>({emailDomain:'hp.com',status:'revoked'})});
  expect(await ensureCompanyMembership('ada')).toMatchObject({status:'revoked'}); expect(mocks.set).not.toHaveBeenCalled();
});
it('does not touch Firestore for personal emails', async () => {
  mocks.token.mockResolvedValue({claims:{email:'ada@gmail.com',email_verified:true}});
  expect(await ensureCompanyMembership('ada')).toBeNull(); expect(mocks.path).not.toHaveBeenCalled();
});
it('rejects unverified claims even if account UI says verified', async () => {
  mocks.token.mockResolvedValue({claims:{email:'ada@hp.com',email_verified:false}});
  await expect(ensureCompanyMembership('ada')).rejects.toThrow(); expect(mocks.path).not.toHaveBeenCalled();
});
it('fails closed when the current user differs from the requested UID', async () => {
  await expect(ensureCompanyMembership('bob')).rejects.toThrow(); expect(mocks.path).not.toHaveBeenCalled();
});
it('saves only self-reported fields and derives the company from claims again', async () => {
  mocks.get.mockResolvedValue({exists:()=>true,data:()=>({status:'active'})});
  await saveWorkDetails('ada',' Pune ',' Campus A ');
  expect(mocks.update).toHaveBeenCalledWith('communities/hp/members/ada',{workLocation:'Pune',branch:'Campus A',updatedAt:'server-time'});
});
it('does not hide failed enrollment as unsupported-domain state', async () => {
  mocks.get.mockRejectedValue(new Error('offline'));
  await expect(ensureCompanyMembership('ada')).rejects.toThrow('offline');
});
