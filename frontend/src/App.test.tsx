import { act, render, screen, within } from '@testing-library/react';
import { loadDraft, saveDraft } from './services/drafts';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string; emailVerified: boolean },
  register: vi.fn(),
  login: vi.fn(),
  reset: vi.fn(),
  load: vi.fn(),
  save: vi.fn(),
  canManageFeedback: vi.fn(),
  canViewInsights: vi.fn(),
  loadInsights: vi.fn(),
  authChanged: null as null | ((user: unknown) => void),
}));
vi.mock('./services/firebase', () => ({
  configuration: { ready: true },
  firebase: { auth: {}, db: {} },
}));
vi.mock('./services/profile', () => ({ loadProfile: mocks.load, saveProfile: mocks.save }));
vi.mock('./services/feedback', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/feedback')>()),
  canManageFeedback: mocks.canManageFeedback,
}));
vi.mock('./features/admin/insights', () => ({
  canViewInsights: mocks.canViewInsights,
  loadInsights: mocks.loadInsights,
}));
vi.mock('firebase/auth', () => ({
  onIdTokenChanged: (_auth: unknown, callback: (user: unknown) => void) => {
    mocks.authChanged = callback;
    callback(mocks.user);
    return () => {};
  },
  createUserWithEmailAndPassword: mocks.register,
  signInWithEmailAndPassword: mocks.login,
  sendPasswordResetEmail: mocks.reset,
  sendEmailVerification: vi.fn(),
  reload: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('./services/company', () => ({
  ensureCompanyMembership: vi.fn().mockResolvedValue(null),
  saveWorkDetails: vi.fn(),
}));
import App from './App';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = null;
  mocks.load.mockResolvedValue('Ada');
  mocks.save.mockResolvedValue(undefined);
  mocks.canManageFeedback.mockResolvedValue(false);
  mocks.canViewInsights.mockResolvedValue(false);
  mocks.loadInsights.mockResolvedValue({ events: [], reports: [] });
});
afterEach(() => {
  window.history.replaceState({}, '', '/');
});
it('explains an illustrative exchange and connects the welcome actions to the account form', async () => {
  const user = userEvent.setup();
  render(<App />);
  const example = within(screen.getByRole('region', { name: 'Movie night for two' }));
  expect(example.getByText('Illustrative exchange')).toBeVisible();
  expect(example.getByText('Up to ₹300')).toBeVisible();
  expect(example.getByText('Fee paid to the helper')).toBeVisible();
  await user.click(example.getByRole('button', { name: /Replay the example/ }));
  expect(example.getByText('Up to ₹300')).toBeVisible();
  await user.click(screen.getByRole('link', { name: 'Join my circle' }));
  expect(screen.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
  await user.click(screen.getByRole('link', { name: 'Sign in' }));
  expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
  expect(screen.getByRole('button', { name: 'Send reset email' })).toBeVisible();
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
});
it('shows a useful sign-in error and permits retry', async () => {
  mocks.login.mockRejectedValue({ code: 'auth/invalid-credential' });
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
  await user.type(screen.getByLabelText('Password'), 'bad-password');
  await user.click(screen.getByRole('button', { name: 'Sign in →' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('email or password is incorrect');
  expect(screen.getByRole('button', { name: 'Sign in →' })).toBeEnabled();
});
it('blocks profile access before email verification', () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: false };
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Verify your email address' })).toBeInTheDocument();
  expect(mocks.load).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument();
});
it('loads the admin insights deep link for an approved user', async () => {
  window.history.replaceState({}, '', '/admin/overview');
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  mocks.canViewInsights.mockResolvedValue(true);
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Insights' })).toBeVisible();
  expect(await screen.findByRole('heading', { name: 'Onboarding' })).toBeVisible();
  expect(mocks.loadInsights).toHaveBeenCalledOnce();
});
it('keeps insights data unloaded for a user without admin access', async () => {
  window.history.replaceState({}, '', '/admin/overview');
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Admin access required' })).toBeVisible();
  expect(mocks.loadInsights).not.toHaveBeenCalled();
});
it('clears the departing account drafts on sign-out and account switching', () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  saveDraft('ada', 'hp', 'offer', { title: 'Desk' });
  saveDraft('bea', 'hp', 'ask', { title: 'Help' });
  render(<App />);
  act(() => mocks.authChanged?.({ uid: 'bea', email: 'bea@example.com', emailVerified: true }));
  expect(loadDraft('ada', 'hp', 'offer')).toBeUndefined();
  expect(loadDraft('bea', 'hp', 'ask')).toEqual({ title: 'Help' });
  act(() => mocks.authChanged?.(null));
  expect(loadDraft('bea', 'hp', 'ask')).toBeUndefined();
});
it('loads and saves the signed-in user profile', async () => {
  window.history.replaceState({}, '', '/profile');
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  const user = userEvent.setup();
  render(<App />);
  const field = await screen.findByDisplayValue('Ada');
  await user.clear(field);
  await user.type(field, 'Ada Lovelace');
  await user.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(mocks.save).toHaveBeenCalledWith('ada', 'Ada Lovelace');
  expect(await screen.findByRole('status')).toHaveTextContent('profile is saved');
});
it('does not offer a blank overwrite after a failed profile read', async () => {
  window.history.replaceState({}, '', '/profile');
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  mocks.load.mockRejectedValue({ code: 'unavailable' });
  render(<App />);
  expect(await screen.findByRole('button', { name: 'Retry loading profile' })).toBeInTheDocument();
  expect(screen.getByLabelText('Display name')).toBeDisabled();
});
it('uses signed-in copy on a direct listing link', () => {
  window.history.replaceState({}, '', '/?board=hp&listing=desk');
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  render(<App />);
  expect(screen.getByText('View this listing and its replies in your community.')).toBeVisible();
  expect(
    screen.queryByText('Sign in and verify your email to view community offers.'),
  ).not.toBeInTheDocument();
});
it('provides separate page links and only loads profile details on the profile page', async () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  window.history.replaceState({}, '', '/requests');
  const view = render(<App />);
  const nav = within(screen.getByRole('navigation', { name: 'Primary' }));
  expect(nav.getByRole('link', { name: 'Requests' })).toHaveAttribute('aria-current', 'page');
  expect(nav.getByRole('link', { name: 'Feed' })).toHaveAttribute('href', '/feed');
  expect(nav.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  expect(screen.getByRole('heading', { name: 'Your requests.' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument();
  expect(mocks.load).not.toHaveBeenCalled();
  view.unmount();
  window.history.replaceState({}, '', '/profile');
  render(<App />);
  expect(await screen.findByDisplayValue('Ada')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Your requests.' })).not.toBeInTheDocument();
});
it('opens the existing offer form from the primary navigation', async () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  render(<App />);
  const composer = document.createElement('details');
  composer.className = 'compose';
  composer.scrollIntoView = vi.fn();
  document.body.append(composer);
  await userEvent.setup().click(
    within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('button', {
      name: 'Post an offer',
    }),
  );
  expect(composer.open).toBe(true);
  composer.remove();
});
it('takes a member without a feed to community setup when they choose Post', async () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  render(<App />);
  const community = await screen.findByRole('region', { name: 'Your community' });
  community.scrollIntoView = vi.fn();
  await userEvent.setup().click(
    within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('button', {
      name: 'Post an offer',
    }),
  );
  expect(community.scrollIntoView).toHaveBeenCalled();
});
it('opens the ask form separately from the offer form', async () => {
  mocks.user = { uid: 'ada', email: 'ada@example.com', emailVerified: true };
  render(<App />);
  const ask = document.createElement('details');
  ask.className = 'compose ask-compose';
  ask.scrollIntoView = vi.fn();
  const offer = document.createElement('details');
  offer.className = 'compose';
  offer.scrollIntoView = vi.fn();
  document.body.append(ask, offer);
  try {
    await userEvent.setup().click(screen.getByRole('button', { name: 'Ask my circle' }));
    expect(ask.open).toBe(true);
    expect(offer.open).toBe(false);
    await userEvent.setup().click(
      within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('button', {
        name: 'Post an offer',
      }),
    );
    expect(offer.open).toBe(true);
  } finally {
    ask.remove();
    offer.remove();
  }
});
