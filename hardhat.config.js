import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { configVariable, defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const envPath = fileURLToPath(new URL(".env", import.meta.url));
if (existsSync(envPath)) loadEnvFile(envPath);

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  networks: {
    localhost: { type: "http", url: "http://127.0.0.1:8545" },
    sepolia: {
      type: "http", chainType: "l1", chainId: 11155111,
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    baseSepolia: {
      type: "http", chainType: "op", chainId: 84532,
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
});
