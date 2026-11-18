import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import LocalityPanel from './LocalityPanel';
import { suggestArea } from './localities';
const mocks = vi.hoisted(() => ({ save: vi.fn(), load: vi.fn() }));
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: mocks.save, getDocFromServer: mocks.load }));
vi.mock('./services/firebase', () => ({ firebase: { db: {} } }));
vi.mock('./Listings', () => ({ default: ({company}: {company:{name:string}}) => <p>{company.name} listings</p> }));
afterEach(() => { window.history.replaceState({}, '', '/'); });
it('offers manual selection after location denial, confirms before saving and opens the chosen feed', async () => {
  mocks.load.mockResolvedValue({data: () => undefined});
  const geo = vi.fn((_success, denied) => denied());
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:geo}});
  const user = userEvent.setup();
  render(<LocalityPanel uid="ada" />);
  await user.click(await screen.findByRole('button',{name:'Use my current location'}));
  expect(await screen.findByText(/Location was unavailable/)).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Choose my locality manually'),'local:pune:baner:alacrity');
  expect(mocks.save).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:'Confirm locality'}));
  expect(mocks.save).toHaveBeenCalledWith(undefined,{areaId:'local:pune:baner:alacrity'});
  expect(await screen.findByText('Alacrity Apartment listings')).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Community feed'),'local:pune');
  expect(screen.getByText('Pune listings')).toBeVisible();
});
it('suggests Baner nearby and leaves distant, imprecise and boundary readings unassigned', () => {
  expect(suggestArea(18.5565184,73.7574912,20)?.name).toBe('Alacrity Apartment');
  expect(suggestArea(18.56,73.79028,50)?.name).toBe('Baner');
  expect(suggestArea(12,77,10)).toBeNull();
  expect(suggestArea(18.56,73.79028,1500)).toBeNull();
  expect(suggestArea(18.582,73.79028,150)).toBeNull();
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
  expect(await screen.findByRole('button', { name: 'Change locality' })).toBeInTheDocument();
  expect(screen.queryByText('Alacrity Apartment listings')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Community feed')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Requests inbox' })).not.toBeInTheDocument();
});
