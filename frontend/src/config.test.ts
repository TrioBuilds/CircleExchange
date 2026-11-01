import { describe, expect, it } from 'vitest';
import { readConfig } from './config';
const env = { VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_AUTH_DOMAIN: 'demo-circleexchange.firebaseapp.com', VITE_FIREBASE_PROJECT_ID: 'demo-circleexchange', VITE_FIREBASE_APP_ID: 'demo-app', VITE_USE_FIREBASE_EMULATORS: 'true' };
describe('environment boundaries', () => {
  it('requires configuration instead of silently selecting a live project', () => expect(readConfig({}).ready).toBe(false));
  it('allows the isolated demo project', () => expect(readConfig(env).ready).toBe(true));
  it('rejects a live project in emulator mode', () => expect(readConfig({ ...env, VITE_FIREBASE_PROJECT_ID: 'live-project' }).ready).toBe(false));
  it('rejects demo configuration in production mode', () => expect(readConfig({ ...env, VITE_USE_FIREBASE_EMULATORS: 'false' }).ready).toBe(false));
});
