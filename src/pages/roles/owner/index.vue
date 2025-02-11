<template>
  <div>
    <div class="header">
      Check and Assign Roles
    </div>
    <div class="owner">
      <form
        class="input-form"
        @submit.prevent="checkRoles"
      >
        <CustomInput
          v-model="address"
          :placeholder="'Enter Wallet Address Here'"
        />
        <ActionButton
          :label="'CHECK ROLES'"
          :on-click="checkRoles"
        />
      </form>
      <div class="role-control">
        <div class="role-button-row">
          <RoleButton
            :title="'MASTER MINTER'"
            :role-active="this.masterMinterActive"
            :on-click="toggleMasterMinter"
          />
          <RoleButton
            :title="'PAUSER'"
            :role-active="this.pauserActive"
            :on-click="togglePauser"
          />
          <RoleButton
            :title="'OWNER'"
            :role-active="this.ownerActive"
            :on-click="toggleOwner"
          />
          <RoleButton
            :title="'BLACKLISTER'"
            :role-active="this.blacklisterActive"
            :on-click="toggleBlacklister"
          />
        </div>
        <span v-if="noRoles">
          <md-icon>error</md-icon> No roles 
        </span>
        <span v-if="hasRenouncedRoles">
          <md-icon>error</md-icon> Error: Cannot renounce roles. Please assign role to another address.
        </span>
        <span v-if="showOwnerWarning">
          <md-icon>error</md-icon> Error: You are not signed in as the owner of this contract and cannot reassign roles.
        </span>
        <div class="update-button">
          <ActionButton
            :label="'SAVE'"
            :on-click="this.save"
          />
        </div>
        <ConnectToMetamask ref="connectToMetamaskButton" />
      </div>
    </div>
  </div>
</template>

<script>
import RoleButton from '@/components/RoleButton';
import ActionButton from '@/components/ActionButton';
import CustomInput from '@/components/CustomInput';
import ConnectToMetamask from '@/components/ConnectToMetamask';
import { contract } from '@/utils/web3utils';
import { USDC_CONTRACT_ADDRESS, DEFAULT_GAS_PRICE } from '@/utils/constants';

/*----------------------------------------------------------------------------*
 * Helpers
 *----------------------------------------------------------------------------*/

/**
 * Getters for the addresses of each role (ie. master minter, pauser, owner, blacklister).
 *
 * @returns {String} - as a lowercase hex string.
 */
const getOwner = async () => (await contract.methods.owner().call()).toLowerCase();
const getPauser = async () => (await contract.methods.pauser().call()).toLowerCase();
const getBlacklister = async () => (await contract.methods.blacklister().call()).toLowerCase();
const getMasterMinter = async () => (await contract.methods.masterMinter().call()).toLowerCase();

/**
 * Changes the owner/pauser/blacklister/master minter.
 *
 * @param {String} ownerAccount - the owner's account.
 * @param {String} contractMethod - the abi method that changes the role.
 * @param {String} address - the address to assign the role to.
 */
async function changeRole(ownerAccount, contractMethod, address) {
  try {
    await ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: ownerAccount,
          to: USDC_CONTRACT_ADDRESS,
          data: contractMethod(address).encodeABI(),
          gasPrice: DEFAULT_GAS_PRICE,
        },
      ],
    });
  } catch(e) {
    console.error(e);
  }
}

//----------------------------------------------------------------------------------------

export default {
  components: {
    RoleButton,
    ConnectToMetamask,
    ActionButton,
    CustomInput,
  },
  data() {
    return {
      address: '',
      masterMinterActive: false,
      pauserActive: false,
      ownerActive: false,
      blacklisterActive: false,
      hasRenouncedRoles: false,
      showOwnerWarning: false,
      noRoles: false,
    };
  },
  methods: {
    async checkRoles() {
      this.hasRenouncedRoles = false;
      this.showOwnerWarning = false;
      this.address = this.address.trim().toLowerCase();

      this.blacklisterActive = this.address === await getBlacklister();
      this.masterMinterActive = this.address === await getMasterMinter();
      this.pauserActive = this.address === await getPauser();
      this.ownerActive = this.address === await getOwner();

      if (!this.blacklisterActive && !this.masterMinterActive && !this.pauserActive && !this.ownerActive) {
        this.noRoles = true;
      }
    },
    toggleMasterMinter() {
      this.masterMinterActive = !this.masterMinterActive;
    },
    togglePauser() {
      this.pauserActive = !this.pauserActive;
    },
    toggleOwner() {
      this.ownerActive = !this.ownerActive;
    },
    toggleBlacklister() {
      this.blacklisterActive = !this.blacklisterActive;
    },
    async save() {
      this.address = this.address.trim().toLowerCase();

      const accounts = this.$refs.connectToMetamaskButton.accounts.map(string => string.toLowerCase());

      const ownerAccount = await getOwner();

      this.showOwnerWarning = !accounts.includes(ownerAccount);

      this.hasRenouncedRoles = (!this.pauserActive && await getPauser() === this.address) ||
        (!this.masterMinterActive && await getMasterMinter() === this.address) ||
        (!this.blacklisterActive && await getBlacklister() === this.address) ||
        (!this.ownerActive && await getOwner() === this.address);

      if (this.hasRenouncedRoles || this.showOwnerWarning) {
        return;
      }

      if (this.pauserActive && await getPauser() !== this.address) {
        await changeRole(ownerAccount, contract.methods.updatePauser, this.address);
      }
      if (this.masterMinterActive && await getMasterMinter() !== this.address) {
        await changeRole(ownerAccount, contract.methods.updateMasterMinter, this.address);
      }
      if (this.blacklisterActive && await getBlacklister() !== this.address) {
        await changeRole(ownerAccount, contract.methods.updateBlacklister, this.address);
      }
      if (this.ownerActive && await getOwner() !== this.address) {
        await changeRole(ownerAccount, contract.methods.transferOwnership, this.address);
      }
    },
  },
  head() {
    return {
      title: 'Owner',
    };
  },
};
</script>

<style scoped>
.owner {
  padding: 30px;
  border-radius: 10px;
  width: 60%;
  margin: auto;
}

.header {
  font-size: 30px;
  font-weight: 900;
  padding-bottom: 3%;
  font-family: Proxima Nova;
  line-height: 44px;
}

.input-form {
  font-family: Proxima Nova;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.role-control {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.role-button-row {
  display: flex;
}

.role-container {
  display: flex;
}

.update-button {
  margin-top: 20px;
}

</style>
