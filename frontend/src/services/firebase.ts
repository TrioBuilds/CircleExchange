import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { readConfig } from '../config';

export const configuration = readConfig(import.meta.env);
function initialize() {
  if (!configuration.ready) return null;
  if (configuration.emulators && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    throw new Error('Emulator mode is only available on localhost.');
  }
  const app = initializeApp(configuration.config);
  const appCheckKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim();
  if (appCheckKey && !configuration.emulators)
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckKey),
      isTokenAutoRefreshEnabled: true,
    });
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (configuration.emulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  return { auth, db };
}
export const firebase = initialize();
