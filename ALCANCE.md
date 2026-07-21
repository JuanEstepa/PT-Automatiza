# Documento de Alcance — Sistema de control de acceso Banco Andino

> Fuente de verdad: `01-transcripcion-reunion.md` (reunión de levantamiento del 14/07/2026).
> Este documento define **qué construyo, qué dejo por fuera y por qué**. La prueba está diseñada para no terminarse: la decisión pesa más que la cobertura.

---

## 1. MVP

El MVP es una **capa propia sobre BioStar** que resuelve el dolor concreto y repetitivo que describió el cliente: hoy, cuando necesitan un dato que no viene en los reportes estándar, exportan a Excel y consolidan a mano, "todas las semanas", y una consulta de auditoría toma "dos días". El MVP ataca ese flujo de punta a punta con un corte vertical delgado pero funcional.

Incluye:

**a) Modelo de datos con identidad de empleado resuelta desde el diseño.**
Es la pieza que Fernando marcó como innegociable: *"eso debe quedar resuelto desde el diseño, porque corregirlo después es costoso."* El modelo contempla:

- **Tipo de documento dependiente del país.** La lista de Colombia (CC, CE, PEP, pasaporte) no aplica en Panamá (cédula tipo `8-123-456`, extranjeros `E-8-…`, naturalizados `N-19-…`). "CC" no existe en Panamá.
- **Identidad no basada solo en el número.** Una cédula colombiana puede coincidir en dígitos con un documento panameño. La unicidad se modela por `(país/tipo, número)`, no por número suelto.
- **Empleado ↔ sede como relación muchos-a-muchos.** No es un campo simple: ~40 personas (auditoría, infraestructura) rotan entre sedes, y en Panamá hay personal que se desplaza entre Ciudad de Panamá y Chitré.
- **Las 6 sedes** modeladas como catálogo: Torre Bogotá, Centro de Datos Bogotá, Medellín, Cali, Ciudad de Panamá y Chitré.

**b) Ingesta del archivo de Talento Humano con normalización y reporte de carga.**
La base **debe quedar poblada** con el único archivo que existe, y ese archivo es de mala calidad (declarado por Yolanda). El MVP:

- Normaliza sedes escritas de tres formas ("Bogotá", "BOGOTA", "Bogotá D.C.") a un catálogo único.
- Normaliza fechas en formatos mixtos y limpia números de documento con puntos.
- Detecta y consolida duplicados (personas recreadas al reingresar).
- Aplica una **política de errores graduada**, tal como pidió Yolanda: falta el teléfono → se carga igual; falta la cédula → se rechaza ese registro. No se rechaza el archivo completo.
- Devuelve un **resumen de carga**: qué registros entraron, cuáles no y por qué motivo, para que Talento Humano pueda ir a corregir.

**c) Reportes de auditoría exportables + tablero de aforo por sede.**

- Reporte de auditoría filtrable **por rango de fechas y por sede** (el caso "todos los ingresos al centro de datos del mes anterior" o "quién ingresó tal sábado").
- **Todo exportable a Excel/CSV** — "acá toda la operación se maneja en Excel".
- **Tablero visual** que muestra cuántas personas hay en cada sede en este momento (lo que pide la gerencia). Aforo calculado por sede a partir de entradas/salidas, con **reinicio de conteo a medianoche** (el esquema que ya conocen).

**d) Integración con BioStar simulada.**
No hay ambiente de BioStar ni licencia disponible; se trabaja contra la documentación (`bs2api.biostar2.com`). El MVP modela e implementa la sincronización contra un **mock** de la API REST (endpoints de usuarios/puertas/dispositivos/grupos), y siembra eventos de acceso simulados para que el aforo y los reportes tengan datos reales que mostrar.

**e) Base técnica desplegable.**
PostgreSQL + React + backend justificado, con al menos la base de datos en Docker (idealmente `docker-compose` que levante todo). Cumple el mínimo aceptable ("algo funcional, así sea local").

---

## 2. Por qué es el MVP — criterio de decisión

Para decidir qué entra y qué no, cada candidato pasó por **cuatro preguntas**. Basta con que falle una de las tres primeras, o que la cuarta no se cumpla, para aplazarlo:

1. **¿El cliente lo pidió de forma explícita y con un dolor de negocio concreto?** No basta con que "sería bueno tenerlo"; tiene que haber un dolor declarado detrás.
2. **¿Es una restricción no negociable?** (tecnología impuesta, o decisión de diseño que es cara de corregir después). Si lo es, entra aunque sea "invisible".
3. **¿Se puede resolver con una decisión razonable y documentada, o requiere una respuesta del cliente que no llegó?** Lo primero entra con su suposición escrita; lo segundo se aplaza.
4. **¿El tiempo disponible alcanza para hacerlo bien?** Si solo alcanza para dejarlo a medias, no entra: *poco y bien* le gana a *mucho y roto*.

Aplicando ese filtro, entraron al MVP:

**a) El modelo de datos (identidad por país, muchos-a-muchos empleado–sede, unicidad compuesta).**
Pasa por la pregunta 2: es una restricción no negociable de diseño. Fernando fue explícito en que *"debe quedar resuelto desde el diseño, porque corregirlo después es costoso."* Una decisión de modelado equivocada contamina todo lo que se construya encima, así que es la fundación aunque no sea visible en pantalla.

**b) Ingesta del Excel + reportes/exportación de auditoría.**
Pasa por la pregunta 1 con el dolor más fuerte de la reunión: consolidar a mano en Excel "todas las semanas" y tardar "dos días" en una consulta de auditoría. El corte que elimina ese dolor —**cargar el archivo real → datos limpios y consultables → exportar sin trabajo manual**— es exactamente lo que Marcela resumió: *"con que la información sea exportable, buena parte de las necesidades quedan cubiertas."*

**c) Tablero de aforo por sede.**
Pasa por la pregunta 1 (la gerencia lo solicita "de forma permanente") y por la 3: aunque el nivel de granularidad tenía discusión abierta (sede vs. piso vs. área; Panamá exige oficina completa), **se resuelve con una decisión razonable y documentada**. Sigo la recomendación de la propia gerente de seguridad: *"iniciar por sede y evaluarlo después… pero déjenlo contemplado para que no implique rehacer todo."* Aforo **por sede**, con el modelo preparado para granularidad por área sin construirla.

**Lo que se aplazó por el filtro:**

- **Contratistas y visitantes** fallan la pregunta 1 en su versión actual: el propio cliente los sacó del alcance ("por ahora no, iniciemos con empleados"). Aunque Fernando advirtió que los van a pedir, respeto la decisión y lo dejo como primer candidato a la siguiente iteración.
- **Aforo por piso/área y sincronización real con BioStar** fallan la pregunta 4: no hay tiempo (ni ambiente de BioStar) para hacerlos bien; se simulan o se difieren.
- **El manejo definitivo de las salidas no marcadas** falla la pregunta 3: requiere una respuesta del cliente que no llegó (ver `REQUISITOS.md`), así que el MVP hereda el paliativo que ya conocen —reinicio de conteo a medianoche— y la decisión de fondo se aplaza.

**Regla que resume todo:** prefiero un corte vertical delgado que funcione de la carga del Excel hasta el reporte exportable, antes que muchas features a medio terminar. Un entregable pequeño y sustentado vale más que uno grande y roto.

---

## 3. Qué quedó por fuera y cómo lo haría con más tiempo

Lo siguiente **se dejó fuera del MVP de forma consciente**, no por olvido. Cada punto incluye cómo lo abordaría con más tiempo.

**Contratistas y visitantes.**
Personal de aseo, vigilancia y mantenimiento que ingresa a diario, más visitantes que hoy administra recepción con una planilla. Fuera por decisión del cliente. *Con más tiempo:* introduciría un modelo de "persona con acceso" que generalice a empleado/contratista/visitante, con vigencias y responsable de la visita, reutilizando el mismo motor de aforo y reportes. Aquí encaja además una **tabla de rol/tipo de persona** que, más allá de distinguir empleado de contratista, siente la base para un futuro esquema de **permisos de acceso** (qué rol puede entrar a qué sede o área, en qué horarios). No lo construyo ahora, pero dejo el modelo planteado para que incorporarlo después sea agregar, no rediseñar.

**Aforo por piso / área (y cuarto técnico del piso 4).**
La torre tiene 12 pisos y una sala de servidores donde no pueden estar más de 8 personas a la vez; Panamá exige reporte por oficina completa. Fuera del MVP por recomendación del propio cliente. *Con más tiempo:* añadiría una jerarquía sede → área con capacidad máxima y alertas de sobreaforo, mapeando cada puerta/lector a un área.

**Sincronización real y bidireccional con BioStar.**
El MVP simula la API. *Con más tiempo (y con licencia/ambiente):* implementaría el cliente REST real contra `bs2api.biostar2.com`, con sincronización de altas/bajas de empleados y grupos de acceso hacia los dispositivos, manejo de reintentos y reconciliación.

**Manejo robusto del problema de salidas no marcadas.**
Hoy quien sale por la puerta de emergencia no marca y el sistema lo asume adentro; el MVP hereda el reinicio a medianoche como paliativo. *Con más tiempo:* primero **le preguntaría al cliente si esa puerta (u otro punto) tiene algún dispositivo que emita una señal de salida** —un sensor de apertura, un conteo perimetral, una barrera— aunque no identifique a la persona. Si existe, podría registrar un evento de **salida de "persona no identificada"** que decremente el aforo sin atribuirlo a nadie, corrigiendo el conteo sin ensuciar la trazabilidad individual. Como complemento, propondría reglas de cierre de sesión (auto-salida por inactividad, tope de jornada) y un reporte de "presencias inconsistentes" para depurar el aforo.

**Despliegue automático completo (CI/CD) y nube.**
GitHub Actions y despliegue en free tier son deseables, no mínimos. *Con más tiempo:* pipeline de test + build + deploy automático en cada push, dejando el artefacto preparado para on-premise o nube (el cliente está en transición y pidió ambos escenarios contemplados).

**Deduplicación avanzada y gobierno de datos.**
El MVP consolida duplicados por clave de identidad; no resuelve casos difusos (misma persona, documentos distintos por traslado Colombia→Panamá con dos documentos vigentes). *Con más tiempo:* motor de *matching* con revisión humana y un histórico de fusiones auditable.

**Campos de nómina (centro de costo, tipo de contrato).**
Hubo contradicción: Marcela quería conservarlos "por si acaso", Fernando dijo "si no se usa, no va". Sigo a Fernando por principio de mínimo dato necesario para el propósito de control de acceso; los omito del modelo núcleo. *Con más tiempo:* los expondría como metadatos opcionales solo si aparece un caso de uso real.

**Decisión sobre microservicios y sustentación de arquitectura.**
Queda para `ARQUITECTURA.md`, no para el alcance funcional. *Adelanto de la decisión:* un **monolito modular**, no microservicios. Las razones que sustento ante el comité: (1) reduce el tiempo de configuración e infraestructura, que en microservicios se va en orquestación, redes y observabilidad en lugar de en resolver el problema del cliente; (2) los microservicios no aportan nada al alcance actual —no hay escala, equipos ni dominios que lo justifiquen—; y (3) si en el futuro se necesita extraer un módulo a servicio independiente (por ejemplo la sincronización con BioStar), al estar el monolito bien modularizado eso es un **refactor localizado, no un rediseño**. Con las alternativas descartadas documentadas para que Marcela lo sustente en comité.

---

## 4. Lo que no se alcanzó a hacer

> Completado al final del desarrollo. El MVP descrito en la sección 1 (a-e) quedó implementado y validado de punta a punta: ingesta del Excel real, aforo por sede sobre eventos simulados, reportes exportables y las 4 pantallas del frontend, todo corriendo con `docker compose up`. Lo que sigue es lo que, con más tiempo, habría hecho distinto o hecho falta.

**Cobertura de tests limitada a la ingesta.** Se pidió explícitamente cubrir "la parte con más reglas" (ingestión y normalización) y esa parte tiene 30 tests unitarios que corren en CI. Los módulos `occupancy`, `reports` y `biostar` **no tienen tests automatizados**: se validaron manualmente contra una base Postgres real durante el desarrollo (ver historial de commits), pero no hay una suite de integración que los proteja de regresiones. El job de backend en `ci.yml` levanta un servicio de Postgres que, con el estado actual de los tests (puramente unitarios, sin tocar la base), queda sin usar — es config para una integración que no llegué a escribir.

**Sin tests de frontend.** Las 4 pantallas se probaron a mano en el navegador contra el backend real (incluida la carga del Excel, la exportación y el aforo en vivo), pero no hay suite automatizada (Vitest/Testing Library) que las cubra.

**Exportación a Excel/CSV solo en la pantalla de Reportes.** RF-17 ("todo lo que se muestre debe poder exportarse") lo interpreté acotado a la auditoría de accesos, que es el caso de uso que motivó el requisito ("acá toda la operación se maneja en Excel", ver `01-transcripcion-reunion.md`). Los listados de Empleados y el tablero de Aforo no tienen botón de exportar propio. Si el alcance real de RF-17 era "cualquier pantalla", es un pendiente barato de agregar (mismo patrón de `reports.service.ts`).

**Sin paginación.** Los listados de empleados (~150 filas) y el reporte de auditoría (~1000 eventos con 7 días de simulación) se traen completos en una sola respuesta. Funciona bien al tamaño de datos actual; con un volumen real de banco (miles de empleados, meses de histórico de accesos) necesitaría paginación o carga incremental antes de ir a producción.

**Sin autenticación.** Tal como quedó asumido en `REQUISITOS.md` (P-12, sin respuesta del cliente): el MVP no tiene login ni control de acceso a la aplicación misma — cualquiera con la URL puede ver y exportar todo. Aceptable para la sustentación, no para producción.

**Aforo con reinicio a medianoche sin ajuste por zona horaria por sede.** El corte "medianoche" (`occupancy.service.ts`) usa la hora del servidor, no la zona horaria de cada sede (Colombia y Panamá comparten UTC-5 hoy, así que en la práctica no distorsiona nada, pero el código no lo hace explícito ni lo generalizaría bien si el banco abriera una sede en otro huso horario).

**Todo lo demás declarado fuera de alcance en la sección 3** (contratistas/visitantes, aforo por área, sincronización real con BioStar, deduplicación avanzada, campos de nómina) sigue fuera, tal como se decidió ahí — el modelo de datos los deja preparados (ver `schema.prisma`, entidades comentadas) sin construirlos.
