import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import Interest from './Interest';
import { decide, myInterest, requestInterest, requestNames } from './services/interest';
vi.mock('./services/interest', () => ({
  myInterest:vi.fn(), requestNames:vi.fn(), requestInterest:vi.fn(), decide:vi.fn(),
}));
const item = {id:'book',ownerId:'seller',title:'Book',status:'available',category:'goods',
  description:'Paperback',pricePaise:0,pickup:'Lobby'} as const;
it('sends one request with the name chosen by the buyer', async () => {
  const user = userEvent.setup();
  render(<Interest board="hp" item={item} uid="buyer" refresh={vi.fn()} />);
  await user.click(screen.getByRole('button',{name:'View my interest'}));
  await user.type(await screen.findByLabelText('Name to share with the seller'),'Ada');
  await user.click(screen.getByRole('button',{name:'I’m interested'}));
  expect(myInterest).toHaveBeenCalledWith('hp','book','buyer');
  expect(requestInterest).toHaveBeenCalledWith('hp','book','buyer','Ada');
  expect(await screen.findByText('Your request: pending')).toBeVisible();
  expect(screen.queryByRole('button',{name:'I’m interested'})).toBeNull();
});
it('shows the seller pending requests and refreshes the offer after acceptance', async () => {
  vi.mocked(requestNames).mockResolvedValue([{uid:'buyer',name:'Ada'}]);
  const refresh = vi.fn(), user = userEvent.setup();
  render(<Interest board="hp" item={item} uid="seller" refresh={refresh}/>);
  await user.click(screen.getByRole('button',{name:'View interest requests'}));
  await user.click(await screen.findByRole('button',{name:'Accept'}));
  expect(decide).toHaveBeenCalledWith('hp','book','buyer',true);
  expect(refresh).toHaveBeenCalled();
});
