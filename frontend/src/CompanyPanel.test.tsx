import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(() => ({ ensure: vi.fn(), save: vi.fn() }));
vi.mock('./services/company', () => ({ ensureCompanyMembership: mocks.ensure, saveWorkDetails: mocks.save }));
vi.mock('./Listings', () => ({ default: () => null }));
import CompanyPanel from './CompanyPanel';
const membership = { company: {id:'hp',name:'HP',domain:'hp.com'}, status:'active',workLocation:'',branch:'' };
beforeEach(() => { vi.clearAllMocks(); mocks.ensure.mockResolvedValue(membership); mocks.save.mockResolvedValue(undefined); });
afterEach(() => { window.history.replaceState({}, '', '/'); });
it('automatically joins without an approval button and saves optional work details', async () => {
  const user=userEvent.setup(); render(<CompanyPanel uid="ada" page="profile" />);
  expect(await screen.findByRole('heading',{name:'Welcome to the HP community.'})).toBeInTheDocument();
  expect(mocks.ensure).toHaveBeenCalledWith('ada');
  await user.type(screen.getByLabelText('Work location (optional)'), 'Bengaluru');
  await user.type(screen.getByLabelText('Office or branch (optional)'), 'Whitefield');
  await user.click(screen.getByRole('button',{name:'Save work details'}));
  expect(mocks.save).toHaveBeenCalledWith('ada','Bengaluru','Whitefield');
  expect(await screen.findByRole('status')).toHaveTextContent('work details are saved');
});
it('shows a waiting state for personal or unsupported email domains', async () => {
  mocks.ensure.mockResolvedValue(null); render(<CompanyPanel uid="ada" />);
  expect(await screen.findByRole('heading',{name:'Your circle is coming.'})).toBeInTheDocument();
  expect(screen.queryByLabelText('Work location (optional)')).not.toBeInTheDocument();
});
it('does not claim membership when the network fails and offers retry', async () => {
  mocks.ensure.mockRejectedValueOnce({code:'unavailable'}); const user=userEvent.setup(); render(<CompanyPanel uid="ada" />);
  await user.click(await screen.findByRole('button',{name:'Retry community connection'}));
  expect(await screen.findByRole('heading',{name:'Welcome to the HP community.'})).toBeInTheDocument();
});
it('preserves existing details and displays save failures', async () => {
  mocks.ensure.mockResolvedValue({...membership,workLocation:'Pune',branch:'Campus A'});
  mocks.save.mockRejectedValue({code:'permission-denied'}); const user=userEvent.setup(); render(<CompanyPanel uid="ada" page="profile" />);
  expect(await screen.findByDisplayValue('Pune')).toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Save work details'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
  expect(screen.getByDisplayValue('Campus A')).toBeInTheDocument();
});
it('does not restore a revoked membership or offer editing', async () => {
  mocks.ensure.mockResolvedValue({...membership,status:'revoked'}); render(<CompanyPanel uid="ada" />);
  expect(await screen.findByRole('heading',{name:'HP community access paused'})).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Save work details'})).not.toBeInTheDocument();
});
it('does not open a listing from another company community', async () => {
  window.history.replaceState({}, '', '/?board=google&listing=desk');
  render(<CompanyPanel uid="ada" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('outside your community');
  expect(screen.queryByLabelText('Work location (optional)')).not.toBeInTheDocument();
});
it('keeps requests and work details on their own pages', async () => {
  const requests = render(<CompanyPanel uid="ada" page="requests" />);
  expect(await screen.findByRole('region', { name: 'Requests inbox' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Work location (optional)')).not.toBeInTheDocument();
  requests.unmount();
  render(<CompanyPanel uid="ada" page="profile" />);
  expect(await screen.findByLabelText('Work location (optional)')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Requests inbox' })).not.toBeInTheDocument();
});
