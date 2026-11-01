import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: null as null | { uid: string; email: string; emailVerified: boolean }, register: vi.fn(), login: vi.fn(), reset: vi.fn(), load: vi.fn(), save: vi.fn() }));
vi.mock('./services/firebase', () => ({ configuration: { ready: true }, firebase: { auth: {}, db: {} } }));
vi.mock('./services/profile', () => ({ loadProfile: mocks.load, saveProfile: mocks.save }));
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) => { callback(mocks.user); return () => {}; },
  createUserWithEmailAndPassword: mocks.register, signInWithEmailAndPassword: mocks.login,
  sendPasswordResetEmail: mocks.reset, sendEmailVerification: vi.fn(), reload: vi.fn(), signOut: vi.fn(),
}));
import App from './App';
beforeEach(() => { vi.clearAllMocks(); mocks.user = null; mocks.load.mockResolvedValue('Ada'); mocks.save.mockResolvedValue(undefined); });
it('shows a useful sign-in error and permits retry', async () => {
  mocks.login.mockRejectedValue({ code: 'auth/invalid-credential' });
  const user = userEvent.setup(); render(<App />);
  await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
  await user.type(screen.getByLabelText('Password'), 'bad-password');
  await user.click(screen.getByRole('button', { name: 'Sign in →' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('email or password is incorrect');
  expect(screen.getByRole('button', { name: 'Sign in →' })).toBeEnabled();
});
it('blocks profile access before email verification', () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: false }; render(<App />);
  expect(screen.getByRole('heading', { name: 'Verify your email address' })).toBeInTheDocument();
  expect(mocks.load).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument();
});
it('loads and saves the signed-in user profile', async () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  const user = userEvent.setup(); render(<App />);
  const field = await screen.findByDisplayValue('Ada'); await user.clear(field); await user.type(field, 'Ada Lovelace');
  await user.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(mocks.save).toHaveBeenCalledWith('ada', 'Ada Lovelace');
  expect(await screen.findByRole('status')).toHaveTextContent('profile is saved');
});
it('does not offer a blank overwrite after a failed profile read', async () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true }; mocks.load.mockRejectedValue({ code: 'unavailable' }); render(<App />);
  expect(await screen.findByRole('button', { name: 'Retry loading profile' })).toBeInTheDocument();
  expect(screen.getByLabelText('Display name')).toBeDisabled();
});
