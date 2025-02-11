<template>
  <div>
    <Table
      :name="'Accounts'"
      :loading="loading"
      :schema="this.tableSchema"
      :content="this.accounts"
      :key-field="'address'"
    />
  </div>
</template>

<script>

// modules
import Table from '@/components/Table';
import * as constants from '@/utils/constants';
import { getBalance, getTotalSupply, getAllTransactions } from '@/utils/web3utils';
import { removeLeadingZeros, roundToNearest, pushAll } from '@/utils/utils';

export default {
  components: {
    Table,
  },
  data() {
    return {
      accounts: [],
      loading: true,
    };
  },
  computed: {
    tableSchema() {
      return constants.ACCOUNTS_SCHEMA;
    },
  },
  async created() {
    this.accounts = await this.getAccounts();
    this.loading = false;
  },
  methods: {
    /**
     * Indicates if the passed-in address is 'valid'. A valid address is truth-y and has less than
     * WEB3_BALANCEOF_ADDRESS_LENGTH digits (not including '0x').
     * Addresses that are too long are not compatible with getBalance.
     *
     * @param {string|null} address
     * @return {boolean}
     */
    isValidAddress(address) {
      return address && removeLeadingZeros(address).length <= constants.WEB3_BALANCEOF_ADDRESS_LENGTH + 2;
    },

    /**
     * Gets the corresponding balances of an Iterable containing addresses.
     * Uses Promise.all() to aggregate the responses.
     *
     * @param {Iterable.<string>} addresses
     * @return {string[]}
     */
    async getBalancesFor(addresses) {
      // Get the promises that resolve to the balance of every chunk of OPTIMAL_PROMISE_ALL_SIZE addresses.
      const balances = [];
      let balancePromises = [];

      for (const address of addresses) {
        if (balancePromises.length >= constants.OPTIMAL_PROMISE_ALL_SIZE) {
          pushAll(balances, await Promise.all(balancePromises));
          balancePromises = [];
        }
        balancePromises.push(getBalance(address));
      }
      pushAll(balances, await Promise.all(balancePromises));
      return balances;
    },

    /**
     * Gets all accounts (addresses) and their balances/percentages.
     *
     * @return {Object[]}
     */
    async getAccounts() {
      const transactions = await getAllTransactions();

      // Get all of the valid addresses of all transactions in a Set.
      const addresses = new Set();
      for (const txn of transactions) {
        this.isValidAddress(txn.topics[1]) && addresses.add(removeLeadingZeros(txn.topics[1]));
        this.isValidAddress(txn.topics[2]) && addresses.add(removeLeadingZeros(txn.topics[2]));
      }

      // Fetch the totalSupply of USDC and all of the balances of each address.
      const totalSupply = await getTotalSupply();
      const balances = await this.getBalancesFor(addresses);

      const accounts = [];
      let i = 0;
      for (const address of addresses) {
        const balance = balances[i++];
        const percentage = `${roundToNearest(balance / totalSupply * 100, constants.PERCENTAGE_DECIMAL_PLACES)}%`;

        accounts.push({address, balance, percentage});
      }

      // Sort (in reverse order) the account addresses by balance.
      accounts.sort((a, b) => b.balance - a.balance);
      return accounts;
    },
  },
  head() {
    return {
      title: 'Accounts',
    };
  },
};
</script>
