# Vesting dApp — Obligatorio Blockchain 2026

dApp para administrar pagos salariales / acuerdos de vesting con smart contracts sobre una red EVM.
Un pagador crea un acuerdo, deposita por adelantado el monto en un ERC-20 y el beneficiario reclama
solo lo devengado linealmente entre `startTime` y `endTime`, con un cliff opcional
(antes de esa fecha no se puede reclamar nada).

Universidad ORT Uruguay — Taller de Tecnologías 2 (78500) — Grupo M6C.

## Enlaces

- Repositorio Git (código completo: contratos, frontend, tests y scripts): https://github.com/franjiji/obliBlockchain
- Video de demostración (máx. 8 minutos): https://www.youtube.com/watch?v=8NeOR1RWOFg

## Integrantes

- Francisco Castelli (322738)
- Matías González (325417)

## Estructura

```
contracts/   Smart contracts (Solidity)
test/        Tests de los contratos
scripts/     Scripts de deploy y utilidades
frontend/    dApp (React + Vite + ethers)
docs/        Despliegues y mediciones de costos (desafío D)
```

## Requisitos

- Node.js 22.13.0 o posterior y npm (probado con Node.js 24.11.1)
- MetaMask (u otra billetera EVM) para usar la dApp

## Instalación

```bash
git clone https://github.com/franjiji/obliBlockchain.git
cd obliBlockchain
npm install                      # contratos: Hardhat 3 + OpenZeppelin
cd frontend
npm install                      # dApp: React + Vite + ethers
cd ..                            # volver a la raíz del proyecto
```

La primera vez que se compila, Hardhat descarga el compilador solc 0.8.28 (requiere conexión a internet).

## Desplegar contratos

Red local (necesita dos terminales, ambas en la raíz del proyecto):

```bash
# terminal 1: deja corriendo la cadena local (chainId 31337)
npx hardhat node

# terminal 2: despliega MockUSD + VestingPayroll
npx hardhat run scripts/deploy.js --network localhost
```

El script imprime las direcciones, regala 100.000 mUSD a las primeras 5 cuentas de la red local y
escribe `frontend/src/contracts/` (direcciones y ABI) para que la dApp los use.
**Hay que volver a desplegar cada vez que se reinicia `npx hardhat node`.**

### Sepolia y Base Sepolia (desafío D)

Completar `.env` a partir de `.env.example` con `SEPOLIA_RPC_URL`,
`BASE_SEPOLIA_RPC_URL` y `DEPLOYER_PRIVATE_KEY` de una cuenta exclusiva de pruebas.
La configuración carga `.env` automáticamente; nunca se sube a Git.
La cuenta necesita ETH de prueba en cada red. `ETHERSCAN_API_KEY` no es necesaria
para desplegar, solo para publicar/verificar código fuente en un explorador.

```bash
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
npx hardhat run scripts/medir-costos.js --network sepolia
npx hardhat run scripts/medir-costos.js --network baseSepolia
node scripts/generar-comparacion.js
```

Los despliegues públicos no reparten tokens automáticamente. Los scripts conservan
un registro público por red en `docs/despliegues/` y `docs/mediciones/` para reanudar
sin repetir transacciones confirmadas. El mismo archivo de parametros se usa en ambas redes.
Para una muestra nueva, archivar primero todos los registros de la muestra anterior.

**Usar la dApp en Sepolia:** los contratos ya desplegados están en
`frontend/src/contracts/deployment.sepolia.json` (direcciones en
[DESPLIEGUE_SEPOLIA.md](docs/DESPLIEGUE_SEPOLIA.md)). La dApp elige los contratos según la red
de la billetera: con MetaMask en Sepolia usa los de Sepolia (no hace falta ejecutar el deploy) y
con MetaMask en Hardhat Local usa los que genera `scripts/deploy.js` en `deployment.json`.
Si la red no está soportada, la dApp ofrece cambiar a una de las dos. Base Sepolia (chain ID `84532`)
solo se usó para medir costos (ver [COMPARACION_L2.md](docs/COMPARACION_L2.md)).
El script `advance-time.js` es exclusivo de la red local.

## Ejecutar la dApp

1. Con la cadena local y el deploy hechos (ver arriba), en otra terminal:
   ```bash
   cd frontend
   npm run dev          # abre http://localhost:5173
   ```
2. En MetaMask agregá la red local (RPC `http://127.0.0.1:8545`, chainId `31337`; la dApp ofrece
   cambiar de red automáticamente) e importá una cuenta de `npx hardhat node` con su clave privada.
3. Para probar el devengado sin esperar, adelantá el reloj de la cadena:
   ```bash
   # PowerShell
   $env:SEGUNDOS=3600
   npx hardhat run scripts/advance-time.js --network localhost

   # cmd
   set SEGUNDOS=3600
   npx hardhat run scripts/advance-time.js --network localhost

   # bash
   SEGUNDOS=3600 npx hardhat run scripts/advance-time.js --network localhost
   ```

## Correr tests y coverage

```bash
npx hardhat test              # compila y corre los tests
npx hardhat test --coverage   # tests + reporte de cobertura de líneas
```

Resultado actual: 43 tests; cobertura de líneas de 100 % en `VestingPayroll.sol` y 99,05 % en total (con los mocks).

## Documentación

- Documento de arquitectura en PDF, con la declaración de uso de IA en la sección 8.2: incluido en el ZIP de la entrega
- [Despliegue actualizado en Sepolia con cliff](docs/DESPLIEGUE_SEPOLIA.md)
- [Comparación real de costos Sepolia vs Base Sepolia](docs/COMPARACION_L2.md)
