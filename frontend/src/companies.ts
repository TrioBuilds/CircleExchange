export type Company = { id: string; name: string; domain: string };

// Preserve existing membership and listing paths. Other domains use their full address.
export const COMPANIES: readonly Company[] = [
  { id: 'hp', name: 'HP', domain: 'hp.com' },
  { id: 'google', name: 'Google', domain: 'google.com' },
];
const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z]{2,63}$/;
const personalDomain = /^(.+[.])?((gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|icloud|me|mac|aol|protonmail|proton|fastmail|gmx|mail|zoho|yandex|rediffmail|hey|tuta|tutanota)[.](com|net|org|de|in|fr|ru|it|co[.]uk|co[.]in|co[.]jp|com[.]au)|pm[.]me)$/;

export function companyForEmail(email: unknown): Company | null {
  if (typeof email !== 'string' || /\s/.test(email)) return null;
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0]) return null;
  const domain = parts[1];
  if (domain.length > 253 || !domainPattern.test(domain) || personalDomain.test(domain)) return null;
  return COMPANIES.find(company => company.domain === domain) ?? {
    id: domain, domain, name: domain === 'linkedin.com' ? 'LinkedIn' : domain,
  };
}
