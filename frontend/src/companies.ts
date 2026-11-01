export const COMPANIES = [
  { id: 'hp', name: 'HP', domain: 'hp.com' },
  { id: 'google', name: 'Google', domain: 'google.com' },
] as const;

export type Company = (typeof COMPANIES)[number];

// Exact domains only: subdomains, lookalikes and arbitrary custom domains are not approved.
// Keep this directory and the server-enforced mappings in firestore.rules in sync.
export function companyForEmail(email: unknown): Company | null {
  if (typeof email !== 'string') return null;
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0] || /\s/.test(email)) return null;
  return COMPANIES.find((company) => company.domain === parts[1]) ?? null;
}
