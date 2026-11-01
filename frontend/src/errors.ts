export function friendlyError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'Unable to create this account. Try signing in or resetting your password.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
    'auth/network-request-failed': 'Cannot connect. Check your connection and try again.',
    'auth/invalid-email': 'Enter a valid email address.',
    'permission-denied': 'Access denied. Verify your email and refresh your session.',
    'unavailable': 'The service is unavailable. Please try again shortly.',
  };
  return messages[code] ?? 'Something went wrong. Please try again.';
}
