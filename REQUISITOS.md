# Lista de Requisitos — Sistema de control de acceso Banco Andino

> Fuente de verdad: `01-transcripcion-reunion.md`. No hubo documento de requisitos; todo lo de abajo lo extraje de la reunión.
> **Convención:** cada requisito indica si es del **MVP** o **Fuera del MVP** (ver `ALCANCE.md`). Toda suposición está marcada con **[Supuesto]** y su justificación. Un requisito asumido en silencio es un riesgo; por eso todos están escritos.

---

## 1. Requisitos funcionales

### Gestión de empleados e identidad

- **RF-01 (MVP).** El sistema mantiene los datos de los empleados en la base propia; BioStar permanece y la información se sincroniza hacia los dispositivos. _"Que la información de nuestros empleados resida en nuestro sistema y que de alguna forma eso se sincronice con los dispositivos."_
- **RF-02 (MVP).** El **tipo de documento depende del país**. Colombia: cédula de ciudadanía (número), cédula de extranjería, PEP (permiso especial de permanencia), pasaporte (expatriados). Panamá: cédula formato `provincia-tomo-asiento` (`8-123-456`), extranjeros residentes `E-8-…`, naturalizados `N-19-…`. **"CC" no existe como tipo de documento en Panamá.**
- **RF-03 (MVP).** La identidad de un empleado **no puede depender solo del número de documento**: una cédula colombiana puede coincidir en dígitos con un documento panameño. La unicidad se modela por la combinación país/tipo/número. _(Resuelve la contradicción C-04.)_
- **RF-04 (MVP).** Un empleado puede estar asociado a **más de una sede** (relación muchos-a-muchos). No es un caso excepcional: ~40 personas (auditoría e infraestructura) rotan entre sedes, y en Panamá hay personal que se desplaza entre Ciudad de Panamá y Chitré. _(Resuelve la contradicción C-02.)_
- **RF-05 (Fuera del MVP).** Un empleado puede tener **más de un documento vigente** (los trasladados de Bogotá a Panamá conservan cédula colombiana y tramitaron carné de residente). El modelo lo contempla; la gestión activa se aplaza (el cliente dijo "ese caso lo revisamos posteriormente").

### Sedes

- **RF-06 (MVP).** Existen **6 sedes**: Torre Bogotá (varios pisos), Centro de Datos Bogotá (otra dirección, flujo mínimo de personas), Medellín, Cali, Ciudad de Panamá (principal en Panamá) y Chitré (Herrera, menor tamaño). El centro de datos es de especial interés para auditoría pese a su bajo flujo.

### Carga del archivo de Talento Humano

- **RF-07 (MVP).** La base **debe quedar poblada** con el archivo de Talento Humano (`03-empleados-banco-andino.xlsx`), única fuente de datos disponible.
- **RF-08 (MVP).** La ingesta **normaliza** los datos sucios declarados en la reunión: nombres de sede escritos de tres formas ("Bogotá", "BOGOTA", "Bogotá D.C.") a un catálogo único; fechas en formatos mixtos; números de documento con puntos; campos vacíos.
- **RF-09 (MVP).** La ingesta **detecta y consolida duplicados** originados cuando una persona se retira y reingresa, o cuando un trasladado se recrea como empleado nuevo.
- **RF-10 (MVP).** **Política de errores graduada**, según el criterio de Yolanda avalado por Marcela: si falta un dato **no crítico** (ej. teléfono) el registro se carga igual; si falta un dato **crítico** (documento) el registro se rechaza. **No se rechaza el archivo completo.** _(Resuelve la contradicción C-05.)_
- **RF-11 (MVP).** Al cargar, el sistema entrega un **resumen de carga**: qué registros ingresaron, cuáles no y **por qué motivo**, para que Talento Humano pueda ir a corregir.
- **RF-12 (MVP).** Los campos que no aportan al propósito de control de acceso (centro de costo, tipo de contrato — de nómina) **no se cargan al modelo núcleo**. _(Resuelve la contradicción C-06; ver decisión asumida.)_

### Aforo (ocupación)

- **RF-13 (MVP).** El sistema calcula el **aforo por sede**: quien registró ingreso y no ha registrado salida permanece adentro. El conteo **se reinicia a medianoche** (esquema que el cliente ya conoce), como solución al problema de salidas no marcadas.
- **RF-14 (Fuera del MVP).** Aforo con **granularidad por área/piso** (la torre tiene 12 pisos; el piso 4 tiene un cuarto técnico donde no pueden estar más de 8 personas simultáneamente). El modelo se deja preparado; no se construye. Recomendación de la propia gerente: "iniciar por sede y evaluarlo después… pero déjenlo contemplado".
- **RF-15 (Fuera del MVP).** Reporte de **ocupación mensual para el ministerio** en Panamá (regulación local: oficina completa, no por piso). Alberto puede generarlo él mismo si tiene acceso a los datos → queda cubierto indirectamente por la exportación.

### Reportes y tablero

- **RF-16 (MVP).** **Reporte de auditoría** filtrable por **rango de fechas** y por **sede** (casos: "todos los ingresos al centro de datos del mes anterior", "quién ingresó un sábado específico").
- **RF-17 (MVP).** **Todo lo que el sistema muestre debe poder exportarse** (Excel/CSV). _"Acá toda la operación se maneja en Excel."_
- **RF-18 (MVP).** **Tablero visual** que muestra cuántas personas hay en cada sede en este momento (solicitado por la gerencia).

### Integración BioStar

- **RF-19 (MVP, simulado).** El aplicativo se comunica con la **API REST de BioStar 2** (`bs2api.biostar2.com`; JSON; endpoints de usuarios, puertas, dispositivos y grupos de acceso). Como **no hay ambiente disponible**, la integración se **simula** contra un mock basado en la documentación.
- **RF-20 (Fuera del MVP).** Sincronización real y bidireccional (altas/bajas de empleados y grupos de acceso hacia dispositivos), pendiente de licencia/ambiente.

### Contratistas, visitantes y permisos

- **RF-21 (Fuera del MVP).** Gestión de **contratistas** (aseo, vigilancia, mantenimiento — ingresan a diario, no son empleados) y **visitantes** (hoy en planilla de recepción). El cliente los sacó del alcance inicial, pero Fernando advirtió: "nos lo van a solicitar".
- **RF-22 (Fuera del MVP).** **Tabla de rol/tipo de persona** que generalice empleado/contratista/visitante y siente la base de un futuro esquema de **permisos de acceso** (qué rol entra a qué sede/área y en qué horarios). Se deja planteado en el modelo para que sea agregar, no rediseñar.

---

## 2. Requisitos no funcionales y técnicos

- **RNF-01 (No negociable).** Base de datos **PostgreSQL** — estándar de la organización, "todo lo nuevo va en Postgres".
- **RNF-02 (No negociable).** Frontend **React** — para que el equipo interno pueda dar continuidad si el proveedor sale.
- **RNF-03 (No negociable).** CI/CD con **GitHub Actions** (trabajan sobre GitHub). Se descarta el Jenkins heredado (sin documentación ni responsable).
- **RNF-04 (Libre, a justificar).** **Backend libre**, siempre que sea "tecnología seria y bien argumentada".
- **RNF-05 (MVP).** **Desplegable con Docker** (el equipo tiene conocimiento). Mínimo: la base de datos en Docker; deseable `docker-compose` que levante todo.
- **RNF-06 (MVP).** **Mantenible.** "Que no sea una solución que después nadie pueda mantener."
- **RNF-07 (Fuera del MVP).** **Portabilidad nube / servidor propio.** Hoy operan on-premise con plan de migración a nube; se pide dejarlo "preparado para operar en cualquiera de los dos escenarios".
- **RNF-08 (Deseable).** **Despliegue automático**: al subir código, que se pruebe y despliegue solo, para no depender de ventanas y coordinación manual.
- **RNF-09 (Entregable de sustentación).** Documento de arquitectura que explique **qué se eligió, qué se descartó y por qué** — Marcela necesita sustentarlo ante un comité. Incluye la pregunta de microservicios (ver `ARQUITECTURA.md`).

---

## 3. Contradicciones, vacíos y suposiciones

> Donde el cliente se contradijo o no supo qué quería, y qué asumí en consecuencia.

| #        | Punto                                | Qué pasó en la reunión                                                                                                                                                                           | Decisión / Supuesto                                                                                                                                                                  |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **C-01** | Número de sedes                      | Marcela dudó: "son seis. No, cinco. Seis contando el centro de datos". Fernando insistió en incluir el centro de datos.                                                                          | **Son 6 sedes**, el centro de datos incluido (es justamente el de mayor interés para auditoría).                                                                                     |
| **C-02** | ¿Empleado en una o varias sedes?     | Marcela: "cada empleado tiene su sede asignada". Fernando: "parcialmente… son ~40 personas".                                                                                                     | **Relación muchos-a-muchos** (RF-04). La rotación no es excepcional.                                                                                                                 |
| **C-03** | Trasladados Bogotá→Panamá            | Alberto: "entiendo que los crearon nuevamente. Habría que verificarlo". Marcela: "he identificado registros duplicados".                                                                         | **[Supuesto]** Hay duplicados reales en el archivo; la ingesta debe deduplicar (RF-09).                                                                                              |
| **C-04** | ¿El número de documento es único?    | Marcela: "por supuesto, una cédula = una persona". Fernando: "una cédula colombiana puede coincidir en dígitos con un documento panameño… no asumiría que el número por sí solo sea suficiente". | **Clave de identidad compuesta** país/tipo/número (RF-03). Sigo el criterio técnico de Fernando.                                                                                     |
| **C-05** | ¿Se rechaza un registro con errores? | Yolanda: "preferiría que no". Marcela: "tampoco podemos cargar información inconsistente".                                                                                                       | **Política graduada** por criticidad del campo (RF-10). Concilia ambas posturas.                                                                                                     |
| **C-06** | Columnas de nómina                   | Marcela: "consérvenlas por si acaso, nunca se sabe". Fernando: "no arrastren información que no aporta. Si no se usa, no va".                                                                    | **[Supuesto]** Sigo a Fernando: no se cargan al núcleo (RF-12), por principio de mínimo dato necesario para el propósito de control de acceso. Reversible si aparece un caso de uso. |
| **C-07** | Nivel de aforo                       | Sede vs. piso vs. "área"/"cuarto técnico"; Panamá exige oficina completa; ni Marcela sabía "el término correcto".                                                                                | **Aforo por sede** en el MVP, modelo preparado para área (RF-13/RF-14). Recomendación de la propia gerente.                                                                          |
| **C-08** | Salidas no marcadas                  | Fernando: el personal sale por emergencia y no marca; el sistema los asume adentro. Marcela: "ustedes propongan la alternativa".                                                                 | **[Supuesto/Vacío]** El MVP usa reinicio a medianoche; la solución de fondo requiere respuesta del cliente (ver P-05).                                                               |
| **C-09** | Identificación por cédula            | Marcela: "por la cédula, todo el personal tiene cédula" → luego se corrigió: expatriados con pasaporte, venezolanos con PEP. "No todos tienen cédula".                                           | Identidad por **documento genérico tipado por país** (RF-02), no por "cédula".                                                                                                       |
| **C-10** | Dos documentos vigentes              | Alberto lo señaló; Marcela: "ese caso lo revisamos posteriormente".                                                                                                                              | Modelo lo soporta (RF-05); gestión activa aplazada.                                                                                                                                  |
| **C-11** | Criticidad de nombre/apellido/país en RF-10 | RF-10 solo menciona explícitamente "falta la cédula" como caso de rechazo; no se discutió qué pasa si falta el nombre, el apellido o el país. El archivo real trae un caso de cada uno (fila con `primer_apellido` vacío; fila casi en blanco sin `pais`). | **[Supuesto]** `codigo_empleado`, `primer_nombre`, `primer_apellido` y `pais` se tratan como críticos igual que documento/tipo_doc: son NOT NULL en el modelo o indispensables para resolver la identidad país/tipo/número (RF-02/RF-03). Sin ellos, la fila se **rechaza**. |
| **C-12** | Criticidad de la sede                | Ni RF-10 ni la reunión clasifican la sede como crítica; ALCANCE.md pide "marcar para revisión" `BAQ-01` y `Bogotá D.C.`, sin decir si eso rechaza la fila. | **[Supuesto]** La sede es **no crítica**: si falta, es ambigua o no existe en el catálogo, el empleado se **carga igual** (sin vínculo `EmployeeSite`) y la fila queda en `ADVERTENCIA` para que Talento Humano la revise. Coherente con "no se rechaza el archivo completo" (RF-10) por un dato no esencial para la identidad. |
| **C-13** | `tipo_doc` inválido para el país informado | El archivo trae filas con `tipo_doc='CC'` y `pais='Panamá'` — "CC" no existe en Panamá (RF-02), pero no es un campo *faltante*, es un valor presente e inconsistente. | **[Supuesto]** Se trata como si faltara el tipo de documento: la fila se **rechaza** con motivo explícito, porque no se puede resolver la identidad compuesta país/tipo/número (RF-03) con un tipo que no aplica a ese país. |

---

## 4. Preguntas que le habría hecho al cliente

> En la reunión quedaron cosas abiertas. Estas son las preguntas que enviaría por escrito. Donde no llegue respuesta a tiempo, **decido yo y documento** (como pidió el propio enunciado).

### Sobre datos e identidad

- **P-01.** Para los empleados con **dos documentos vigentes** (cédula colombiana + carné de residente panameño): ¿cuál es el documento "oficial" para el control de acceso, o deben registrarse ambos y reconocerse como la misma persona? _(Si no responden: registro ambos documentos ligados a una única identidad; el ingreso puede darse con cualquiera.)_
- **P-02.** ¿Existe algún **identificador interno de empleado** (código de nómina, ID de RRHH) que sea estable y único a nivel corporativo, independiente del país? Sería la clave natural para deduplicar y evitar depender del documento. _(Si no responden: genero un ID interno propio y trato el documento como atributo.)_
- **P-03.** Ante un **duplicado detectado** en la carga (misma persona, dos registros), ¿el sistema debe fusionarlos automáticamente, o marcarlos para revisión humana? _(Si no responden: los marco para revisión y cargo el más completo, sin perder el otro.)_
- **P-04.** La lista de **tipos de documento por país** que dieron, ¿es exhaustiva o pueden aparecer otros (ej. tarjeta de identidad de menores, otros permisos migratorios)? ¿Debe ser configurable sin tocar código?

### Sobre aforo

- **P-05.** Salidas no marcadas por la puerta de emergencia: **¿esa puerta (u otro punto de salida) tiene algún dispositivo que emita una señal de salida** —un sensor de apertura, una barrera, un conteo perimetral— aunque no identifique a la persona? Si existe, podría registrar una **salida de "persona no identificada"** que decremente el aforo sin atribuirlo a nadie, corrigiendo el conteo sin ensuciar la trazabilidad. _(Si no responden: mantengo el reinicio a medianoche como solución.)_
- **P-06.** ¿El reinicio de aforo a medianoche es aceptable para las sedes de **turnos nocturnos o 24/7** (vigilancia, centro de datos), o allí distorsiona el conteo? _(Si no responden: reinicio configurable por sede.)_
- **P-07.** Para el **cuarto técnico del piso 4** (máx. 8 personas): ¿se espera solo _reportar_ la ocupación, o también **bloquear el acceso** cuando se alcanza el límite? Lo segundo depende de capacidades de BioStar en las puertas. _(Fuera del MVP; lo dejo como requisito futuro.)_

### Sobre BioStar e integración

- **P-08.** ¿Cuál es la **fuente de verdad** cuando un dato difiere entre nuestro sistema y BioStar (ej. un empleado creado directamente en BioStar)? ¿Sincronización unidireccional (nosotros → BioStar) o bidireccional? _(Si no responden: unidireccional, nuestro sistema como maestro.)_
- **P-09.** ¿Los **eventos de ingreso/salida** los consultamos desde la API de BioStar (pull), o BioStar puede notificarnos (webhook/push)? Esto define cómo se alimenta el aforo en tiempo real. _(Si no responden: modelo pull por polling; documento la latencia.)_
- **P-10.** ¿Aproximadamente cuántos empleados y cuántos eventos diarios se manejan? Define si el aforo puede calcularse en vivo o requiere precálculo. _(Si no responden: asumo un volumen moderado y dejo el diseño escalable.)_

### Sobre alcance y proceso

- **P-11.** Confirmar que **contratistas y visitantes** están fuera de esta primera entrega (Fernando anticipó que los pedirán). ¿Hay fecha estimada para incorporarlos, para dimensionar bien la tabla de rol/permisos desde ahora?
- **P-12.** ¿Quiénes son los **usuarios del sistema** y qué puede hacer cada uno? (Seguridad física, TI, Talento Humano, gerencia, Alberto en Panamá). Hoy no hay requisito de roles de usuario ni autenticación explícito. _(Si no responden: MVP con un rol administrador único; dejo el modelo listo para roles.)_
- **P-13.** El **reporte mensual para el ministerio de Panamá**: ¿tiene un formato o plantilla oficial que debamos replicar, o basta con la exportación cruda que Alberto arma él mismo? _(Si no responden: exportación cruda filtrable.)_
- **P-14.** ¿Hay requisitos de **retención y protección de datos personales** (habeas data en Colombia, ley de protección de datos en Panamá) que apliquen a los registros de acceso? Relevante por tratarse de un banco. _(Si no responden: registro los accesos con retención conservadora y lo documento como riesgo a validar.)_

---

## 5. Nota de método

Este documento distingue deliberadamente entre lo que **el cliente dijo**, lo que **se contradijo** y lo que **yo asumí**. Las suposiciones marcadas **[Supuesto]** son decisiones tomadas ante vacíos reales de la reunión; todas son reversibles si el cliente responde distinto. Preguntar no resta: las preguntas de la sección 4 son, en sí mismas, parte del entregable.
