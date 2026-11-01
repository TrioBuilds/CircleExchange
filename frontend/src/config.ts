export function readConfig(env: Record<string, string | undefined>) {
  const emulators = env.VITE_USE_FIREBASE_EMULATORS === 'true';
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
    appId: env.VITE_FIREBASE_APP_ID ?? '',
  };
  const missing = Object.entries(config).filter(([, value]) => !value.trim()).map(([key]) => key);
  if (missing.length) return { ready: false as const, reason: `Missing Firebase configuration: ${missing.join(', ')}.` };
  if (emulators && config.projectId !== 'demo-circleexchange') {
    return { ready: false as const, reason: 'Local mode requires project ID demo-circleexchange to prevent accidental live-data access.' };
  }
  if (!emulators && config.projectId.startsWith('demo-')) {
    return { ready: false as const, reason: 'Demo projects require local emulator mode.' };
  }
  return { ready: true as const, config, emulators };
}
