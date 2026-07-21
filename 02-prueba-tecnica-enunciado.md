# Prueba Técnica — Desarrollador Full Stack

**Cliente:** Banco Andino
**Sustentación:** 25 minutos de presentación + 5 de preguntas

---

## Lo primero, y lo más importante

**Esta prueba no se puede terminar por completo. Está diseñada así a propósito.**

No queremos ver cuánto alcanzas a hacer. Queremos ver **qué decides hacer, qué decides dejar por fuera, y si puedes defender esas decisiones.**

Definir tu propio MVP es el primer ejercicio de esta prueba, y pesa más que el código. Un entregable pequeño, bien hecho y bien sustentado vale **mucho más** que un entregable grande a medio terminar. Si intentas abarcarlo todo, vas a entregar algo roto y eso puntúa peor que entregar poco.

Léelo otra vez: **preferimos poco y bien, con criterio, que mucho y mal.**

---

## El contexto

Tienes dos materiales:

| Archivo | Qué es |
|---|---|
| `01-transcripcion-reunion.md` | Transcripción de la reunión de levantamiento con el cliente |
| `03-empleados-banco-andino.xlsx` | El archivo que envió Talento Humano del banco |

Documentación oficial de BioStar 2: **https://bs2api.biostar2.com/**

**No hay un documento de requisitos.** Lo que hay es la reunión. Como en la vida real.

La transcripción es desordenada, tiene ideas sueltas, gente que se contradice y temas que quedan abiertos. Extraer de ahí qué hay que construir es parte del ejercicio.

**No hay un ambiente de BioStar disponible.** La integración se simula.

---

## Restricciones técnicas

Estas vienen del cliente y **no son negociables**:

| Componente | Definición |
|---|---|
| Base de datos | **PostgreSQL** |
| Frontend | **React** |
| CI/CD | **GitHub Actions** |
| Backend | **Libre — tú eliges y justificas** |

El backend es libre a propósito. Queremos ver cómo eliges una tecnología y cómo esa elección se relaciona con la arquitectura que propones.

---

## Sobre el uso de IA

**El uso de IA no es obligatorio, pero es deseable.** Claude, Copilot, ChatGPT, Gemini, lo que uses normalmente.

**Si la usas, es obligatorio compartir tus conversaciones con la IA.** Exporta los chats, o pega los enlaces si la herramienta lo permite. No es opcional: es un entregable.

No nos interesa "atraparte" usando IA. Nos interesa **cómo la usas**: qué le preguntas, cuándo le crees, cuándo la corriges, dónde te dimos algo que ella no podía resolver sola.

La única regla: **tienes que entender todo lo que entregues.** En la sustentación te vamos a pedir que expliques tu código. Lo que no puedas explicar, cuenta como no entregado.

---

## Entregables

Todo en un repositorio Git público (GitHub).

### 1. Documento de alcance — `ALCANCE.md`

- **Qué definiste como MVP y por qué.** Cuál fue tu criterio para decidir qué entra y qué no.
- **Qué dejaste por fuera** y cómo lo harías con más tiempo.
- Sé honesto con lo que no alcanzaste. La honestidad acá suma.

### 2. Lista de requisitos — `REQUISITOS.md`

- Los requisitos que **tú** extrajiste de la transcripción.
- **Las preguntas que le habrías hecho al cliente.** Esto lo miramos con lupa. En la reunión quedaron cosas sin resolver, contradicciones y vacíos. Queremos ver cuáles detectaste.
- Dónde el cliente se contradijo o no supo qué quería, y qué asumiste tú en consecuencia.

> Toda suposición que hagas, escríbela. Un requisito asumido y documentado es trabajo profesional. Un requisito asumido en silencio es un riesgo.

### 3. Plan de arquitectura — `ARQUITECTURA.md`

- **Qué arquitectura elegiste y por qué.**
- **Qué arquitecturas descartaste y por qué.** Esta parte es tan importante como la anterior. El cliente quiere poder sustentar la decisión ante un comité.
- **Por qué elegiste esa tecnología de backend**, y cómo se relaciona con la arquitectura.
- Diagrama de componentes.

### 4. Modelo de datos — diagrama entidad-relación

- El ERD de tu base de datos.
- Herramienta libre (dbdiagram.io, Mermaid, draw.io, lo que sea). Que se pueda leer.
- Si agregaste, quitaste o transformaste campos respecto al Excel, que se note y lo puedas explicar.

### 5. El código

- Backend + frontend en React + PostgreSQL.
- La base de datos **debe quedar poblada** con la información del archivo de Talento Humano.
- Deseable: `docker-compose` que levante todo.
- Deseable: workflow de GitHub Actions.
- Deseable: desplegado en algún lado (free tier sirve: Render, Railway, Fly.io, lo que sea).

> **Mínimo aceptable:** algo funcional, así sea solo local. Si es local, lo ideal es que al menos uno de los componentes esté en Docker — la base de datos es el candidato natural.

### 6. Conversaciones con IA — `IA/`

Si usaste IA, los chats, exportados o enlazados.

### 7. `README.md`

Cómo levantar el proyecto. Que funcione siguiendo los pasos, sin preguntarte nada.

---

## Sobre el archivo de Talento Humano

Léelo con calma. Yolanda ya te advirtió en la reunión cómo está.

Ese archivo es la única fuente de datos que hay, y la base tiene que quedar poblada con él. Lo que hagas con los registros problemáticos, y cómo lo justifiques, es tuyo.

Presta atención a lo que se dijo en la reunión sobre qué tan grave es cada tipo de problema. No todos pesan igual.

---

## Los commits importan

Preferimos ver el proceso real —commits pequeños, incluso los que se devuelven— que un único commit gigante al final. Los commits cuentan la historia de cómo trabajas.

---

## La sustentación

**25 minutos de presentación + 5 de preguntas.** Es en vivo.

Prepárate para cubrir:

1. Qué entendiste que había que hacer.
2. Qué requisitos sacaste y qué le habrías preguntado al cliente.
3. Qué arquitectura elegiste, qué descartaste y por qué.
4. Por qué esas tecnologías.
5. Cómo lo implementaste, explicado sobre tu ERD.
6. Qué hiciste con los datos con errores y por qué.
7. Qué definiste como MVP y qué dejaste por fuera.
8. Cómo usaste la IA y dónde te falló.

Después vienen 5 minutos de preguntas abiertas.

**Vamos a pedirte que expliques código concreto.** No es un examen sorpresa: si entendiste lo que hiciste, va a ser una conversación tranquila.

---

## Entrega

- **Repositorio Git público**, y nos envías el enlace.
- Confirma la entrega por correo a **avargas@automatiza.co**, con copia a **jmora@automatiza.co**, **jsalamanca@automatiza.co** y **acortes@automatiza.co**

---

## Preguntas

Si algo no está claro, escríbenos. **Preguntar no resta puntos** — de hecho, hacer buenas preguntas es literalmente uno de los entregables.

Pero ojo: igual que en un proyecto real, puede que no te respondamos a tiempo. Si no hay respuesta, decide tú y documenta la decisión.
