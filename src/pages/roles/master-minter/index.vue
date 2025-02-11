<template>
  <div>
    <div
      class="header"
      data-testid="header"
    >
      Check and Configure Minters
    </div>
    <div class="master-minter">
      <form
        class="minter-form"
        @submit.prevent="lookupMinterStatus"
      >
        <CustomInput
          v-model="address"
          :placeholder="'Enter address here'"
        />
        <ActionButton
          :label="'CHECK STATUS'"
          :on-click="lookupMinterStatus"
        />
      </form>
      <div
        v-if="this.isMinter && this.minterAllowance !== null"
        class="minter-clause"
      > 
        <div class="minter-message"> 
          This address is currently a minter with allowance {{ this.minterAllowance }}. 
        </div>
        <div
          class="minter-form"
        >
          <CustomInput
            v-model="allowance"
            :placeholder="'Allowance: i.e. 0'"
          />
          <ActionButton
            :label="'INCREASE ALLOWANCE'"
            :on-click="configureMinter"
          />
        </div>
        <div class="button">
          <ActionButton
            :label="'REMOVE MINTER'"
            :on-click="removeMinter"
          />
        </div>
      </div>
      <div
        v-else-if="this.isMinter === false"
        class="minter-clause"
      > 
        <div class="minter-message">
          This address is not currently a minter.
        </div>
        <div
          class="minter-form"
        >
          <CustomInput
            v-model="allowance"
            :placeholder="'Allowance: i.e. 0'"
          />
          <ActionButton
            :label="'CONFIGURE MINTER'"
            :on-click="configureMinter"
          />
        </div>
      </div>
      <span v-if="showMasterMinterWarning">
        <md-icon>error</md-icon> Error: You are not signed in as the master minter of this contract.
      </span>
      <ConnectToMetamask ref="connectToMetamaskButton" />
    </div>
  </div>
</template>

<script>
import ActionButton from '@/components/ActionButton';
import CustomInput from '@/components/CustomInput';
import ConnectToMetamask from '@/components/ConnectToMetamask';
import {
  USDC_CONTRACT_ADDRESS,
  WEB3_BALANCEOF_ADDRESS_LENGTH,
  WEB3_PROVIDER,
  DEFAULT_GAS_PRICE, 
} from '@/utils/constants';
import Web3 from 'web3';
import { padHex } from '@/utils/utils';
import { abi } from '@/utils/web3utils';

const web3 = new Web3(WEB3_PROVIDER || Web3.givenProvider);
const contract = new web3.eth.Contract(abi, USDC_CONTRACT_ADDRESS);

export default {
  name: 'MasterMinterControl',
  components: {
    ActionButton,
    CustomInput,
    ConnectToMetamask,
  },
  data() {
    return {
      address: '',
      allowance: 0,
      isMinter: null,
      minterAllowance: null,
      accounts: [],
      showMasterMinterWarning: false,
    };
  },
  methods: {
    async subscribeToEvent(event) {
      contract.once(event, async () => {
        if (this.address === '') {
          this.isMinter = null;
          return;
        }
        try {
          this.isMinter = await contract.methods
            .isMinter(padHex(this.address, WEB3_BALANCEOF_ADDRESS_LENGTH))
            .call();
          if (this.isMinter) {
            this.minterAllowance = await contract.methods
              .minterAllowance(padHex(this.address, WEB3_BALANCEOF_ADDRESS_LENGTH))
              .call();
          }
        } catch (e) {
          console.error(e);
          this.isMinter = null;
        }
      } );


    },
    async removeMinter() {
      const masterMinterAccount = (await contract.methods.masterMinter().call()).toLowerCase();
      const accounts = this.$refs.connectToMetamaskButton.accounts.map(string => string.toLowerCase());
      this.showMasterMinterWarning = !accounts.includes(masterMinterAccount);

      if (this.showMasterMinterWarning) {
        return;
      }

      await this.ethReq(contract.methods.removeMinter(this.address).encodeABI());
      this.subscribeToEvent(contract.removeMinterEvent);
    },
    async configureMinter() {
      const masterMinterAccount = (await contract.methods.masterMinter().call()).toLowerCase();
      const accounts = this.$refs.connectToMetamaskButton.accounts.map(string => string.toLowerCase());
      this.showMasterMinterWarning = !accounts.includes(masterMinterAccount);

      if (this.showMasterMinterWarning) {
        return;
      }
      
      await this.ethReq(contract.methods.configureMinter(this.address, this.allowance).encodeABI());
      this.subscribeToEvent(contract.configureMinterEvent);
    },
    async lookupMinterStatus() {
      if (this.address === '') {
        this.isMinter = null;
        return;
      }
      try {
        this.isMinter = await contract.methods
          .isMinter(padHex(this.address, WEB3_BALANCEOF_ADDRESS_LENGTH))
          .call();
        if (this.isMinter) {
          this.minterAllowance = await contract.methods
            .minterAllowance(padHex(this.address, WEB3_BALANCEOF_ADDRESS_LENGTH))
            .call();
        }
      } catch (e) {
        console.error(e);
        this.isMinter = null;
      }
    },
    async ethReq(data) {
      try {
        await ethereum
          .request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: this.accounts[0],
                to: USDC_CONTRACT_ADDRESS,
                data: data,
                gasPrice: DEFAULT_GAS_PRICE,
              },
            ],
          });
      } catch (e) {
        console.error(e);
        //show error
      }
    },
  },
  head() {
    return {
      title: 'Master Minter',
    };
  },
};
</script>

<style scoped>
.master-minter {
  padding: 30px;
  width: 60%;
  margin: auto;
}

.header {
  font-size: 30px;
  font-weight: 900;
  padding-bottom: 3%;
  line-height: 44px;
}

.minter-clause {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.minter-form {
  display: flex;
  justify-content: center;
  align-items: center;
}

.button {
  margin-top: 20px;
}

.minter-message {
  margin-top: 20px;
  margin-bottom: 20px;
}

</style>
