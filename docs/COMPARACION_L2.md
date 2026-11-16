# Comparacion de costos: Ethereum Sepolia y Base Sepolia

Desafio D. Informe generado el 2026-11-13T18:14:02.228Z desde los registros JSON publicos
de `docs/despliegues/` y `docs/mediciones/`. No contiene estimaciones ni datos simulados.
Version del contrato: cliff opcional, basada en `origin/feature/cliff` (4f96510).
Solidity 0.8.28, optimizador activo con 200 runs. Mismo bytecode en ambas redes:

`0x964d6e72ebc73c01ca6acc66040953e033dde6a54b7f5b3c510a7c640dc3f58d`

## Redes y despliegues

| Red | Chain ID | MockUSD | VestingPayroll |
|---|---|---|---|
| Sepolia | 11155111 | [0xbFcE372F590fc9b0028DFF35DdbBf064C9e7CcF7](https://sepolia.etherscan.io/address/0xbFcE372F590fc9b0028DFF35DdbBf064C9e7CcF7) | [0x4b557207Daaa63505fE5198FF4A6Bf64c38a1E5d](https://sepolia.etherscan.io/address/0x4b557207Daaa63505fE5198FF4A6Bf64c38a1E5d) |
| Base Sepolia | 84532 | [0x8fa90F42e535f0AD046688CA5D4d2Ee1bC3114B4](https://sepolia.basescan.org/address/0x8fa90F42e535f0AD046688CA5D4d2Ee1bC3114B4) | [0x79e245C375A5db8BcbA4eBCfE29bA7EAe6b8bFb4](https://sepolia.basescan.org/address/0x79e245C375A5db8BcbA4eBCfE29bA7EAe6b8bFb4) |

## Metodo

- Se desplegaron contratos nuevos y se uso la misma cuenta de prueba como pagador y beneficiario:
  `0x901f482CDAd9c06af11bbbAbE6E663f1172251C2`. Los tests de contratos cubren tambien cuentas distintas.
- Mismos parametros numericos en ambas redes: monto 100000000 unidades (100 mUSD),
  startTime 1794589824, cliffTime 1794591624, endTime 1794676224, revocable true.
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
| deployMockUSD | Sepolia | 3315362 | 1.0 | 0.003315362 | 0.0 | 0.0 | 0.003315362 | [Tx](https://sepolia.etherscan.io/tx/0x2bdb3ea9b29d0a1408008562e013196016c47703c65319bcfe065f05eab73d81) |
| deployMockUSD | Base Sepolia | 507908 | 0.006 | 0.000003047448 | 0.000000000007041129 | 0.0 | 0.000003047455041129 | [Tx](https://sepolia.basescan.org/tx/0x8d518b18ecb85594659585b9827d292309c15523de43c927c11c3aeb8e02d022) |
| deployVestingPayroll | Sepolia | 7240189 | 1.0 | 0.007240189 | 0.0 | 0.0 | 0.007240189 | [Tx](https://sepolia.etherscan.io/tx/0x185d3ad9a7f2efbf55421525b8d5b17df3688f69da9492b227aba5d6a2638cac) |
| deployVestingPayroll | Base Sepolia | 1043749 | 0.006 | 0.000006262494 | 0.000000000012930927 | 0.0 | 0.000006262506930927 | [Tx](https://sepolia.basescan.org/tx/0x43793657f099af04bf8ed0689764c976fea1e202cade95c729859061d8e8263a) |
| mint | Sepolia | 238419 | 1.0 | 0.000238419 | 0.0 | 0.0 | 0.000238419 | [Tx](https://sepolia.etherscan.io/tx/0x168589043d3ed789358ebc8bca15906b1d4090c587cf38d362aa712ad472413a) |
| mint | Base Sepolia | 68379 | 0.006 | 0.000000410274 | 0.000000000000410059 | 0.0 | 0.000000410274410059 | [Tx](https://sepolia.basescan.org/tx/0xf99dd9ff4d099c84cefaf1d1029b491d45c8bd0d88ec358b6c81b612a3e02f7e) |
| approve | Sepolia | 128250 | 1.0 | 0.00012825 | 0.0 | 0.0 | 0.00012825 | [Tx](https://sepolia.etherscan.io/tx/0x07ef4864e1b8cb46c9a8b4df768673d9cbe2181f469563a05adda35baeed558a) |
| approve | Base Sepolia | 46330 | 0.006 | 0.00000027798 | 0.000000000000410059 | 0.0 | 0.000000277980410059 | [Tx](https://sepolia.basescan.org/tx/0x2848155d76939ee88eec2d96451181a600b803378e8d692c577e9647d2ee81d1) |
| createAgreement | Sepolia | 707405 | 1.0 | 0.000707405 | 0.0 | 0.0 | 0.000707405 | [Tx](https://sepolia.etherscan.io/tx/0x538eea9a0c8a158b10606428a000a3d88cef35c656e905900121b673669286d1) |
| createAgreement | Base Sepolia | 177401 | 0.006 | 0.000001064406 | 0.000000000000535394 | 0.0 | 0.000001064406535394 | [Tx](https://sepolia.basescan.org/tx/0x95b6571a0df2eeed86b94638c32c143d716b18c8d8102998c43e2883a30e9098) |
| claim | Sepolia | 71087 | 1.0 | 0.000071087 | 0.0 | 0.0 | 0.000071087 | [Tx](https://sepolia.etherscan.io/tx/0x55231da8d6e922a36148d43ccdbb46df0adda295f299018c5fe0ae827b754cf3) |
| claim | Base Sepolia | 55087 | 0.006 | 0.000000330522 | 0.00000000000038769 | 0.0 | 0.00000033052238769 | [Tx](https://sepolia.basescan.org/tx/0xc833c7b5c872c6730601e4a08c6956cd646b399ada6d9297a547f61f39ce295d) |
| cancel | Sepolia | 81526 | 1.0 | 0.000081526 | 0.0 | 0.0 | 0.000081526 | [Tx](https://sepolia.etherscan.io/tx/0x5e6ec9b6b982e8b5bbb27f4bc2185200a911afe3798c232a9bc22b4efb01f2be) |
| cancel | Base Sepolia | 58326 | 0.006 | 0.000000349956 | 0.00000000000038769 | 0.0 | 0.00000034995638769 | [Tx](https://sepolia.basescan.org/tx/0x5d7f8cc6353f53542075320bae61524ed916748d37a243f5d0e3999793ad3610) |
| claimAfterCancel | Sepolia | 65092 | 1.0 | 0.000065092 | 0.0 | 0.0 | 0.000065092 | [Tx](https://sepolia.etherscan.io/tx/0x9cb54e8928489dd5592987573dba1643a2e00a48fa7b5b595025454b26579fca) |
| claimAfterCancel | Base Sepolia | 50564 | 0.006 | 0.000000303384 | 0.00000000000038769 | 0.0 | 0.00000030338438769 | [Tx](https://sepolia.basescan.org/tx/0x3f489cd3b0bbb3afa0d9430f6e75ee28b0d4532420761810ca08e6d1a9789fd7) |

## Comparacion del flujo obligatorio

| Operacion | Sepolia (ETH) | Base Sepolia (ETH) | Sepolia / Base | Ahorro de Base |
|---|---|---|---|---|
| approve | 0.00012825 | 0.000000277980410059 | 461.36x | 99.78 % |
| createAgreement | 0.000707405 | 0.000001064406535394 | 664.60x | 99.85 % |
| claim | 0.000071087 | 0.00000033052238769 | 215.07x | 99.54 % |
| cancel | 0.000081526 | 0.00000034995638769 | 232.96x | 99.57 % |
| Total approve + create + claim + cancel | 0.000988268 | 0.000002022865720833 | 488.55x | 99.80 % |

## Conclusion y limites

En esta muestra el flujo costo 0.000988268 ETH en Sepolia y 0.000002022865720833 ETH
en Base Sepolia. Base fue 488.55 veces mas barata, con un ahorro de 99.80 %.
Con el mismo bytecode, el gas usado no fue igual en las dos redes: en el flujo vario hasta
3.99x (createAgreement: 707405 contra 177401 de gas) y en el despliegue de VestingPayroll
6.94x. No se comprobo la causa transaccion por transaccion (lo medido son los recibos).
Sepolia activo el 6/10/2026 la actualizacion Glamsterdam, que incluye EIP-8037: encarece y mide
aparte el gas por crear estado nuevo (desplegar contratos, escribir slots nuevos). Coincide con
que lo que mas subio fueron los despliegues y createAgreement, y mucho menos claim y cancel.
Como ejecucion = gas usado x precio del gas, la diferencia del flujo se separa en dos factores:
el precio del gas fue 166.67x menor en Base (1.0 contra 0.006 gwei) y se uso 2.931x menos gas
(988268 contra 337144). Multiplicando los dos factores (166.67 x 2.931) se obtiene aprox.
488.5x; el total medido, con el cargo L1 de Base incluido, es 488.55x. Ese cargo no debe omitirse.

Es una sola muestra en testnets: precios, demanda, prioridad y reglas de gas pueden diferir
entre redes y variar con el tiempo. Los resultados no son una cotizacion de mainnet ni una
garantia de ahorro futuro. Un menor costo permite reclamos mas frecuentes, pero introduce
dependencia del secuenciador y diferencias de finalidad/puentes. El fondeo mediante el puente
se registra aparte en `docs/mediciones/fondeo-base.json` y no se suma a cada operacion del protocolo.

## Reproducir

1. Instalar dependencias y completar .env con SEPOLIA_RPC_URL, BASE_SEPOLIA_RPC_URL y
   DEPLOYER_PRIVATE_KEY de una cuenta de prueba. Fondear esa cuenta en ambas redes.
2. Ejecutar `npx hardhat test` (43 pruebas; cobertura de lineas 100 % en VestingPayroll.sol y 99.05 % en total).
3. Ejecutar `npx hardhat run scripts/deploy.js --network sepolia` y luego
   `npx hardhat run scripts/deploy.js --network baseSepolia`.
4. Ejecutar `npx hardhat run scripts/medir-costos.js --network sepolia` y luego
   `npx hardhat run scripts/medir-costos.js --network baseSepolia`.
5. Ejecutar `node scripts/generar-comparacion.js`.

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
