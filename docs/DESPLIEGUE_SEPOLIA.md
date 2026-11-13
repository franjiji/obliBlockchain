# Despliegue Sepolia con cliff

Este despliegue reemplaza para la dApp las direcciones del 10/11/2026, que correspondian
al contrato sin cliff. No usar el ABI nuevo contra aquellos contratos antiguos.

- Red: Ethereum Sepolia, chain ID 11155111.
- Cuenta: `0x901f482CDAd9c06af11bbbAbE6E663f1172251C2`.
- MockUSD: [0xbFcE372F590fc9b0028DFF35DdbBf064C9e7CcF7](https://sepolia.etherscan.io/address/0xbFcE372F590fc9b0028DFF35DdbBf064C9e7CcF7).
- VestingPayroll con cliff: [0x4b557207Daaa63505fE5198FF4A6Bf64c38a1E5d](https://sepolia.etherscan.io/address/0x4b557207Daaa63505fE5198FF4A6Bf64c38a1E5d).
- Bloque inicial de VestingPayroll: 12127651.
- Registro de transacciones: [despliegues/sepolia.json](despliegues/sepolia.json).
- [Mediciones y comparacion L2](COMPARACION_L2.md).

La dApp trae estas direcciones en `frontend/src/contracts/deployment.sepolia.json` y las usa
sola cuando MetaMask esta en Sepolia: no hace falta ejecutar nada mas. Si se vuelve a desplegar
en Sepolia, actualizar ese archivo con `chainId`, `vesting`, `token` y `deployBlock` de
`docs/despliegues/sepolia.json`.

Los ABI versionados corresponden a la version con cliff. Base Sepolia no esta configurada en la
dApp: solo se uso para medir costos.
La comprobacion de bytecode por RPC no implica publicacion del codigo fuente en Etherscan.
`.env` no se comparte ni se sube a Git.
