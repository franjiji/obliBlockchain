// Despliega MockUSD + VestingPayroll en la red elegida y deja en el frontend
// las direcciones y los ABI:  frontend/src/contracts/
//
// Uso (red local):
//   terminal 1:  npx hardhat node
//   terminal 2:  npx hardhat run scripts/deploy.js --network localhost
// Sepolia: completar .env y ejecutar el mismo comando con --network sepolia.
import fs from "node:fs";
import path from "node:path";
import { network, artifacts } from "hardhat";

const { ethers } = await network.getOrCreate();

const DEMO_ACCOUNTS = 5; // cuentas a las que se les regalan mUSD para probar la dApp
const DEMO_BALANCE = 100_000n * 10n ** 6n; // 100.000 mUSD (6 decimales)

const [deployer, ...others] = await ethers.getSigners();
if (!deployer) throw new Error("No hay una cuenta configurada para desplegar.");
const { chainId } = await ethers.provider.getNetwork();
console.log("Desplegando con:", deployer.address);
console.log("Chain ID:", chainId.toString());

const token = await ethers.deployContract("MockUSD");
console.log("Transaccion MockUSD:", token.deploymentTransaction().hash);
await token.waitForDeployment();
const vault = await ethers.deployContract("VestingPayroll");
console.log("Transaccion VestingPayroll:", vault.deploymentTransaction().hash);
await vault.waitForDeployment();

const tokenAddress = await token.getAddress();
const vaultAddress = await vault.getAddress();
const deployBlock = (await vault.deploymentTransaction().wait()).blockNumber;

// Solo la red local reparte fondos automaticamente. Sepolia despliega ambos contratos.
if (chainId === 31337n) {
  for (const s of [deployer, ...others].slice(0, DEMO_ACCOUNTS)) {
    await (await token.mint(s.address, DEMO_BALANCE)).wait();
  }
}

const outDir = path.resolve("frontend", "src", "contracts");
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "deployment.json"),
  JSON.stringify({ chainId: Number(chainId), vesting: vaultAddress, token: tokenAddress, deployBlock }, null, 2) + "\n",
);
for (const name of ["VestingPayroll", "MockUSD"]) {
  const { abi } = await artifacts.readArtifact(name);
  fs.writeFileSync(path.join(outDir, `${name}.abi.json`), JSON.stringify(abi, null, 2) + "\n");
}

console.log(`MockUSD        ${tokenAddress}`);
console.log(`VestingPayroll ${vaultAddress}  (bloque ${deployBlock}, chainId ${chainId})`);
console.log(`Archivos escritos en ${path.relative(process.cwd(), outDir)}`);
if (chainId === 11155111n) {
  console.log(`MockUSD en Etherscan: https://sepolia.etherscan.io/address/${tokenAddress}`);
  console.log(`VestingPayroll en Etherscan: https://sepolia.etherscan.io/address/${vaultAddress}`);
}
