import PauserControl from '@/components/PauserControl.vue';
import Vue from 'vue';
import VueMaterial from 'vue-material';
import { render, fireEvent } from '@testing-library/vue';
import Web3 from 'web3';

Vue.use(VueMaterial);

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

const finishPromises = async () => new Promise(resolve => setTimeout(resolve, 0));

describe('PauserControl', () => {
  it('Text components render properly', () => {
    const { getByText } = render(PauserControl);
    const header = 'Pause and Unpause Contract';
    expect(getByText(header)).not.toBeNull();
  });

  it('Unpauses when pauser attempts to unpause', async () => {
    const { getByText } = render(PauserControl, {
      data: function() {
        return {
          contractPaused: true,
        };
      },
    });
    await fireEvent.click(getByText('PAUSED'));
    await finishPromises();
    expect(getByText('UNPAUSED')).not.toBeNull();
    expect(getByText('Click to pause contract.')).not.toBeNull();
    expect(getByText('All transfers, minting, and burning are ACTIVE.')).not.toBeNull();
  });

  it('Pauses when pauser attempts to pause', async () => {
    const { getByText } = render(PauserControl, {
      data: function() {
        return {
          contractPaused: false,
        };
      },
    });
    await fireEvent.click(getByText('UNPAUSED'));
    await finishPromises();
    expect(getByText('PAUSED')).not.toBeNull();
    expect(getByText('Click to unpause contract.')).not.toBeNull();
    expect(getByText('All transfers, minting, and burning are PAUSED.')).not.toBeNull();
  });

});
