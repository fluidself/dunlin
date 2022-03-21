const path = require('path');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

module.exports = {
  solidity: '0.8.9',
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // rinkeby: {
    //   url: process.env.RINKEBY_NODE_URL,
    //   accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    // mainnet: {
    //   url: process.env.MAINNET_NODE_URL,
    //   accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,
  // },
};
