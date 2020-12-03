import ConnectToMetamask from '@/components/ConnectToMetamask';
import { render, createEvent, fireEvent } from '@testing-library/vue';
import { padHex } from '@/utils/utils';
import { WEB3_BALANCEOF_ADDRESS_LENGTH } from '@/utils/constants';
import Web3 from 'web3';

const MOCK_ACCOUNTS = {
  [padHex('0x11111111', WEB3_BALANCEOF_ADDRESS_LENGTH)]: {
    balance: 1000,
  },
};

Web3.MOCK_ACCOUNTS = MOCK_ACCOUNTS;

describe('ConnectToMetamask', () => {
  it('Shows connected properly', () => {
    const { findByText } = render(ConnectToMetamask);
    expect(findByText('Connected to MetaMask')).not.toBeNull();
  });

  it('Fires event on click', () => {
    const { getByText } = render(ConnectToMetamask);
    const event = createEvent.click(getByText('Connect to MetaMask'));
    expect(fireEvent(getByText('Connect to MetaMask'), event)).not.toBeNull();
  });

});
