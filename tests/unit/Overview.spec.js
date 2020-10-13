import { render } from '@testing-library/vue';
import Overview from '../../src/components/Overview.vue';
import Vue from 'vue'
import VueMaterial from 'vue-material'
import Web3 from 'web3';
import { padHex } from '../../src/utils/utils';
import { WEB3_BALANCEOF_ADDRESS_LENGTH } from '../../src/utils/constants';

Vue.use(VueMaterial);

const MOCK_ACCOUNTS = {
  [padHex("0x11111111", WEB3_BALANCEOF_ADDRESS_LENGTH)]: {
    balance: 1000,
    blacklisted: true
  },
  [padHex("0x00000000", WEB3_BALANCEOF_ADDRESS_LENGTH)]: {
    balance: 2000,
    blacklisted: false
  }
}

Web3.MOCK_ACCOUNTS = MOCK_ACCOUNTS

describe('Overview', () => {
  it('Correctly displays blacklisted label', async () => {
    const { queryByText } = render(Overview, { props: { walletAddress: padHex('0x11111111', WEB3_BALANCEOF_ADDRESS_LENGTH) } });
    await Vue.nextTick()
    expect(queryByText('block')).not.toBeNull();
  });

  it('Correctly hides blacklisted label', () => {
    const { queryByText } = render(Overview, { props: { walletAddress: padHex('0x00000000', WEB3_BALANCEOF_ADDRESS_LENGTH) } });

    expect(queryByText('block')).toBeNull();
  });
});
