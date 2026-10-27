

<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 <u>www.ort.edu.uy</u> 

|**EVALUACIÓN**|**Obligatorio**<br>**GRUPO**<br>M6C<br>**FECHA**<br>14/09/2026|
|---|---|
|**MATERIA**|Taller de Tecnologías 2(78500)|
|**CARRERA**|Ingeniería en Sistemas|
|**CONDICIONES**|**- Puntaje máximo:**40 puntos<br>**- Puntaje mínimo:**1 puntos<br>**- Fecha de entrega: **16/11/2026 hasta las 21:00 horas en gestion.ort.edu.uy (max. 40Mb en<br>formato zip, rar o pdf)|
||**Uso de material de apoyo y/o consulta**<br>Inteligencia Artificial Generativa<br>-<br>Seguir las pautas de los docentes: Se deben seguir las instrucciones específicas de los<br>docentes sobre cómo utilizar la IA en cada curso.<br>-<br>Citar correctamente las fuentes y usos de IA: Siempre que se utilice una herramienta de IA para<br>generar contenido, se debe citar adecuadamente la fuente y la forma en que se utilizó.<br>-<br>Se debe indicar:<br>a.<br>la /las herramientas utilizadas y<br>b.<br>el contexto de uso: por ejemplo, generación de ideas, redacción inicial, análisis de<br>datos, corrección de estilo, etc.<br>-<br>Todo contenido producido por IAG debe ser revisado y verificado; cualquier error presente será<br>responsabilidad del estudiante.<br>-<br>Ser responsables con el uso de la IA: Conocer los riesgos y desafíos, como la creación de<br>“alucinaciones”, los peligros para la privacidad, las cuestiones de propiedad intelectual, los<br>sesgos inherentes y la producción de contenido falso.<br>-<br>El uso de herramientas de Inteligencia Artificial Generativa (IAG) puede emplearse como apoyo<br>en el proceso de aprendizaje. Sin embargo, no sustituye el razonamiento crítico ni la<br>elaboración personal. El estudiante es responsable de que el trabajo presentado refleje su<br>propia comprensión, análisis y proceso cognitivo sobre el tema.<br>-<br>La defensa es obligatoria y eliminatoria.<br>-<br>La defensa será presencial salvo en casos en que se habilite la defensa oral sincrónica en<br>forma remota.<br>-<br>En caso de existir dudas sobre la autoría, plagio o uso no atribuido de IAG, el docente tendrá la<br>opción de convocar al equipo de obligatorio a una defensa específica e individual sobre el<br>tema.<br>**Defensa**<br>**Fecha de defensa: A coordinar con los docentes**<br>  La defensa es obligatoria y eliminatoria. El docente es quien definirá y comunicará la modalidad, y<br>mecánica de defensa.La no presentación a la misma implica la pérdida de la totalidad de los puntos del<br>Obligatorio.<br>**IMPORTANTE: **<br>1)  Inscribirse<br>2) Formar grupos de hasta 3 personas del mismo dictado<br>3) Subir el trabajo a Gestión antes de la hora indicada (ver hoja al final del documento:<br>“RECORDATORIO”)|



Página 1 de 9 

**Escuela de Ingeniería** 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 

Aquellos de ustedes que presenten alguna dificultad con su inscripción o tengan inconvenientes técnicos, <u>por favor contactarse con la Coordinadora de cursos o Coordinación Adjunta</u> **<u>antes de las 20:00h</u>** <u>del día de la entrega, a través del mail: adjuntos_ei@ort.edu.uy.</u> 

## **1. Objetivo** 

Diseñar e implementar una dApp que permita administrar pagos salariales o acuerdos de vesting utilizando smart contracts sobre una red EVM. 

El sistema deberá permitir que una empresa o pagador cree un flujo de pago para un beneficiario, deposite por adelantado los fondos correspondientes y que el beneficiario pueda reclamar únicamente la parte que haya devengado según el tiempo transcurrido. 

El objetivo es integrar contenidos trabajados en el curso: Ethereum y EVM, Solidity, manejo de estado, storage/memory/calldata, eventos, ERC-20, control de acceso, seguridad, tooling, tests y criterios de escalabilidad. 

## **2. Escenario** 

Una organización desea pagar salarios, honorarios o beneficios de vesting utilizando un token ERC-20 estable. 

Para cada acuerdo se define: 

- pagador; 

- beneficiario; 

- token ERC-20; 

- monto total; 

- fecha de inicio; 

- fecha de finalización; 

- condición de revocabilidad. 

El monto total debe quedar fondeado al momento de crear el acuerdo. 

A medida que transcurre el tiempo, el beneficiario acumula derecho a retirar una fracción proporcional del total. El contrato deberá calcular cuánto se encuentra devengado y cuánto ya fue retirado. 

## **3. Reglas generales** 

Cada acuerdo deberá tener un identificador único. 

Un acuerdo podrá encontrarse, como mínimo, en uno de los siguientes estados: 

Active — El acuerdo está vigente y continúa acumulando saldo devengado. Completed — Finalizó el período y todo el saldo disponible fue reclamado. 

Cancelled — El pagador canceló un acuerdo revocable. Lo ya devengado permanece a favor del beneficiario y lo no devengado vuelve al pagador. 

Página 2 de 9 

**Escuela de Ingeniería** 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 

El equipo podrá utilizar una máquina de estados equivalente siempre que mantenga las mismas garantías. 

## **4. Creación de acuerdos** 

El pagador deberá poder crear un acuerdo indicando: 

- beneficiario; 

- token ERC-20; 

- monto total; 

- fecha de inicio; 

- fecha de finalización; 

- si el acuerdo es revocable o no. 

### **Requisitos:** 

- El beneficiario no puede ser address(0). 

- El monto debe ser mayor a cero. 

- La fecha de finalización debe ser posterior a la fecha de inicio. 

- El contrato deberá recibir y bloquear el monto total mediante transferFrom al momento de crear el acuerdo. 

- Deberá emitirse un evento con la información necesaria para identificar el acuerdo. 

## **5. Cálculo de vesting** 

El saldo devengado deberá crecer linealmente entre startTime y endTime. 

Antes de startTime, el monto devengado será cero. 

Entre startTime y endTime, el monto devengado deberá calcularse en forma proporcional al tiempo transcurrido. 

Después de endTime, el monto devengado será igual al monto total. 

El monto reclamable será: 

monto reclamable = monto devengado – monto ya reclamado 

El contrato deberá evitar errores de redondeo que permitan reclamar más tokens que los depositados. 

## **6. Reclamos** 

El beneficiario podrá reclamar el saldo disponible en cualquier momento. 

Requisitos: 

- Solo el beneficiario del acuerdo podrá reclamar. 

- Nunca podrá retirar más de lo devengado. 

- El monto ya reclamado deberá actualizarse antes de realizar transferencias externas. 

- Un reclamo sin saldo disponible deberá revertir. 

- Se deberá emitir un evento por cada retiro. 

Página 3 de 9 

**Escuela de Ingeniería** 

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

- El diseño deberá impedir dobles reclamos. 

## **7. Cancelación** 

Un acuerdo marcado como revocable podrá ser cancelado por el pagador antes de su finalización. 

Al cancelar: 

- se calculará el monto devengado hasta ese instante; 

- el beneficiario conservará el derecho sobre ese monto; 

- el saldo aún no devengado será devuelto al pagador; 

- el acuerdo dejará de acumular nuevo saldo. 

Un acuerdo no revocable no podrá cancelarse. 

La cancelación no podrá eliminar ni reducir saldo ya devengado a favor del beneficiario. 

## **8. Token ERC-20** 

El obligatorio deberá utilizar un token ERC-20 para los pagos. 

El equipo podrá: 

- utilizar un ERC-20 de prueba provisto por el propio proyecto, o 

- implementar un token simple utilizando OpenZeppelin. 

El token de prueba podrá simular una stablecoin con una cantidad fija de decimales. 

No se requiere integración con una stablecoin real, oracles ni cotizaciones externas. 

### **El equipo deberá poder explicar durante la defensa:** 

- approve; 

- allowance; 

- transferFrom; 

- transfer; 

- por qué se utiliza SafeERC20 o una solución equivalente. 

## **9. Seguridad** 

La seguridad forma parte central de la evaluación. 

### **Como mínimo deberán contemplarse:** 

- control de acceso; 

- doble reclamo; 

Página 4 de 9 

**Escuela de Ingeniería** 

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

- cancelación no autorizada; 

- cancelación de acuerdos no revocables; 

- reclamos antes del inicio; 

- reclamos posteriores a una cancelación; 

- valores de tiempo inválidos; 

- redondeos; 

- reentrancy o comportamiento malicioso durante transferencias de tokens; 

- validación de parámetros de entrada. 

Se prefieren custom errors sobre strings de revert cuando resulte razonable. 

Las transiciones importantes deberán emitir eventos. 

## **10. Storage, memory y calldata** 

El equipo deberá justificar al menos tres decisiones de diseño relacionadas con el almacenamiento y paso de datos. 

### **La documentación deberá explicar, con ejemplos del propio código:** 

- qué información se mantiene en storage; 

- cuándo se utiliza calldata; 

- cuándo se utiliza memory; 

- qué impacto tienen estas decisiones sobre gas y ejecución. 

No se evaluará únicamente que el código compile: se deberá demostrar comprensión del modelo de memoria de Solidity. 

## **11. Tests** 

Los smart contracts deberán alcanzar al menos 75% de line coverage. 

### **Como mínimo deberán existir tests para:** 

- creación válida de un acuerdo; 

- parámetros inválidos; 

- intento de creación sin allowance suficiente; 

- monto devengado antes de startTime; 

- monto devengado durante el período; 

- monto devengado al finalizar; 

- reclamo parcial; 

- múltiples reclamos; 

- intento de doble reclamo; 

- reclamo por una cuenta no autorizada; 

- cancelación válida; 

- cancelación por una cuenta no autorizada; 

- cancelación de acuerdo no revocable; 

- devolución correcta del saldo no devengado; 

Página 5 de 9 

**Escuela de Ingeniería** 

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

- preservación del saldo devengado luego de cancelar; 

- casos de borde de redondeo; 

- defensa frente a reentrancy o test equivalente. 

Los tests deberán manipular el tiempo de la blockchain local de forma reproducible. 

## **12. dApp** 

La interfaz deberá utilizar lecturas y escrituras reales sobre los smart contracts. No se aceptarán datos simulados para las funcionalidades obligatorias. 

### **Pantallas mínimas:** 

### **1. Crear acuerdo** 

- beneficiario; 

- token; 

- monto total; 

- fecha de inicio; 

- fecha de finalización; 

- revocable / no revocable; 

- approve + creación. 

### **2. Acuerdos creados** 

- listado de acuerdos donde la billetera conectada es pagador; 

- estado; 

- monto total; 

- monto devengado; 

- opción de cancelar cuando corresponda. 

### **3. Mis ingresos** 

- acuerdos donde la billetera conectada es beneficiario; 

- monto total; 

- monto devengado; 

- monto ya reclamado; 

- monto disponible; 

- acción Reclamar. 

### **4. Detalle del acuerdo** 

- información completa; 

- progreso temporal; 

- estado; 

- historial básico de eventos relevantes. 

### **La dApp deberá:** 

- conectar una billetera EVM; 

- mostrar cuenta y red conectadas; 

Página 6 de 9 

**Escuela de Ingeniería** 

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

- mostrar estado pendiente, confirmado o fallido de cada transacción; 

- actualizar la información luego de una transacción sin requerir recargar manualmente toda la aplicación. 

## **13. Arquitectura y documentación** 

### **El equipo deberá entregar un documento que incluya:** 

- diagrama de componentes; 

- responsabilidades de cada contrato; 

- estructura utilizada para representar un acuerdo; 

- máquina de estados; 

- fórmula de vesting; 

- decisiones de storage/memory/calldata; 

- medidas de seguridad; 

- eventos definidos; 

- principales casos de borde; 

- limitaciones conocidas. 

Además, deberán incluir una breve comparación conceptual entre desplegar el protocolo en Ethereum L1 y en una L2, considerando costo de gas, frecuencia esperada de reclamos y experiencia de usuario. 

No se exige deploy obligatorio en una L2. 

## **14. Entregables** 

### **Cada equipo deberá entregar:** 

- repositorio Git con smart contracts, frontend, tests y scripts; 

- README con instrucciones paso a paso para instalar dependencias, desplegar contratos, ejecutar la dApp, correr tests y generar coverage; 

- documento de arquitectura; 

- video de demostración de hasta 8 minutos; 

- declaración del uso de herramientas de Inteligencia Artificial Generativa según las condiciones generales del obligatorio. 

## **15. Criterios de evaluación – 30 puntos** 

Smart contracts y modelo de vesting — 9 puntos Seguridad — 5 puntos Tests — 5 puntos ERC-20 y manejo de tokens — 3 puntos dApp e integración Web3 — 4 puntos Arquitectura y documentación — 4 puntos 

Página 7 de 9 

**Escuela de Ingeniería** 

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

## **16. Desafíos opcionales** 

Los siguientes desafíos no son necesarios para obtener el puntaje completo. Podrán otorgar bonificación, sin superar el máximo final de 40 puntos. 

### **A. Cliff de vesting** 

Agregar un período de cliff configurable. Antes del cliff no se podrá reclamar ningún token. Luego del cliff deberá respetarse el esquema de vesting definido. 

### **B. Upgradeabilidad** 

Implementar una versión upgradeable mediante UUPS o patrón equivalente y demostrar que un upgrade preserva correctamente todos los acuerdos existentes. 

### **C. Batch payroll** 

Permitir crear varios acuerdos salariales en una única operación y analizar el impacto en consumo de gas. 

### **D. Deploy en L2** 

Desplegar la solución en una testnet L2 EVM compatible y comparar el costo de operaciones relevantes con una red Ethereum de prueba. 

### **E. Permit** 

Incorporar soporte EIP-2612 Permit para reducir el flujo approve + create cuando el token utilizado lo permita. 

## **17. Defensa – 10 puntos** 

La defensa tendrá un valor máximo de 10 puntos. 

Los grupos estarán integrados por 3 estudiantes. 

### **Todos los integrantes deberán poder explicar:** 

- la arquitectura; 

- el cálculo de vesting; 

- la máquina de estados; 

- la lógica de cancelación; 

- el manejo del ERC-20; 

- las decisiones de storage/memory/calldata; 

- las medidas de seguridad; 

- los tests implementados. 

Los docentes podrán modificar cuentas, fechas, montos y parámetros durante la defensa para verificar que la solución no dependa de valores hardcodeados. 

Página 8 de 9 

**Escuela de Ingeniería** 

**Facultad de Ingeniería** **_Bernard Wand-Polak_** Cuareim 1451 11.100  Montevideo, Uruguay Tel. 2902 15 05 Fax 2908 13 70 ~~———_—~~ <u>www.ort.edu.uy</u> 



<!-- Start of picture text -->
UNIVERSIDAD ORT<br>Uruguay<br><!-- End of picture text -->

# **RECORDATORIO: IMPORTANTE PARA LA ENTREGA** 

La entrega de los obligatorios será en formato digital online, a excepción de algunas materias que se entregarán en Bedelía y en ese caso recibirá información específica en el dictado de la misma. 

Los principales aspectos a destacar sobre la **entrega online de obligatorios** son: 

1. Ingresá al sistema de Gestión. 

2. En el menú, seleccioná el ítem “Evaluaciones” y la instancia de evaluación correspondiente, que figura bajo el título “Inscripto”. 

3. Para iniciar la entrega hacé clic en el ícono: 



4. Ingresá el número de estudiante de cada uno de los integrantes y hacé clic en “Agregar”. El sistema confirmará que los integrantes estén inscriptos al obligatorio y, de ser así, mostrará el nombre y la fotografía de cada uno de ellos. Una vez agregados todos los integrantes, hacé clic en “Crear equipo”. 

**Cualquier integrante podrá:** 

- **Modificar la integración del equipo.** 

- **Subir el archivo de la entrega.** 

5. Seleccioná el archivo que deseás entregar. Verificá el nombre del archivo que aparecerá en la pantalla y hacé clic en “Subir” para iniciar la entrega. Cada equipo (hasta 3 estudiantes) debe entregar **un único archivo en formato zip o rar** (los documentos de texto deben ser pdf, y deben ir dentro del zip o rar). El archivo a subir debe tener **un tamaño máximo de 40mb** 

Cuando el archivo quede subido, se mostrará el nombre generado por el sistema (1), el tamaño y la fecha en que fue subido. 

6. El sistema enviará un e-mail a todos los integrantes del equipo informando los detalles del archivo entregado y confirmando que la entrega fue realizada correctamente. 

7. Podés cerrar la pestaña de entrega y continuar utilizando Gestión o salir del sistema. 

8. La **hora tope para subir el archivo será las 21:00** del día fijado para la entrega. 

9. La entrega se podrá realizar desde cualquier lugar (ej. hogar del estudiante, laboratorios de la Universidad, etc). 

10. Aquellos de ustedes que presenten alguna dificultad con su inscripción o tengan inconvenientes técnicos, por favor contactarse con la Coordinadora de Cursos o Coordinación Adjunta **antes de las 20:00h** del día de la entrega, a través del mail: adjuntos_ei@ort.edu.uy. 

Página 9 de 9 

**Escuela de Ingeniería** 

