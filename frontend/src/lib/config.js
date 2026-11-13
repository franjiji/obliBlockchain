// Despliegues por red. `deployment.sepolia.json` esta versionado; `deployment.json` lo genera
// `npx hardhat run scripts/deploy.js` (red local) y, si coincide la red, tiene prioridad (ver README).
import vestingAbi from "../contracts/VestingPayroll.abi.json";
import tokenAbi from "../contracts/MockUSD.abi.json"; // sirve como ABI ERC-20 generico

export { vestingAbi, tokenAbi };

const files = import.meta.glob("../contracts/deployment*.json", { eager: true, import: "default" });
const ordered = Object.entries(files).sort(([a], [b]) => Number(a.endsWith("/deployment.json")) - Number(b.endsWith("/deployment.json")));
export const deployments = Object.fromEntries(ordered.map(([, d]) => [d.chainId, d])); // chainId -> { vesting, token, deployBlock }

/** Despliegue de la red a la que esta conectada la billetera (null si la red no esta soportada). */
export let deployment = null;
export const setDeployment = (chainId) => {
  deployment = deployments[chainId] ?? null;
};

export const NETWORK_NAMES = { 31337: "Hardhat Local", 11155111: "Sepolia", 84532: "Base Sepolia", 1: "Ethereum Mainnet" };

export const EXPLORERS = { 11155111: "https://sepolia.etherscan.io" };

export const LOCAL_CHAIN_PARAMS = {
  chainId: "0x7a69", // 31337
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};
