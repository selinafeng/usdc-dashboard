import PauserControl from '@/pages/roles/pauser/index';
import { render, fireEvent } from '@testing-library/vue';
import { finishPromises } from '@/utils/utils';
import Web3 from 'web3';

function ethereumFactory(isConnectedToMetamask) {
  return {
    request: async config => {
      if (config.method === 'eth_sendTransaction') {
        await config.params[0].data();
      }

      // Simulates connecting to metamask as the owner.
      if (config.method === 'eth_requestAccounts') {
        return isConnectedToMetamask ? [Web3.PAUSER] : [];
      }
    },
  };
}
Web3.PAUSER = '0x00000001';
global.ethereum = ethereumFactory(true);

describe('PauserControl', () => {
  it('Text components render properly', () => {
    const { getByText } = render(PauserControl);
    const header = 'Pause and Unpause Contract';
    expect(getByText(header)).not.toBeNull();
    expect(getByText('Pausing prevents transfers, minting, and burning.')).not.toBeNull();
  });

  it('Unpauses when pauser attempts to unpause', async () => {
    const { getByText, getByTestId } = render(PauserControl, {
      data: function() {
        return {
          contractPaused: true,
        };
      },
    });
    const saveButton = getByText('SAVE');

    await fireEvent.click(getByTestId('toggle'));
    await fireEvent.click(saveButton);
    await finishPromises();
    expect(getByText('Pausing prevents transfers, minting, and burning.')).not.toBeNull();
  });

  it('Pauses when pauser attempts to pause', async () => {
    const { getByText, getByTestId } = render(PauserControl, {
      data: function() {
        return {
          contractPaused: false,
        };
      },
    });
    const saveButton = getByText('SAVE');

    await fireEvent.click(getByTestId('toggle'));
    await fireEvent.click(saveButton);
    await finishPromises();
    expect(getByText('Pausing prevents transfers, minting, and burning.')).not.toBeNull();
  });

});
