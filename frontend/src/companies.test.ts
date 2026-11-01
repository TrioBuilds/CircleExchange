import { expect, it } from 'vitest';
import { companyForEmail } from './companies';
it.each([['person@hp.com','hp'], ['Person@HP.COM','hp'], ['person@google.com','google']])('maps exact company email %s', (email, id) => {
  expect(companyForEmail(email)?.id).toBe(id);
});
it.each(['person@gmail.com','person@yahoo.com','person@unlisted.com','person@hp.com.evil.org','person@fakehp.com','person@sub.hp.com','person@googlemail.com','person@googIe.com','@hp.com','person@@hp.com',' person@hp.com',null])('does not grant a company for %s', (email) => {
  expect(companyForEmail(email)).toBeNull();
});
