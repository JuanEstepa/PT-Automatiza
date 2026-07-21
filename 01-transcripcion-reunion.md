# Transcripción — Reunión de levantamiento inicial

**Proyecto:** Sistema de control de acceso a instalaciones — Banco Andino
**Fecha:** 14 de julio de 2026, 9:05 a.m.
**Duración:** 48 minutos
**Modalidad:** Virtual

**Asistentes:**
- Marcela Ríos — Gerente de Seguridad Física, Banco Andino
- Fernando Quintero — Coordinador de Infraestructura TI, Banco Andino
- Alberto Sáenz — Gerente de Operaciones, Banco Andino Panamá (se conecta desde Ciudad de Panamá)
- Yolanda Peña — Jefe de Talento Humano, Banco Andino (ingresa a los 18 minutos)
- [Proveedor] — Equipo de desarrollo

> *Transcripción automática. Puede contener errores de reconocimiento de voz.*

---

**[00:00:14] Marcela Ríos:** …confirmo que ya estamos grabando. Buenos días a todos, gracias por conectarse. Fernando, ¿Alberto ya ingresó?

**[00:00:22] Fernando Quintero:** Está ingresando. Reporta problemas con el audio.

**[00:00:31] Marcela Ríos:** Empecemos entonces y él se va sumando. El motivo de la reunión es que necesitamos reemplazar el esquema actual con el que controlamos el ingreso y la salida de las sedes. Hoy tenemos BioStar de Suprema administrando los lectores y los molinetes, y eso opera correctamente, no está en discusión. El punto es que BioStar es la herramienta del fabricante: cubre lo que cubre, pero nosotros requerimos una capa propia por encima.

**[00:01:15] Fernando Quintero:** El problema concreto es que hoy, si necesito información que no venga en los reportes estándar del producto, me toca exportar a Excel y consolidarla manualmente.

**[00:01:24] Marcela Ríos:** Y eso ocurre todas las semanas.

**[00:01:29] [Proveedor]:** ¿BioStar permanece entonces?

**[00:01:31] Marcela Ríos:** Sí. Los lectores biométricos son de ellos y eso no se toca. Lo que necesitamos es que nuestro aplicativo se comunique con BioStar. Que la información de nuestros empleados resida en nuestro sistema y que de alguna forma eso se sincronice con los dispositivos. Fernando, ¿tienes la documentación de la API?

**[00:01:52] Fernando Quintero:** Sí, es pública: `bs2api.biostar2.com`. Es REST, JSON, expone endpoints de usuarios, puertas, dispositivos y grupos de acceso. Ahí está todo documentado, ustedes la revisan.

**[00:02:10] [Proveedor]:** ¿Disponemos de un ambiente de BioStar para pruebas?

**[00:02:13] Fernando Quintero:** No. Levantar un BioStar de pruebas implica solicitar licencia y ese trámite toma tiempo. Por ahora trabajen contra la documentación.

**[00:02:24] Marcela Ríos:** Eso lo revisamos más adelante. En este momento la prioridad es nuestra capa.

**[00:02:33] [Proveedor]:** ¿Cuántas sedes son?

**[00:02:35] Marcela Ríos:** Veamos. En Colombia tenemos la torre principal en Bogotá, que ocupa varios pisos; el centro de datos, que también está en Bogotá pero en otra dirección; Medellín; y Cali. Y en Panamá… Alberto, ¿me escuchas?

**[00:02:51] Alberto Sáenz:** *(audio entrecortado)* …sí, ya los escucho. Disculpen. En Panamá tenemos la oficina de Ciudad de Panamá, que es la principal, y la de Chitré, en Herrera, que es de menor tamaño.

**[00:03:05] Marcela Ríos:** Entonces son seis sedes. No, cinco. Seis contando el centro de datos, aunque el centro de datos es un caso particular porque el flujo de personas es mínimo.

**[00:03:16] Fernando Quintero:** Mínimo pero existe. Y es precisamente donde más nos interesa saber quién ingresó.

**[00:03:20] Marcela Ríos:** Tienes razón. Seis.

**[00:03:28] [Proveedor]:** ¿Los empleados están asociados a una sede?

**[00:03:31] Marcela Ríos:** Sí, cada empleado tiene su sede asignada.

**[00:03:34] Fernando Quintero:** Parcialmente. El equipo de auditoría rota permanentemente entre sedes. Y el personal de mi área ingresa tanto al centro de datos como a la torre.

**[00:03:44] Marcela Ríos:** Pero esos son casos excepcionales.

**[00:03:46] Fernando Quintero:** Son alrededor de cuarenta personas, Marcela.

**[00:03:49] Marcela Ríos:** …correcto. Sí, hay personal que ingresa a varias sedes.

**[00:03:57] Alberto Sáenz:** Acá ocurre lo mismo. Hay personal que se desplaza entre Ciudad de Panamá y Chitré. De hecho, tenemos dos colaboradores que estaban en Bogotá y se trasladaron acá el año pasado.

**[00:04:09] [Proveedor]:** ¿Esos colaboradores quedaron registrados como empleados nuevos en el sistema?

**[00:04:12] Alberto Sáenz:** Es una buena pregunta. Entiendo que los crearon nuevamente. Habría que verificarlo.

**[00:04:19] Marcela Ríos:** Ese es uno de los problemas que arrastramos. He identificado registros duplicados.

---

**[00:05:30] Marcela Ríos:** …el otro tema es el aforo. Eso nos quedó de la pandemia. En su momento debíamos reportar la ocupación en tiempo real y, aunque ya no es una obligación normativa, la gerencia se acostumbró a esa información y ahora la solicita de forma permanente.

**[00:05:47] [Proveedor]:** ¿Aforo por sede?

**[00:05:49] Marcela Ríos:** Por sede, sí. Aunque en la torre nos resultaría más útil por piso. La torre tiene doce pisos y en el piso 4 hay una sala de servidores pequeña donde no pueden permanecer más de ocho personas simultáneamente.

**[00:06:05] Fernando Quintero:** Eso es un cuarto técnico, no un piso.

**[00:06:08] Marcela Ríos:** Un espacio, entonces. Un área. No sé cuál es el término correcto para ustedes.

**[00:06:14] [Proveedor]:** ¿A qué nivel se controla el aforo entonces?

**[00:06:17] Marcela Ríos:** Mi recomendación sería iniciar por sede y evaluarlo después. Pero déjenlo contemplado para que más adelante no implique rehacer todo.

**[00:06:29] Alberto Sáenz:** En Panamá la regulación local exige el reporte de ocupación de la oficina completa, no por piso.

**[00:06:38] Marcela Ríos:** Por eso insisto en que iniciemos con un alcance simple.

**[00:06:45] [Proveedor]:** ¿Y el aforo cómo se calcula? ¿A partir de las entradas y salidas?

**[00:06:49] Marcela Ríos:** En principio sí. Quien ingresó y no ha registrado salida, permanece adentro. Es la lógica natural, ¿no?

**[00:06:56] Fernando Quintero:** En teoría. En la práctica el personal sale por la puerta de emergencia y no marca. El sistema asume que siguen adentro.

**[00:07:06] Marcela Ríos:** Es una situación recurrente. Habría que definir cómo se maneja. El esquema anterior reiniciaba el conteo a medianoche.

**[00:07:15] [Proveedor]:** ¿Ese esquema les resulta suficiente?

**[00:07:17] Marcela Ríos:** Es lo que hemos tenido. Ustedes propongan la alternativa.

---

**[00:09:12] Fernando Quintero:** …está pendiente el tema de reportes. Marcela, coméntales el requerimiento de auditoría.

**[00:09:18] Marcela Ríos:** Periódicamente auditoría interna, y en ocasiones la Superintendencia, nos solicita información puntual: todos los ingresos al centro de datos del mes anterior, o quién ingresó un sábado específico. Hoy consolidar eso me toma dos días.

**[00:09:38] [Proveedor]:** ¿Qué tipo de reportes requieren?

**[00:09:41] Marcela Ríos:** Los de auditoría, que se filtran por rango de fechas y por sede. Y la gerencia solicita un tablero, algo visual, que muestre cuántas personas hay en cada sede en este momento.

**[00:09:56] Fernando Quintero:** Y requiero poder exportar. Todo lo que el sistema muestre debe poder descargarse.

**[00:10:02] Marcela Ríos:** En Excel. Acá toda la operación se maneja en Excel.

**[00:10:09] Alberto Sáenz:** Acá también necesitaríamos el reporte de ocupación mensual para el ministerio. Aunque eso lo puedo generar yo mismo si tengo acceso a los datos.

**[00:10:20] Marcela Ríos:** Con que la información sea exportable, buena parte de las necesidades quedan cubiertas.

---

**[00:11:40] [Proveedor]:** Retomando el tema de empleados. ¿Cómo los identifican?

**[00:11:44] Marcela Ríos:** Por la cédula. Todo el personal tiene cédula.

**[00:11:48] Alberto Sáenz:** Marcela, en Panamá las cédulas no tienen el mismo formato que en Colombia.

**[00:11:52] Marcela Ríos:** Es cierto, discúlpame.

**[00:11:55] Alberto Sáenz:** La cédula panameña es distinta. Su estructura es del tipo 8-123-456: provincia, tomo y asiento. Los extranjeros residentes tienen E-8-… y los naturalizados N-19-… Son formatos completamente diferentes.

**[00:12:14] [Proveedor]:** ¿Y en Colombia?

**[00:12:16] Marcela Ríos:** Cédula de ciudadanía, que es únicamente un número. Cédula de extranjería para los extranjeros. Y tenemos dos colaboradores venezolanos con PEP, el permiso especial de permanencia.

**[00:12:30] Fernando Quintero:** Y los expatriados que vienen de la casa matriz ingresan con pasaporte.

**[00:12:34] Marcela Ríos:** Correcto. Entonces no todos tienen cédula. Me corrijo.

**[00:12:41] [Proveedor]:** El tipo de documento depende del país, entonces.

**[00:12:44] Alberto Sáenz:** Exacto. Y es importante señalar que la lista de Colombia no aplica en Panamá. Acá "CC" no existe como tipo de documento.

**[00:12:56] Fernando Quintero:** Eso debe quedar resuelto desde el diseño, porque corregirlo después es costoso.

**[00:13:03] [Proveedor]:** ¿El número de documento es único?

**[00:13:06] Marcela Ríos:** Por supuesto. Una cédula corresponde a una sola persona.

**[00:13:11] Fernando Quintero:** En principio. Aunque nada impide que una cédula colombiana coincida en dígitos con un documento panameño. Yo no asumiría que el número por sí solo sea suficiente.

**[00:13:24] Marcela Ríos:** No tengo el criterio técnico. Ustedes definen cómo lo modelan.

**[00:13:29] Alberto Sáenz:** Hay un caso adicional. Los dos colaboradores que se trasladaron desde Bogotá conservan su cédula colombiana, pero acá tramitaron carné de residente. Tienen dos documentos vigentes.

**[00:13:44] Marcela Ríos:** Ese caso lo revisamos posteriormente.

---

**[00:18:02] Yolanda Peña:** Buenos días, disculpen la demora. Venía de otra reunión.

**[00:18:07] Marcela Ríos:** Tranquila, Yolanda. Justamente íbamos a tratar el tema de la información. Yolanda administra los datos del personal.

**[00:18:15] Yolanda Peña:** ¿Requieren el archivo?

**[00:18:17] Marcela Ríos:** Sí, el que me enviaste la semana pasada.

**[00:18:20] Yolanda Peña:** Se los comparto. Pero les advierto que su calidad es deficiente. Ese archivo lo hemos venido diligenciando entre varias personas desde hace aproximadamente tres años y cada quien aplica su propio criterio.

**[00:18:36] [Proveedor]:** ¿Deficiente en qué sentido?

**[00:18:38] Yolanda Peña:** Hay campos sin diligenciar. Las fechas están registradas en formatos distintos según quién las cargó. Sé que existen registros repetidos, porque cuando una persona se retira y luego reingresa, en ocasiones la crean nuevamente. Y algunos números de documento quedaron con puntos.

**[00:19:00] Fernando Quintero:** Y las sedes aparecen escritas de tres formas distintas.

**[00:19:03] Yolanda Peña:** Correcto. "Bogotá", "BOGOTA", "Bogotá D.C." Ese es el archivo real con el que operamos.

**[00:19:12] [Proveedor]:** ¿Y ese archivo es el que va a poblar el sistema?

**[00:19:15] Marcela Ríos:** Es la única fuente que tenemos. Sí.

**[00:19:19] Yolanda Peña:** Tengan en cuenta que hay columnas que probablemente ustedes no necesiten. Centro de costo, tipo de contrato: esos campos son de mi área, de nómina. Pero están en el archivo.

**[00:19:32] Marcela Ríos:** Consérvenlas por si acaso. Nunca se sabe.

**[00:19:36] Fernando Quintero:** No. No arrastren información que no aporta. Si no se usa, no va.

**[00:19:40] Marcela Ríos:** Ustedes definen.

**[00:19:48] [Proveedor]:** ¿Qué debería ocurrir si un registro viene con errores? ¿Se rechaza?

**[00:19:52] Yolanda Peña:** Preferiría que no. Si me rechazan medio archivo, no tengo capacidad de corregirlo con rapidez.

**[00:20:00] Marcela Ríos:** Tampoco podemos cargar información inconsistente a la base.

**[00:20:04] Yolanda Peña:** Es que hay errores y errores. Si a un registro le falta el teléfono, no es relevante. Si le falta la cédula, ahí sí es un problema serio.

**[00:20:15] Marcela Ríos:** Ese criterio tiene sentido.

**[00:20:18] [Proveedor]:** ¿Qué esperarían ver al momento de cargar el archivo?

**[00:20:22] Yolanda Peña:** Necesitaría saber qué registros ingresaron, cuáles no y por qué motivo. Para poder ir a corregir lo que esté mal.

**[00:20:31] Marcela Ríos:** Un resumen del resultado de la carga.

---

**[00:26:15] [Proveedor]:** Pasemos a la parte técnica. ¿Tienen alguna preferencia de arquitectura? ¿Alguna restricción de su lado?

**[00:26:24] Fernando Quintero:** No les vamos a indicar cómo construirlo. Para eso los contratamos.

**[00:26:31] Marcela Ríos:** Lo único que solicitaría es que no sea una solución que después nadie pueda mantener.

**[00:26:38] Fernando Quintero:** De acuerdo. Y que sea desplegable. Acá tenemos personal con conocimiento en Docker. No queremos volver a instalar componentes manualmente en un servidor como se hacía antes.

**[00:26:52] [Proveedor]:** ¿Nube o servidor propio?

**[00:26:55] Fernando Quintero:** Estamos en transición. Hoy operamos con servidores propios, pero existe un plan de migración a nube que lleva dos años en formulación. Mi recomendación es que lo dejen preparado para operar en cualquiera de los dos escenarios.

**[00:27:14] Marcela Ríos:** En el comité alguien planteó el tema de microservicios. Que si esto no debería construirse bajo ese enfoque.

**[00:27:22] Fernando Quintero:** Marcela, ese planteamiento aparece en todos los proyectos.

**[00:27:25] Marcela Ríos:** Entiendo. Pero me lo van a preguntar y necesito tener una respuesta sustentada.

**[00:27:33] Fernando Quintero:** Que ellos nos indiquen qué recomiendan y por qué. Y también qué descartaron, porque eso es lo que uno nunca conoce. Uno siempre recibe la propuesta pero no sabe qué otras opciones se evaluaron.

**[00:27:48] Marcela Ríos:** Eso me sirve. Con un documento que yo pueda llevar al comité y sustentar la decisión, tenemos el tema resuelto.

**[00:27:57] [Proveedor]:** ¿Base de datos?

**[00:27:59] Fernando Quintero:** PostgreSQL. Ese punto no es negociable, es el estándar de la organización. Todo lo nuevo va en Postgres.

**[00:28:08] [Proveedor]:** ¿Y el frontend?

**[00:28:10] Fernando Quintero:** El equipo interno maneja React. Si eventualmente ustedes salen del proyecto, necesito que mi personal pueda darle continuidad. Entonces React.

**[00:28:20] [Proveedor]:** ¿Y el backend?

**[00:28:22] Fernando Quintero:** El backend es indiferente para nosotros, siempre que sea una tecnología seria y esté bien argumentada. Ahí ustedes deciden. Pero me lo justifican.

**[00:28:33] Marcela Ríos:** Y el despliegue automático, ¿es viable? Porque hoy cada cambio implica solicitar ventana, notificar, coordinar.

**[00:28:44] Fernando Quintero:** Sí, ese es un objetivo. Que exista un mecanismo mediante el cual, cuando el desarrollador sube código, eso se pruebe y se despliegue de forma automática. Nosotros trabajamos sobre GitHub, así que con GitHub Actions debería ser viable.

**[00:29:00] [Proveedor]:** ¿Tienen pipelines actualmente?

**[00:29:02] Fernando Quintero:** Tenemos un Jenkins heredado, sin documentación y sin responsable asignado. Preferiría partir de cero con Actions.

---

**[00:34:20] Marcela Ríos:** ¿Qué más quedó pendiente? El tema de contratistas.

**[00:34:25] [Proveedor]:** ¿Contratistas?

**[00:34:27] Marcela Ríos:** Sí. Tenemos personal de aseo, vigilancia y mantenimiento que no son empleados nuestros pero ingresan diariamente. Y visitantes también, aunque visitantes es un caso aparte porque los administra recepción con una planilla.

**[00:34:44] [Proveedor]:** ¿Están dentro del alcance?

**[00:34:46] Marcela Ríos:** Por ahora no. Iniciemos con empleados. Aunque es probable que posteriormente nos soliciten incorporarlos.

**[00:34:55] Fernando Quintero:** "Probable" es una estimación optimista. Nos lo van a solicitar.

**[00:34:59] Marcela Ríos:** Sí. Nos lo van a solicitar.

---

**[00:41:03] Marcela Ríos:** ¿Algún otro tema? ¿Preguntas?

**[00:41:07] [Proveedor]:** Tengo varias, pero prefiero remitirlas por escrito una vez revise el material con detalle.

**[00:41:12] Marcela Ríos:** Perfecto, envíelas y les respondo. Aunque le anticipo que a varias no voy a tener la respuesta.

**[00:41:21] Fernando Quintero:** Es lo habitual. Si algo no está definido, ustedes proponen y nosotros validamos.

**[00:41:28] Marcela Ríos:** Lo relevante es ver algo funcionando. Prefiero ver un alcance reducido que opere y se pueda mostrar, a recibir un documento de cien páginas.

**[00:41:40] Fernando Quintero:** Y que nos expliquen el porqué de las decisiones.

**[00:41:44] Marcela Ríos:** Exacto. Muchas gracias a todos. Yolanda nos comparte el archivo hoy mismo.

**[00:41:52] Yolanda Peña:** Listo, lo envío ahora.

**[00:41:55] Alberto Sáenz:** Gracias, buenos días.

**[00:41:58] Marcela Ríos:** Hasta luego.

*[Fin de la grabación — 00:42:03]*
