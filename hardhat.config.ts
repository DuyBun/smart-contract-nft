import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/-FOAW8X7sFTLXJJhjqR8z9xaU6kIqDvh`,
      accounts: ["adfc43496e0375b964c00806619d1192c538adadd79fec0a5a2461af7e4d8906"],
    },
  },
  etherscan: {
    apiKey: "KH4K8XQ72J8FB8WGDF7EEXZSTMGHNJ59UW"
  },
};

export default config;
