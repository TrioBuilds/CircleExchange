import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { companyForEmail, type Company } from '../companies';
import { firebase } from './firebase';

export type CompanyMembership = {
  company: Company;
  workLocation: string;
  branch: string;
  status: 'active' | 'revoked';
};

async function verifiedCompany(uid: string) {
  const user = firebase?.auth.currentUser;
  if (!firebase || !user || user.uid !== uid) throw new Error('Sign in again.');
  // Force a fresh signed token; never trust a form value or profile field as identity.
  const token = await user.getIdTokenResult(true);
  if (token.claims.email_verified !== true) throw new Error('Verify your email first.');
  return companyForEmail(token.claims.email);
}

export async function ensureCompanyMembership(uid: string): Promise<CompanyMembership | null> {
  const company = await verifiedCompany(uid);
  if (!company) return null;
  const reference = doc(firebase!.db, 'communities', company.id, 'members', uid);
  return runTransaction(firebase!.db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.emailDomain !== company.domain || !['active', 'revoked'].includes(data.status)) {
        throw new Error('Membership needs review.');
      }
      return { company, workLocation: String(data.workLocation ?? ''), branch: String(data.branch ?? ''), status: data.status as 'active' | 'revoked' };
    }
    transaction.set(reference, {
      emailDomain: company.domain, role: 'member', status: 'active',
      workLocation: '', branch: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return { company, workLocation: '', branch: '', status: 'active' };
  });
}

export async function saveWorkDetails(uid: string, workLocation: string, branch: string): Promise<void> {
  const company = await verifiedCompany(uid);
  if (!company) throw new Error('No supported company email.');
  const details = { workLocation: workLocation.trim(), branch: branch.trim() };
  if (details.workLocation.length > 80 || details.branch.length > 80) throw new Error('Use at most 80 characters per field.');
  const reference = doc(firebase!.db, 'communities', company.id, 'members', uid);
  await runTransaction(firebase!.db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists() || snapshot.data().status !== 'active') throw new Error('No active company membership.');
    transaction.update(reference, { ...details, updatedAt: serverTimestamp() });
  });
}
