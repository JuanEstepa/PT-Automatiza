# Conversación con IA — Cowork (Claude): definición de alcance, requisitos, arquitectura y ERD

> Sesión "Prueba técnica scope". Herramienta: Claude (Cowork, desktop).
> Uso: analizar la transcripción de la reunión, definir el MVP y producir los cuatro
> documentos de criterio (ALCANCE, REQUISITOS, ARQUITECTURA, MODELO-DATOS) y el
> scaffolding inicial del repo. Transcripción de los turnos de la conversación.

---

### 👤 Usuario

En la carpeta de automatiza hay tres items. Estos son una prueba técnica que debo realizar. El objetivo principal es entender a la perfección lo que requiere la prueba técnica.

Lee el archivo 01-transcripcion. Con base a esta fuente de verdad ayúdame a hacer el alcance. Quiero las siguientes secciones:

1. MVP
2. Por qué es el MVP (criterio para decidir qué entra y qué no)
3. Qué se quedó por fuera y cómo se realizaría con más tiempo
4. Deja una sección, por el momento vacía, donde irá lo que no se alcanzó a hacer

### 🤖 Claude

Leyó la transcripción (`01-transcripcion-reunion.md`) y el enunciado (`02-prueba-tecnica-enunciado.md`) como marco de evaluación, y redactó `ALCANCE.md` con las cuatro secciones pedidas, desde la voz del candidato.

Resumen del razonamiento: el MVP es un **corte vertical delgado** (cargar el Excel real → datos limpios y consultables → reportes/aforo exportables) montado sobre un **modelo de datos que resuelve la identidad del empleado desde el diseño**, porque el propio cliente marcó que corregirlo después es caro (Fernando: "debe quedar resuelto desde el diseño"; Marcela: "lo relevante es ver algo funcionando").

Dos apuntes señalados: (1) en la sección 3 tomó una decisión sobre una contradicción del cliente — Marcela quería conservar los campos de nómina "por si acaso" y Fernando dijo "si no se usa, no va"; se inclinó por Fernando. (2) La sección 4 quedó vacía a propósito, como marcador para llenar al cerrar el desarrollo.

---

### 👤 Usuario

Realiza los requisitos, pero antes quiero que tengas en cuenta los cambios que quiero realizar en el alcance:

Para el criterio de decisión quiero combinar lo que quedó con:

1. ¿El cliente lo pidió de forma explícita y con un dolor de negocio concreto?
2. ¿Es una restricción no negociable?
3. ¿Se puede resolver con una decisión razonable y documentada, o requiere una respuesta del cliente que no llegó? La segunda se aplaza.
4. ¿El tiempo disponible alcanza para hacerlo bien?

Para lo que quedó fuera:
- En contratistas y visitantes, agregar una **tabla de rol** que permita a futuro el tema de permisos de acceso, pero plantearlo mejor.
- En las salidas no marcadas por la puerta de emergencia, preguntar si no existe otro dispositivo que dé señal de una salida (un sensor o similar) que permita reducir el aforo con algo como "persona no identificada".
- En la decisión de microservicios, sustentar que es mejor un **monolito** porque reduce el tiempo de configuración, no aporta al alcance actual, y si a futuro se necesita extraer un módulo a servicio es un refactor localizado, no un rediseño.

Teniendo en cuenta estas decisiones, realiza ahora los requisitos.

### 🤖 Claude

Actualizó `ALCANCE.md` con las 4 preguntas como filtro de decisión y con las tres precisiones (tabla de rol/permisos, sensor de salida "persona no identificada", sustentación del monolito). Luego creó `REQUISITOS.md` en cinco bloques: requisitos funcionales (marcados MVP / Fuera del MVP), requisitos técnicos, tabla de **contradicciones y vacíos** (C-01…) con lo asumido en cada caso, y **14 preguntas al cliente** (P-01…P-14), cada una con su "si no responden, decido esto". La P-05 recoge la idea del sensor de salida.

Apuntes: incluyó un par de preguntas que no salieron literal de la reunión pero que un banco esperaría (P-14 habeas data / protección de datos, P-12 roles de usuario y autenticación), ofreciendo quitarlas si se prefiere ceñirse a la transcripción; y vinculó cada contradicción con las decisiones del alcance para contar una sola historia coherente.

---

### 👤 Usuario

Sigamos con la ARQ, me pareció correcto los requisitos.

### 🤖 Claude

Antes de escribir la arquitectura planteó la única decisión pendiente que el candidato debe defender en vivo: el **backend** (el resto ya estaba fijo: monolito modular, Postgres, React, GitHub Actions). Tras confirmar **NestJS**, escribió `ARQUITECTURA.md`:

- Resumen de decisiones (marcando impuesto vs. elección justificada).
- Sustentación del **monolito modular**.
- Sección de **arquitecturas descartadas** (microservicios, monolito no modular, serverless, Next.js full-stack), cada una con su porqué.
- Justificación del **backend NestJS** con alternativas descartadas (FastAPI, Spring Boot, Go).
- **Diagrama de componentes en Mermaid** con los seis módulos de dominio.
- Integración BioStar modelada como **adaptador (puerto/adaptador)**, la frontera por donde un módulo se puede extraer a servicio sin rediseño.

Razón de fondo para NestJS: el equipo de Fernando ya maneja React, así que TypeScript en todo el stack reduce la carga de mantenimiento (RNF-06) y NestJS es modular por diseño, justo lo que pide el monolito modular.

---

### 👤 Usuario

Sigamos con el ERD.

### 🤖 Claude

Antes de diseñar, inspeccionó las columnas reales del Excel de Talento Humano y sus problemas de calidad. Hallazgos usados en el modelo: `codigo_empleado` es único (clave natural para deduplicar, responde P-02); existe una **sede fantasma `BAQ-01`** (Barranquilla) que no está en el catálogo de 6; documentos en notación científica (`1.02E+09`); duplicados por número (incluido el `8-123-456` de ejemplo); y `país`/`estado`/`tipo_doc` con múltiples variantes.

Escribió `MODELO-DATOS.md`: ERD en Mermaid con el núcleo MVP y, aparte, las entidades futuras (`AREA`, `PERSON_ROLE`, `ACCESS_PERMISSION`) marcadas como "listas para agregar, no rediseñar". Sección 3: mapeo Excel→modelo campo por campo (conservar / transformar / eliminar), con `centro_costo` y `tipo_contrato` eliminados (RF-12). Sección 4: hallazgos de calidad con conteos reales, incluyendo la sede fantasma y la discrepancia de que el archivo usa `CIP` para cédula panameña y **no aparece `PEP`** pese a mencionarse en la reunión (señalado para validar con el cliente).

Punto abierto: dejó `area` y `cargo` como atributos del empleado (bajo costo y útiles), ofreciendo quitar `cargo` si se quiere ser estricto con "solo lo que aporta al control de acceso".

---

### 👤 Usuario

Sigamos con el scaffolding del repo, seguido a esto dime en texto un prompt que contenga el resumen de esta conversación y que le dé instrucciones claras y precisas a Claude Code para que desarrolle el aplicativo web.

### 🤖 Claude

Creó el scaffolding dentro de `Automatiza/`: `backend/` (NestJS + Prisma, 6 módulos: employees, sites, ingestion, occupancy, reports, biostar), `frontend/` (React + Vite), `docker-compose.yml` (Postgres + backend + frontend), CI en `.github/workflows/ci.yml`, carpeta `IA/` y los 4 documentos de criterio en la raíz. El `schema.prisma` refleja el ERD (incluida la unicidad compuesta que resuelve C-04) y `scripts/ingest.ts` trae los diccionarios de normalización derivados de los datos reales. Inicializó git y primer commit.

Luego entregó el **prompt para Claude Code** (resumido): contexto de la prueba, stack fijo, arquitectura monolito modular, MVP a implementar en orden (ingesta del Excel con normalización y política de errores graduada → occupancy/aforo → reports con exportación → frontend), lo que queda fuera (solo dejar el modelo preparado), y reglas de trabajo (commits pequeños, código explicable en sustentación, tests de normalización/ingesta, README que levante todo, documentar suposiciones nuevas, actualizar "lo que no se alcanzó" en ALCANCE al final). El prompt completo se usó como instrucción de arranque para el desarrollo en Claude Code (ver `IA/02-claudecode-desarrollo.md`).

---

### 👤 Usuario

Para cumplir con el tema de CI/CD a futuro, ¿es mejor tener uno (toda la prueba) o dos repositorios (back y front)?

### 🤖 Claude

Recomendó **un solo repositorio (monorepo)**, coherente con el monolito modular y el `docker-compose` que levanta todo. Aclaró que un repo no implica un pipeline monolítico: con GitHub Actions se logra CI/CD independiente por parte usando `paths:` filters (el `ci.yml` ya está separado en jobs backend y frontend). Argumentos: un cambio que cruza front y back va en un solo PR atómico; tipos compartidos front–back (una de las razones de elegir NestJS); mantenibilidad (RNF-06); sustentación más limpia (un enlace, un README, una historia de commits); y portabilidad futura (RNF-07) sin atarse — si algún día se extrae el módulo `biostar`, se saca a su repo entonces. Dos repos solo tendrían sentido con equipos grandes y ciclos de release desacoplados, que hoy no aplica.
