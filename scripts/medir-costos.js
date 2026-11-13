// npx hardhat run scripts/medir-costos.js --network sepolia (o baseSepolia)
// Usa los despliegues de scripts/deploy.js y parametros compartidos entre redes.
import assert from "node:assert/strict";
import { network } from "hardhat";
import { NETWORKS, readJson, writeJson, sendRecorded } from "./lib/costos.js";

const { ethers } = await network.getOrCreate();
const { chainId } = await ethers.provider.getNetwork();
const net = NETWORKS[Number(chainId)];
if (!net) throw new Error("Red no soportada");
const local = chainId === 31337n;
const dir = local ? "artifacts/measurements" : "docs/mediciones";
const deployment = readJson(local ? "artifacts/deployments/localhost.json" : `docs/despliegues/${net.name}.json`);
if (!deployment) throw new Error("Primero ejecutar scripts/deploy.js en esta red");
const [payer] = await ethers.getSigners();
assert.equal(payer.address, deployment.deployer);
const token = await ethers.getContractAt("MockUSD", deployment.token, payer);
const vault = await ethers.getContractAt("VestingPayroll", deployment.vesting, payer);
assert.equal(ethers.keccak256(await ethers.provider.getCode(deployment.vesting)), deployment.vestingCodeHash);
const parameterFile = `${dir}/parametros.json`;
let params = readJson(parameterFile);
if (!params) {
  const now = Number(BigInt((await ethers.provider.send("eth_getBlockByNumber", ["latest", false])).timestamp));
  params = {
    beneficiary: payer.address, totalAmount: "100000000", mintAmount: "1000000000",
    startTime: now - 3600, cliffTime: now - 1800, endTime: now + 82800, revocable: true,
    description: "100 mUSD, periodo 24 h, cliff a los 30 min; inicio 1 h antes de generar parametros",
  };
  writeJson(parameterFile, params);
}
assert.equal(params.beneficiary, payer.address, "La medicion usa la misma cuenta para ambos roles");
const file = `${dir}/${net.name}.json`;
const record = readJson(file) ?? {
  chainId: Number(chainId), network: net.name, payer: payer.address,
  token: deployment.token, vesting: deployment.vesting, parameters: params, operations: [],
};
assert.equal(record.vesting, deployment.vesting, "El despliegue cambio: conservar o archivar primero la medicion anterior");
assert.equal(record.chainId, Number(chainId), "La medicion pertenece a otra red");
assert.deepEqual(record.parameters, params, "Los parametros cambiaron respecto de la medicion anterior");
const persist = () => writeJson(file, record);
const run = (label, action) => sendRecorded(record, label, action, persist, ethers.provider);

await run("mint", () => token.mint(payer.address, BigInt(params.mintAmount)));
await run("approve", () => token.approve(deployment.vesting, BigInt(params.totalAmount)));
const creation = await run("createAgreement", () => vault.createAgreement(
  params.beneficiary, deployment.token, BigInt(params.totalAmount),
  params.startTime, params.cliffTime, params.endTime, params.revocable,
));
if (!record.agreementId) {
  const receipt = await ethers.provider.getTransactionReceipt(creation.transactionHash);
  const event = receipt.logs.map((l) => { try { return vault.interface.parseLog(l); } catch { return null; } })
    .find((e) => e?.name === "AgreementCreated");
  assert(event, "No se encontro AgreementCreated");
  record.agreementId = event.args.id.toString();
  persist();
}
const id = BigInt(record.agreementId);
await run("claim", () => vault.claim(id));
await run("cancel", () => vault.cancel(id));
// Retirar el pequeno remanente devengado entre claim y cancel para no dejar fondos.
if (await vault.claimableAmount(id) > 0n || record.operations.some((r) => r.operation === "claimAfterCancel")) {
  await run("claimAfterCancel", () => vault.claim(id));
}
const agreement = await vault.getAgreement(id);
assert.equal(Number(agreement.status), 2);
assert.equal(await vault.claimableAmount(id), 0n);
record.finalState = {
  status: "Cancelled", claimedAmount: agreement.claimedAmount.toString(),
  vestedAmount: (await vault.vestedAmount(id)).toString(), claimableAmount: "0",
};
persist();
console.log(`Medicion guardada en ${file}`);
