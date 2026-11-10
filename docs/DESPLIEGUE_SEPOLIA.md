# Despliegue en Sepolia

Fecha: 10/11/2026. Red: Ethereum Sepolia (chain ID `11155111`).

Cuenta que desplego: `0x901f482CDAd9c06af11bbbAbE6E663f1172251C2`.

| Contrato | Direccion | Bloque |
|---|---|---|
| MockUSD | [0x4CfB5b8bAB7c3AC8fb376170f2D390dD4360CCE4](https://sepolia.etherscan.io/address/0x4CfB5b8bAB7c3AC8fb376170f2D390dD4360CCE4) | 12107715 |
| VestingPayroll | [0x740959399404dEF5D3277c53C32ed9Ff4efFAF3A](https://sepolia.etherscan.io/address/0x740959399404dEF5D3277c53C32ed9Ff4efFAF3A) | 12107716 |

Transacciones:

- [Creacion de MockUSD](https://sepolia.etherscan.io/tx/0xb67fd3bbe72d0b1dbfb8ab3dde05acde74cef7e9cbf96795ae73c848d115d750).
- [Creacion de VestingPayroll](https://sepolia.etherscan.io/tx/0x18941bd80b0850c7694083b4cb63046490f3044c054ef3b34d5cde2f9d6e6f32).

Costo total: `0.010207611` ETH de Sepolia. Ambos recibos tienen estado exitoso
y el bytecode consultado por RPC coincide con el de los artefactos compilados.
Esto no equivale a verificar el codigo fuente en Etherscan; esa publicacion no se realizo.

## Usar este despliegue sin volver a desplegar

Crear `frontend/src/contracts/deployment.json` con estos datos publicos:

```json
{
  "chainId": 11155111,
  "vesting": "0x740959399404dEF5D3277c53C32ed9Ff4efFAF3A",
  "token": "0x4CfB5b8bAB7c3AC8fb376170f2D390dD4360CCE4",
  "deployBlock": 12107716
}
```

Los ABI ya estan en el repositorio. Instalar las dependencias del frontend,
ejecutar `npm run dev` desde `frontend/` y conectar MetaMask en Sepolia.
No se necesita la clave privada del deployer para utilizar la dApp con otra cuenta.

No se repartieron tokens automaticamente en Sepolia: al terminar el despliegue,
`MockUSD.totalSupply()` y `VestingPayroll.agreementCount()` eran cero.
La pantalla Crear acuerdo permite obtener 1.000 mUSD con el boton de tokens de
prueba (requiere una transaccion con ETH de Sepolia para gas).

No ejecutar `advance-time.js` en Sepolia: solo funciona sobre la cadena local.

## Validaciones realizadas

- 27 tests aprobados con `hardhat test --coverage`.
- Cobertura global de lineas: 97,92 %; VestingPayroll: 100 %.
- Build del frontend exitoso con la configuracion de Sepolia.
- Token consultado por RPC: simbolo `mUSD`, 6 decimales.
- No se modificaron archivos de `contracts/`.
- Despliegue local comprobado: las primeras cinco cuentas reciben 100.000 mUSD cada una.
- Prueba interactiva en Sepolia realizada por Matias con MetaMask: mint de prueba,
  approve, creacion, reclamo parcial, cancelacion, reclamo posterior y consulta del historial.

## Prueba del acuerdo 1 en Sepolia

Pagador y beneficiario: `0x901f482CDAd9c06af11bbbAbE6E663f1172251C2`.
Periodo: 10/11/2026 de 20:08 a 20:19 (Uruguay). Acuerdo revocable.

| Operacion | Resultado | Transaccion |
|---|---|---|
| Creacion | 10 mUSD depositados | [Ver](https://sepolia.etherscan.io/tx/0x7691919d4d835bb82a5bea76ddf0e615d6e4044a37e5d8eb2c731ed77755688d) |
| Primer reclamo | 2,90909 mUSD | [Ver](https://sepolia.etherscan.io/tx/0x2412926e5989eb1f718cb644213cc5bd6c53180b4b99d2f559a85c8e959d5ba6) |
| Cancelacion | 4 mUSD devengados; 6 mUSD devueltos | [Ver](https://sepolia.etherscan.io/tx/0xe9aef62fd31e312307ae7aff27b1f1a27c4a5f5c706086c664f5ed0d2e14a8f2) |
| Reclamo posterior | 1,09091 mUSD; acumulado 4 mUSD | [Ver](https://sepolia.etherscan.io/tx/0xd3509948a4b5e7ca2d050e7553540a7c5d7060fbc2e5fee530964106430d36ef) |

La interfaz mostro las transacciones confirmadas, el estado Cancelado, el progreso
congelado en 40 %, el historial y un saldo disponible final de cero.
Se contrastaron por RPC los eventos y el estado del acuerdo: los reclamos suman
4 mUSD, el reembolso es 6 mUSD y ambos conceptos suman los 10 mUSD depositados.
El devengado sigue siendo 4 mUSD despues de la cancelacion.

Alcance: esta prueba de interfaz utilizo una sola cuenta con ambos roles. Los
tests automatizados usan cuentas distintas para pagador y beneficiario y cubren
tambien reclamos y cancelaciones por terceros no autorizados.

La URL privada del RPC y la clave de firma se guardan solamente en `.env`, que
esta excluido de Git. Este documento contiene solo informacion publica.
