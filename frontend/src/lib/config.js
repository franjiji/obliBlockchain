// deployment.json y los ABI los genera `npx hardhat run scripts/deploy.js` (ver README).
import deployment from "../contracts/deployment.json";
import vestingAbi from "../contracts/VestingPayroll.abi.json";
import tokenAbi from "../contracts/MockUSD.abi.json"; // sirve como ABI ERC-20 generico

export { deployment, vestingAbi, tokenAbi };

export const NETWORK_NAMES = { 31337: "Hardhat Local", 11155111: "Sepolia", 84532: "Base Sepolia", 1: "Ethereum Mainnet" };

export const LOCAL_CHAIN_PARAMS = {
  chainId: "0x7a69", // 31337
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};
