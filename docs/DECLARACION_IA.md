# Declaración de uso de Inteligencia Artificial Generativa

Según las condiciones generales del obligatorio, se declara:

| Herramienta | Contexto de uso | Qué se generó / apoyó | Cómo se revisó y verificó |
|---|---|---|---|
| Claude Code (Anthropic) | Desarrollo del proyecto (arquitectura, código, pruebas y documentación) | Estructura inicial del repo; contrato `VestingPayroll` (incluido el cliff opcional) y mocks; 35 tests; dApp React con las 4 pantallas, conexión de billetera y lectura de eventos; scripts de deploy y de avance de tiempo; documento de arquitectura; revisión de las ramas de Sepolia y L2 | 35 tests automatizados con Hardhat; pruebas manuales de los flujos (crear, reclamar, cancelar, cliff) con MetaMask en red local; pruebas de interfaz automatizadas; revisión y ejecución por Francisco Castelli |
| Codex (OpenAI) | Configuracion y despliegue en testnets, desafio D | Soporte de Sepolia y Base Sepolia desde feature/cliff, fondeo de prueba por puente oficial, scripts de medicion y generacion de informes, documentacion y revision de costos; sin cambios en contracts/ ni test/ | 35 tests aprobados; cobertura global de lineas 98,17 %; prueba local del despliegue y flujo completo; comprobaciones de contabilizacion y reanudacion; bytecode, recibos y saldos contrastados en ambas testnets. Revision final del equipo pendiente |

_(Mantener esta tabla actualizada a medida que se use IA en contratos, tests, frontend y documentos.)_

Todo contenido producido con IA fue revisado y verificado por el equipo, que es responsable de cualquier error.
