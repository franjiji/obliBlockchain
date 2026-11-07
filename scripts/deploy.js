// Despliega MockUSD + VestingPayroll en la red elegida y deja en el frontend
// las direcciones y los ABI:  frontend/src/contracts/
//
// Uso (red local):
//   terminal 1:  npx hardhat node
//   terminal 2:  npx hardhat run scripts/deploy.js --network localhost
import fs from "node:fs";
import path from "node:path";
import { network, artifacts } from "hardhat";

const { ethers } = await network.getOrCreate();

const DEMO_ACCOUNTS = 5; // cuentas a las que se les regalan mUSD para probar la dApp
const DEMO_BALANCE = 100_000n * 10n ** 6n; // 100.000 mUSD (6 decimales)

const [deployer, ...others] = await ethers.getSigners();
console.log("Desplegando con:", deployer.address);

const token = await ethers.deployContract("MockUSD");
await token.waitForDeployment();
const vault = await ethers.deployContract("VestingPayroll");
await vault.waitForDeployment();

const tokenAddress = await token.getAddress();
const vaultAddress = await vault.getAddress();
const deployBlock = (await vault.deploymentTransaction().wait()).blockNumber;
const { chainId } = await ethers.provider.getNetwork();

// Fondos de prueba para las primeras cuentas (solo tiene sentido en redes locales/testnets).
for (const s of [deployer, ...others].slice(0, DEMO_ACCOUNTS)) {
  await (await token.mint(s.address, DEMO_BALANCE)).wait();
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
