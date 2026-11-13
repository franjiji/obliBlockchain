// Despliega MockUSD + VestingPayroll en la red elegida y deja en el frontend
// las direcciones y los ABI:  frontend/src/contracts/
//
// Uso (red local):
//   terminal 1:  npx hardhat node
//   terminal 2:  npx hardhat run scripts/deploy.js --network localhost
import fs from "node:fs";
import path from "node:path";
import { network, artifacts } from "hardhat";
import assert from "node:assert/strict";
import { NETWORKS, readJson, writeJson, sendRecorded } from "./lib/costos.js";

const { ethers } = await network.getOrCreate();

const DEMO_ACCOUNTS = 5; // cuentas a las que se les regalan mUSD para probar la dApp
const DEMO_BALANCE = 100_000n * 10n ** 6n; // 100.000 mUSD (6 decimales)

const [deployer, ...others] = await ethers.getSigners();
if (!deployer) throw new Error("No hay una cuenta configurada para desplegar");
const { chainId } = await ethers.provider.getNetwork();
const net = NETWORKS[Number(chainId)];
if (!net) throw new Error("Red no soportada por este script de despliegue");
const file = chainId === 31337n
  ? "artifacts/deployments/localhost.json" : `docs/despliegues/${net.name}.json`;
// En local cada arranque es nuevo; en testnet se reanuda el registro existente.
const record = (chainId === 31337n ? null : readJson(file)) ?? {
  chainId: Number(chainId), network: net.name, deployer: deployer.address,
  contractVersion: "cliff", operations: [],
};
assert.equal(record.deployer, deployer.address, "El registro pertenece a otra cuenta");
const persist = () => writeJson(file, record);
console.log("Desplegando con:", deployer.address);

async function deploy(name, key) {
  await sendRecorded(record, `deploy${name}`, async () => {
    const contract = await ethers.deployContract(name);
    record[key] = await contract.getAddress();
    return contract.deploymentTransaction();
  }, persist, ethers.provider);
  const artifact = await artifacts.readArtifact(name);
  assert.equal(await ethers.provider.getCode(record[key]), artifact.deployedBytecode,
    `${name}: el bytecode desplegado no coincide con el compilado`);
  record[`${key}CodeHash`] = ethers.keccak256(artifact.deployedBytecode);
  persist();
  return ethers.getContractAt(name, record[key]);
}
const token = await deploy("MockUSD", "token");
const vault = await deploy("VestingPayroll", "vesting");

const tokenAddress = await token.getAddress();
const vaultAddress = await vault.getAddress();
const deployBlock = record.operations.find((r) => r.operation === "deployVestingPayroll").blockNumber;
record.deployBlock = deployBlock;
persist();

// Fondos de prueba para las primeras cuentas (solo tiene sentido en redes locales/testnets).
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
if (net.explorer) {
  console.log(`${net.explorer}/address/${tokenAddress}`);
  console.log(`${net.explorer}/address/${vaultAddress}`);
}
