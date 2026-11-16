// Genera el informe desde recibos medidos, sin RPC ni claves privadas.
import assert from "node:assert/strict";
import { formatEther, formatUnits, Interface } from "ethers";
import { NETWORKS, readJson } from "./lib/costos.js";
import fs from "node:fs";

const sepolia = readJson("docs/mediciones/sepolia.json");
const base = readJson("docs/mediciones/baseSepolia.json");
assert(sepolia && base, "Faltan mediciones reales de alguna red");
assert.deepEqual(sepolia.parameters, base.parameters, "Los parametros deben ser identicos");
const l1 = readJson("docs/despliegues/sepolia.json");
const l2 = readJson("docs/despliegues/baseSepolia.json");
assert.equal(l1.vestingCodeHash, l2.vestingCodeHash, "Los contratos deben tener el mismo bytecode");
assert.equal(l1.tokenCodeHash, l2.tokenCodeHash);
const required = ["approve", "createAgreement", "claim", "cancel"];
const vestingInterface = new Interface(JSON.parse(fs.readFileSync("frontend/src/contracts/VestingPayroll.abi.json", "utf8")));
const tokenInterface = new Interface(JSON.parse(fs.readFileSync("frontend/src/contracts/MockUSD.abi.json", "utf8")));
for (const r of [sepolia, base]) {
  assert.equal(r.finalState.status, "Cancelled");
  assert.equal(r.finalState.claimableAmount, "0");
  assert.equal(r.finalState.claimedAmount, r.finalState.vestedAmount);
  for (const op of required) assert(r.operations.some((o) => o.operation === op && o.status === "confirmed"));
  const input = (op, iface) => iface.parseTransaction({ data: r.operations.find((o) => o.operation === op).input }).args;
  const args = input("createAgreement", vestingInterface);
  assert.equal(args.beneficiary, r.parameters.beneficiary);
  assert.equal(args.token, r.token);
  assert.equal(args.totalAmount.toString(), r.parameters.totalAmount);
  assert.equal(Number(args.startTime), r.parameters.startTime);
  assert.equal(Number(args.cliffTime), r.parameters.cliffTime);
  assert.equal(Number(args.endTime), r.parameters.endTime);
  assert.equal(args.revocable, r.parameters.revocable);
  assert.equal(input("approve", tokenInterface)[0], r.vesting);
  assert.equal(input("approve", tokenInterface)[1].toString(), r.parameters.totalAmount);
  for (const op of ["claim", "cancel"]) assert.equal(input(op, vestingInterface)[0].toString(), r.agreementId);
}
const cost = (record, operation) => {
  const row = record.operations.find((o) => o.operation === operation);
  return BigInt(row.totalFeeWei);
};
const ratio = (a, b) => (Number(a) / Number(b)).toFixed(2);
const percent = (a, b) => ((1 - Number(b) / Number(a)) * 100).toFixed(2);
const rows = [];
for (const operation of ["deployMockUSD", "deployVestingPayroll", "mint", ...required, "claimAfterCancel"]) {
  for (const [measurement, deployment, label] of [[sepolia, l1, "Sepolia"], [base, l2, "Base Sepolia"]]) {
    const row = [...deployment.operations, ...measurement.operations].find((o) => o.operation === operation);
    if (!row) continue;
    assert.equal(row.status, "confirmed");
    assert.equal(BigInt(row.totalFeeWei), BigInt(row.executionFeeWei) + BigInt(row.l1FeeWei) + BigInt(row.otherFeeWei));
    const explorer = NETWORKS[measurement.chainId].explorer;
    rows.push(`| ${operation} | ${label} | ${row.gasUsed} | ${formatUnits(row.gasPriceWei, 9)} | ${formatEther(row.executionFeeWei)} | ${formatEther(row.l1FeeWei)} | ${formatEther(row.otherFeeWei)} | ${formatEther(row.totalFeeWei)} | [Tx](${explorer}/tx/${row.transactionHash}) |`);
  }
}
const comparisons = required.map((op) => `| ${op} | ${formatEther(cost(sepolia, op))} | ${formatEther(cost(base, op))} | ${ratio(cost(sepolia, op), cost(base, op))}x | ${percent(cost(sepolia, op), cost(base, op))} % |`);
const sum = (record) => required.reduce((total, op) => total + cost(record, op), 0n);
const s = sum(sepolia), b = sum(base);
// Ejecucion = gas usado x precio del gas: con los mismos recibos se separan las dos causas
const gasOf = (record, op) => Number(record.operations.find((o) => o.operation === op).gasUsed);
const gasRatioOf = (op, r1, r2) => (gasOf(r1, op) / gasOf(r2, op)).toFixed(2);
const maxOp = [...required].sort((x, y) => gasOf(sepolia, y) / gasOf(base, y) - gasOf(sepolia, x) / gasOf(base, x))[0];
const flow = (record, key) => required.reduce((t, op) => t + Number(record.operations.find((o) => o.operation === op)[key]), 0);
const gasS = flow(sepolia, "gasUsed"), gasB = flow(base, "gasUsed");
const priceS = flow(sepolia, "executionFeeWei") / gasS, priceB = flow(base, "executionFeeWei") / gasB; // wei por gas
const gwei = (p) => formatUnits(BigInt(Math.round(p)), 9);
const params = sepolia.parameters;
const generated = new Date().toISOString();
const conclusion = b < s ? `Base fue ${ratio(s,b)} veces mas barata, con un ahorro de ${percent(s,b)} %.` : "Base no resulto mas barata en esta muestra; los datos no deben forzarse a una conclusion predeterminada.";
const text = `# Comparacion de costos: Ethereum Sepolia y Base Sepolia

Desafio D. Informe generado el ${generated} desde los registros JSON publicos
de \`docs/despliegues/\` y \`docs/mediciones/\`. No contiene estimaciones ni datos simulados.
Version del contrato: cliff opcional, basada en \`origin/feature/cliff\` (4f96510).
Solidity 0.8.28, optimizador activo con 200 runs. Mismo bytecode en ambas redes:

\`${l1.vestingCodeHash}\`

## Redes y despliegues

| Red | Chain ID | MockUSD | VestingPayroll |
|---|---|---|---|
| Sepolia | 11155111 | [${l1.token}](https://sepolia.etherscan.io/address/${l1.token}) | [${l1.vesting}](https://sepolia.etherscan.io/address/${l1.vesting}) |
| Base Sepolia | 84532 | [${l2.token}](https://sepolia.basescan.org/address/${l2.token}) | [${l2.vesting}](https://sepolia.basescan.org/address/${l2.vesting}) |

## Metodo

- Se desplegaron contratos nuevos y se uso la misma cuenta de prueba como pagador y beneficiario:
  \`${params.beneficiary}\`. Los tests de contratos cubren tambien cuentas distintas.
- Mismos parametros numericos en ambas redes: monto ${params.totalAmount} unidades (100 mUSD),
  startTime ${params.startTime}, cliffTime ${params.cliffTime}, endTime ${params.endTime}, revocable true.
  Las direcciones del token y del contrato dependen del despliegue de cada red.
- El periodo dura 24 horas y tiene cliff de 30 minutos; se creo con inicio una hora anterior
  para medir un claim parcial inmediatamente, sin alterar el reloj de ninguna testnet.
- Preparacion: mint de 1.000 mUSD. Secuencia medida: approve de 100 mUSD,
  createAgreement, claim y cancel. Despues se retiro el remanente adquirido al cancelar.
- Los timestamps de inclusion no se pueden igualar entre redes publicas. Los parametros
  son iguales; el monto exacto adquirido puede variar con los segundos transcurridos.
  Ambos acuerdos terminan Cancelled y sin saldo reclamable.
- Se usa gasUsed del recibo y effectiveGasPrice (precio realmente pagado, no maxFeePerGas).
  Ejecucion = gasUsed * effectiveGasPrice. Base agrega l1Fee para publicar datos en L1.
- El total se comprueba con la diferencia de saldo ETH del emisor entre el bloque anterior
  y el de inclusion. No se envia valor ETH en las operaciones; se valida que no haya otra
  transaccion del emisor en el bloque. Otros cargos = total - ejecucion - l1Fee;
  asi se incluyen cargos de operador si existen en el fork activo, sin ignorarlos ni
  asumir una formula desactualizada. Los campos originales del recibo se conservan en JSON.

## Recibos y costos reales

Todas las cantidades monetarias de esta tabla son ETH de prueba, excepto el precio de gas en gwei.
Mint y claimAfterCancel son preparacion/limpieza; los despliegues se muestran por separado del flujo.

| Operacion | Red | Gas usado | Precio gas (gwei) | Ejecucion (ETH) | Cargo L1 (ETH) | Otros (ETH) | Total (ETH) | Explorador |
|---|---|---|---|---|---|---|---|---|
${rows.join("\n")}

## Comparacion del flujo obligatorio

| Operacion | Sepolia (ETH) | Base Sepolia (ETH) | Sepolia / Base | Ahorro de Base |
|---|---|---|---|---|
${comparisons.join("\n")}
| Total approve + create + claim + cancel | ${formatEther(s)} | ${formatEther(b)} | ${ratio(s,b)}x | ${percent(s,b)} % |

## Conclusion y limites

En esta muestra el flujo costo ${formatEther(s)} ETH en Sepolia y ${formatEther(b)} ETH
en Base Sepolia. ${conclusion}
Con el mismo bytecode, el gas usado no fue igual en las dos redes: en el flujo vario hasta
${gasRatioOf(maxOp, sepolia, base)}x (${maxOp}: ${gasOf(sepolia, maxOp)} contra ${gasOf(base, maxOp)} de gas) y en el despliegue de VestingPayroll
${gasRatioOf("deployVestingPayroll", l1, l2)}x. No se comprobo la causa transaccion por transaccion (lo medido son los recibos).
Sepolia activo el 6/10/2026 la actualizacion Glamsterdam, que incluye EIP-8037: encarece y mide
aparte el gas por crear estado nuevo (desplegar contratos, escribir slots nuevos). Coincide con
que lo que mas subio fueron los despliegues y createAgreement, y mucho menos claim y cancel.
Como ejecucion = gas usado x precio del gas, la diferencia del flujo se separa en dos factores:
el precio del gas fue ${(priceS / priceB).toFixed(2)}x menor en Base (${gwei(priceS)} contra ${gwei(priceB)} gwei) y se uso ${(gasS / gasB).toFixed(3)}x menos gas
(${gasS} contra ${gasB}). Multiplicando los dos factores (${(priceS / priceB).toFixed(2)} x ${(gasS / gasB).toFixed(3)}) se obtiene aprox.
${((priceS / priceB) * (gasS / gasB)).toFixed(1)}x; el total medido, con el cargo L1 de Base incluido, es ${ratio(s,b)}x. Ese cargo no debe omitirse.

Es una sola muestra en testnets: precios, demanda, prioridad y reglas de gas pueden diferir
entre redes y variar con el tiempo. Los resultados no son una cotizacion de mainnet ni una
garantia de ahorro futuro. Un menor costo permite reclamos mas frecuentes, pero introduce
dependencia del secuenciador y diferencias de finalidad/puentes. El fondeo mediante el puente
se registra aparte en \`docs/mediciones/fondeo-base.json\` y no se suma a cada operacion del protocolo.

## Reproducir

1. Instalar dependencias y completar .env con SEPOLIA_RPC_URL, BASE_SEPOLIA_RPC_URL y
   DEPLOYER_PRIVATE_KEY de una cuenta de prueba. Fondear esa cuenta en ambas redes.
2. Ejecutar \`npx hardhat test\` (43 pruebas; cobertura de lineas 100 % en VestingPayroll.sol y 99.05 % en total).
3. Ejecutar \`npx hardhat run scripts/deploy.js --network sepolia\` y luego
   \`npx hardhat run scripts/deploy.js --network baseSepolia\`.
4. Ejecutar \`npx hardhat run scripts/medir-costos.js --network sepolia\` y luego
   \`npx hardhat run scripts/medir-costos.js --network baseSepolia\`.
5. Ejecutar \`node scripts/generar-comparacion.js\`.

Los scripts guardan hashes antes de esperar y reanudan registros existentes; no vuelven a
enviar operaciones confirmadas. Para una muestra nueva, archivar primero los JSON de ambas
redes y parametros compartidos, y crear nuevos despliegues. Nunca mezclar datos de muestras.
La dApp elige los contratos segun la red de la billetera (ver README); los registros por red se conservan en docs.

## Fuentes primarias

- [Redes y exploradores de Base](https://docs.base.org/get-started/connect-to-base).
- [Cargos de red de Base](https://docs.base.org/specifications/transactions/network-fees).
- [Fees de OP Stack, incluyendo cargo de operador](https://docs.optimism.io/op-stack/transactions/fees).
- [Contratos oficiales del puente](https://docs.base.org/specifications/reference/base-contracts).
- [Glamsterdam en testnets, incluye EIP-8037](https://blog.ethereum.org/2026/09/17/glamsterdam-testnet-announcement).
- [EIP-8037: aumento del gas por crear estado](https://eips.ethereum.org/EIPS/eip-8037).
`;
fs.writeFileSync("docs/COMPARACION_L2.md", text);
fs.writeFileSync("docs/DESPLIEGUE_SEPOLIA.md", `# Despliegue Sepolia con cliff

Este despliegue reemplaza para la dApp las direcciones del 10/11/2026, que correspondian
al contrato sin cliff. No usar el ABI nuevo contra aquellos contratos antiguos.

- Red: Ethereum Sepolia, chain ID 11155111.
- Cuenta: \`${l1.deployer}\`.
- MockUSD: [${l1.token}](https://sepolia.etherscan.io/address/${l1.token}).
- VestingPayroll con cliff: [${l1.vesting}](https://sepolia.etherscan.io/address/${l1.vesting}).
- Bloque inicial de VestingPayroll: ${l1.deployBlock}.
- Registro de transacciones: [despliegues/sepolia.json](despliegues/sepolia.json).
- [Mediciones y comparacion L2](COMPARACION_L2.md).

La dApp trae estas direcciones en \`frontend/src/contracts/deployment.sepolia.json\` y las usa
sola cuando MetaMask esta en Sepolia: no hace falta ejecutar nada mas. Si se vuelve a desplegar
en Sepolia, actualizar ese archivo con \`chainId\`, \`vesting\`, \`token\` y \`deployBlock\`
de \`docs/despliegues/sepolia.json\`.

Los ABI versionados corresponden a la version con cliff. Base Sepolia no esta configurada en la
dApp: solo se uso para medir costos.
La comprobacion de bytecode por RPC no implica publicacion del codigo fuente en Etherscan.
\`.env\` no se comparte ni se sube a Git.
`);
console.log("Informes generados desde las dos mediciones reales");
