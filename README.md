# Vesting dApp — Obligatorio Blockchain 2026

dApp para administrar pagos salariales / acuerdos de vesting con smart contracts sobre una red EVM.
Un pagador crea un acuerdo, deposita por adelantado el monto en un ERC-20 y el beneficiario reclama
solo lo devengado linealmente entre `startTime` y `endTime`, con un cliff opcional
(antes de esa fecha no se puede reclamar nada).

Universidad ORT Uruguay — Taller de Tecnologías 2 (78500) — Grupo M6C.

## Integrantes

- Francisco Castelli (322738)
- _(completar)_
- _(completar)_

## Estructura

```
contracts/   Smart contracts (Solidity)
test/        Tests de los contratos
scripts/     Scripts de deploy y utilidades
frontend/    dApp (React + Vite + ethers)
docs/        Documento de arquitectura, declaración de uso de IA y letra
```

## Requisitos

- Node.js 20+ y npm
- MetaMask (u otra billetera EVM) para usar la dApp

## Instalación

```bash
npm install                      # contratos: Hardhat 3 + OpenZeppelin
cd frontend && npm install       # dApp: React + Vite + ethers
```

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
   $env:SEGUNDOS=3600; npx hardhat run scripts/advance-time.js --network localhost
   ```

## Correr tests y coverage

```bash
npx hardhat test              # compila y corre los tests
npx hardhat test --coverage   # tests + reporte de cobertura de líneas
```

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md)
- [Declaración de uso de IA](docs/DECLARACION_IA.md)
- [Letra del obligatorio](docs/letra-obligatorio.md)
