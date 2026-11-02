import { expect, it } from 'vitest';
import { companyForEmail } from './companies';
it.each([['person@hp.com','hp'], ['Person@HP.COM','hp'], ['person@google.com','google'], ['Person@LINKEDIN.COM','linkedin.com'], ['person@new.co.uk','new.co.uk'], ['person@hp.com.evil.org','hp.com.evil.org'], ['person@sub.hp.com','sub.hp.com']])('maps exact company email %s', (email, id) => {
  expect(companyForEmail(email)?.id).toBe(id);
});
it.each(['person@gmail.com','person@yahoo.com','person@outlook.com','person@yahoo.co.in','person@bad-.com','person@a..com','person@googlemail.com','person@pm.me','@hp.com','person@@hp.com',' person@hp.com',null])('does not grant a company for %s', (email) => {
  expect(companyForEmail(email)).toBeNull();
});
