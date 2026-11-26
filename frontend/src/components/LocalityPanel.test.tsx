import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import LocalityPanel from './LocalityPanel';
import { matchLocation } from '../localities';
const mocks = vi.hoisted(() => ({ save: vi.fn(), load: vi.fn() }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: mocks.save,
  getDocFromServer: mocks.load,
}));
vi.mock('../services/firebase', () => ({ firebase: { db: {} } }));
vi.mock('./Listings', () => ({
  default: ({ company }: { company: { name: string } }) => <p>{company.name} listings</p>,
}));
afterEach(() => {
  window.history.replaceState({}, '', '/');
});
it('automatically saves a detected circle without a manual locality field', async () => {
  mocks.save.mockClear();
  mocks.save.mockResolvedValue(undefined);
  mocks.load.mockResolvedValue({ data: () => undefined });
  const geo = vi.fn((success) =>
    success({
      coords: { latitude: 18.5565184, longitude: 73.7574912, accuracy: 20 },
      timestamp: Date.now(),
    }),
  );
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: geo },
  });
  const user = userEvent.setup();
  render(<LocalityPanel uid="ada" />);
  await user.click(await screen.findByRole('button', { name: 'Find my circle' }));
  expect(await screen.findByText('Baner listings')).toBeVisible();
  expect(mocks.save).toHaveBeenCalledWith(undefined, { areaId: 'local:pune:baner' });
  expect(screen.queryByLabelText('Choose my locality manually')).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Community feed'), 'local:pune');
  expect(screen.getByText('Pune listings')).toBeVisible();
});
it('keeps an existing circle when permission is denied', async () => {
  mocks.save.mockClear();
  mocks.load.mockResolvedValue({ data: () => ({ areaId: 'local:pune:baner:alacrity' }) });
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: vi.fn((_success, denied) => denied({ code: 1 })) },
  });
  const user = userEvent.setup();
  render(<LocalityPanel uid="ada" page="profile" />);
  await user.click(await screen.findByRole('button', { name: 'Check my location again' }));
  await user.click(screen.getByRole('button', { name: 'Find my circle' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Location access was denied');
  expect(mocks.save).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByText(/Alacrity Apartment → Baner → Pune/)).toBeVisible();
});
it('keeps onboarding available after a stale reading or failed save', async () => {
  mocks.save.mockClear();
  mocks.load.mockResolvedValue({ data: () => undefined });
  let timestamp = 0;
  const geo = vi.fn((success) =>
    success({ coords: { latitude: 18.56, longitude: 73.79028, accuracy: 20 }, timestamp }),
  );
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: geo },
  });
  const user = userEvent.setup();
  render(<LocalityPanel uid="ada" />);
  await user.click(await screen.findByRole('button', { name: 'Find my circle' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('out of date');
  expect(mocks.save).not.toHaveBeenCalled();
  timestamp = Date.now();
  mocks.save.mockRejectedValueOnce(new Error());
  await user.click(screen.getByRole('button', { name: 'Find my circle' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
  expect(screen.getByRole('button', { name: 'Find my circle' })).toBeEnabled();
});
it('distinguishes supported locations, unsupported cities, and uncertain readings', () => {
  expect(matchLocation(18.5565184, 73.7574912, 20)).toMatchObject({
    status: 'matched',
    area: { name: 'Baner' },
  });
  expect(matchLocation(18.56, 73.79028, 50)).toMatchObject({
    status: 'matched',
    area: { name: 'Baner' },
  });
  expect(matchLocation(17.385, 78.4867, 20)).toEqual({ status: 'outside' });
  expect(matchLocation(12, 77, 10)).toEqual({ status: 'outside' });
  expect(matchLocation(18.56, 73.79028, 1500)).toEqual({ status: 'uncertain' });
  expect(matchLocation(18.582, 73.79028, 150)).toEqual({ status: 'uncertain' });
  expect(matchLocation(NaN, 73.79028, 20)).toEqual({ status: 'uncertain' });
});
it('shows service coverage before capture and a clear unsupported-area result for Hyderabad', async () => {
  mocks.save.mockClear();
  mocks.load.mockResolvedValue({ data: () => undefined });
  const geo = vi.fn((success) =>
    success({
      coords: { latitude: 17.385, longitude: 78.4867, accuracy: 20 },
      timestamp: Date.now(),
    }),
  );
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: geo },
  });
  const user = userEvent.setup();
  render(<LocalityPanel uid="ada" />);
  const button = await screen.findByRole('button', { name: 'Find my circle' });
  expect(screen.getByRole('heading', { name: 'Local community setup' })).toBeVisible();
  expect(screen.getByText(/Current service coverage:/)).toBeVisible();
  expect(geo).not.toHaveBeenCalled();
  await user.click(button);
  expect(await screen.findByRole('status')).toHaveTextContent('hasn’t launched in your area yet');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText('Baner listings')).not.toBeInTheDocument();
  expect(mocks.save).not.toHaveBeenCalled();
});
it('offers an accuracy retry for an uncertain reading without assigning a circle', async () => {
  mocks.save.mockClear();
  mocks.load.mockResolvedValue({ data: () => undefined });
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((success) =>
        success({
          coords: { latitude: 18.56, longitude: 73.79028, accuracy: 1500 },
          timestamp: Date.now(),
        }),
      ),
    },
  });
  render(<LocalityPanel uid="ada" />);
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Find my circle' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('too imprecise');
  expect(mocks.save).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Find my circle' })).toBeEnabled();
});
it('opens a linked parent feed only when the member can access it', async () => {
  window.history.replaceState({}, '', '/?board=local%3Apune%3Abaner&listing=desk');
  mocks.load.mockResolvedValue({ data: () => ({ areaId: 'local:pune:baner:alacrity' }) });
  render(<LocalityPanel uid="ada" />);
  expect(await screen.findByText('Baner listings')).toBeVisible();
  expect(screen.queryByLabelText('Community feed')).not.toBeInTheDocument();
});
it('shows locality settings on profile without the feed', async () => {
  mocks.load.mockResolvedValue({ data: () => ({ areaId: 'local:pune:baner:alacrity' }) });
  render(<LocalityPanel uid="ada" page="profile" />);
  expect(
    await screen.findByRole('button', { name: 'Check my location again' }),
  ).toBeInTheDocument();
  expect(screen.queryByText('Alacrity Apartment listings')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Community feed')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Requests inbox' })).not.toBeInTheDocument();
});
