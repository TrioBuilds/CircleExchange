import { loadEnv } from 'vite';
const env = { ...loadEnv('production', 'frontend', 'VITE_'), ...process.env };
const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'];
if (env.VITE_USE_FIREBASE_EMULATORS !== 'false' || required.some((key) => !env[key]?.trim()) || env.VITE_FIREBASE_PROJECT_ID?.startsWith('demo-')) {
  console.error('Production build blocked: supply real Firebase web configuration and explicitly set VITE_USE_FIREBASE_EMULATORS=false. See documentation/SETUP.md.');
  process.exit(1);
}
console.log(`Building for Firebase project: ${env.VITE_FIREBASE_PROJECT_ID}. Deploy only to this project.`);
