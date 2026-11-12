// =============================================================================
// DATOS INICIALES SEMILLA — AULALAB
// =============================================================================

const INITIAL_DATA = {
  "appName": "AulaLab",
  "materias": [
    {
      "id": "bdd-2026",
      "nombre": "Bases de Datos Distribuidas",
      "cuestionarios": [
        {
          "id": "prueba-1-corregida",
          "titulo": "Prueba 1 — Examen Oficial Corregido (25 Preguntas)",
          "descripcion": "Cuestionario oficial de 25 preguntas con todas las respuestas corregidas y explicadas.",
          "preguntas": [
            {
              "tipo": "single",
              "enunciado": "El número de atributos (columnas) que tiene una relación se denomina:",
              "opciones": ["Dominio de la relación", "Cardinalidad de la relación", "Clave primaria", "Grado de la relación"],
              "correcta": 3,
              "explicacion": "El grado de una relación es el número de atributos (columnas), mientras que la cardinalidad es el número de tuplas (filas)."
            },
            {
              "tipo": "matching",
              "enunciado": "Empareje cada escenario con la frecuencia de entrega que ilustra:",
              "pares": [
                { "item": "Alerta enviada cuando el inventario baja de un mínimo", "respuesta": "Condicional" },
                { "item": "Reporte enviado cada noche a las 00:00", "respuesta": "Periódica" },
                { "item": "Consulta puntual de un analista, sin patrón fijo", "respuesta": "Ad hoc o irregular" }
              ],
              "explicacion": "Condicional responde a eventos/umbrales, Periódica a intervalos fijos y Ad hoc a peticiones bajo demanda."
            },
            {
              "tipo": "single",
              "enunciado": "Para transformar una jerarquía de especialización/generalización con restricción disjunta y total (cada ocurrencia de la superclase pertenece a exactamente una subclase), una de las estrategias más eficientes es:",
              "opciones": [
                "Crear una tabla por cada subclase, incluyendo en ella los atributos propios de la subclase más los atributos heredados de la superclase (sin tabla separada para la superclase).",
                "Crear una tabla para la superclase y dejar sin representar a las subclases, ya que son redundantes.",
                "Ignorar la jerarquía y crear solamente la tabla de la superclase, descartando los atributos propios de las subclases.",
                "Crear una única tabla para toda la jerarquía, con una columna para cada atributo de todas las subclases, muchas de las cuales quedarán nulas."
              ],
              "correcta": 0,
              "explicacion": "Al ser disjunta y total, toda entidad pertenece a una única subclase; crear tablas solo para las subclases evita nulos y duplicados."
            },
            {
              "tipo": "single",
              "enunciado": "Un administrador reparte la tabla EMP de modo que los empleados E1 a E3 se almacenan en París y E4 a E6 en Boston. ¿Qué tipo de fragmentación se aplicó?",
              "opciones": ["Vertical (proyección de columnas)", "Híbrida (filas y columnas a la vez)", "Horizontal (selección de filas)", "Replicación completa de la tabla"],
              "correcta": 2,
              "explicacion": "Dividir una tabla por subconjuntos de tuplas (filas) según un predicado es fragmentación horizontal."
            },
            {
              "tipo": "multiple",
              "enunciado": "¿Cuáles son promesas de un DBMS distribuido? Seleccione todas las que apliquen.",
              "opciones": [
                "Gestión transparente de datos distribuidos, fragmentados y replicados",
                "Mejor rendimiento",
                "Mayor fiabilidad y disponibilidad mediante transacciones distribuidas",
                "Costo de transmisión de datos igual a cero",
                "Expansión del sistema más fácil y económica",
                "Eliminación total de la necesidad de administrar los datos"
              ],
              "correctas": [0, 1, 2, 4],
              "explicacion": "Las 4 promesas fundamentales son: transparencia, mayor fiabilidad/disponibilidad, mejor rendimiento y expansión más fácil y económica (escalabilidad)."
            },
            {
              "tipo": "single",
              "enunciado": "Según la definición de la unidad, una base de datos distribuida (DDB) es:",
              "opciones": [
                "El software que gestiona las bases de datos y oculta la distribución al usuario.",
                "Una colección de múltiples bases de datos lógicamente interrelacionadas, distribuidas en una red de computadores.",
                "Una única base de datos almacenada en un nodo y accesible de forma remota a través de la red.",
                "Una colección de archivos independientes, sin relación lógica, almacenados en discos locales de distintos equipos."
              ],
              "correcta": 1,
              "explicacion": "Una DDB es una colección de múltiples bases de datos lógicamente interrelacionadas distribuidas sobre una red; el software que la gestiona es el DDBMS."
            },
            {
              "tipo": "single",
              "enunciado": "¿Qué función de costo busca minimizar el procesamiento de consultas distribuidas?",
              "opciones": [
                "costo = transmisión de datos + procesamiento local",
                "costo = capacidad de almacenamiento + ancho de banda contratado",
                "costo = número de réplicas + número de fragmentos",
                "costo = tiempo de commit + tiempo de detección de deadlocks"
              ],
              "correcta": 0,
              "explicacion": "El optimizador distribuido minimiza el costo total sumando el costo de comunicación/transmisión en red y el procesamiento local (E/S y CPU)."
            },
            {
              "tipo": "matching",
              "enunciado": "Clasifique cada elemento según la categoría a la que pertenece:",
              "pares": [
                { "item": "Una materia puede ser cursada por muchos estudiantes, y un estudiante puede cursar muchas materias.", "respuesta": "Cardinalidad N:M" },
                { "item": "Un libro puede existir en el catálogo sin haber sido prestado nunca.", "respuesta": "Participación parcial" },
                { "item": "Un auto puede tener, como máximo, un propietario registrado a la vez.", "respuesta": "Cardinalidad 1:1 o 1:N (según el lado analizado)" },
                { "item": "Un paciente debe estar inscrito obligatoriamente en al menos una ficha médica.", "respuesta": "Participación total" }
              ],
              "explicacion": "Muchos a muchos es N:M; opcionalidad es participación parcial; obligatoriedad es participación total."
            },
            {
              "tipo": "multiple",
              "enunciado": "Según la clasificación de la unidad, ¿qué se incluye dentro de la transparencia de red (o de distribución)? Seleccione todas las que apliquen.",
              "opciones": [
                "Transparencia de concurrencia",
                "Transparencia de nombres",
                "Transparencia de ubicación",
                "Transparencia de fragmentación",
                "Transparencia de replicación"
              ],
              "correctas": [1, 2],
              "explicacion": "La transparencia de red (o distribución) oculta la topología de la red mediante transparencia de ubicación y transparencia de nombres."
            },
            {
              "tipo": "single",
              "enunciado": "Respecto a la replicación de datos en un DBMS distribuido, ¿cuál afirmación es correcta?",
              "opciones": [
                "Es útil para las actualizaciones, pero perjudica a las lecturas.",
                "Es igual de eficiente para lecturas que para actualizaciones, porque todas las copias se escriben en paralelo.",
                "Elimina la necesidad de protocolos de replicación y de commit.",
                "Es muy útil para cargas intensivas de lectura, pero problemática para las actualizaciones."
              ],
              "correcta": 3,
              "explicacion": "La replicación acelera lecturas locales y aumenta disponibilidad, pero exige mantener consistencia entre copias al actualizar."
            },
            {
              "tipo": "single",
              "enunciado": "¿Qué ofrecen las transacciones distribuidas para mejorar la fiabilidad del sistema?",
              "opciones": [
                "Fragmentación automática y paralelismo intra-consulta.",
                "Transparencia de ubicación y de nombres.",
                "Mayor ancho de banda y compresión de los datos transmitidos.",
                "Transparencia de concurrencia y atomicidad ante fallas."
              ],
              "correcta": 3,
              "explicacion": "Las transacciones distribuidas garantizan propiedades ACID (atomicidad ante fallas y control de concurrencia) sobre múltiples nodos."
            },
            {
              "tipo": "single",
              "enunciado": "¿Cuál es una característica de un DBMS paralelo según la unidad?",
              "opciones": [
                "Cada nodo es un DBMS autónomo perteneciente a una organización distinta.",
                "Su objetivo principal es ocultar la ubicación geográfica de los datos.",
                "Reparte sus nodos en distintos continentes para acercar los datos al usuario.",
                "Busca alta escalabilidad y rendimiento sin ser geodistribuido, apoyándose en cluster computing."
              ],
              "correcta": 3,
              "explicacion": "Los DBMS paralelos operan típicamente en clústeres de alta velocidad (no geodistribuidos) para maximizar throughput y escalabilidad."
            },
            {
              "tipo": "single",
              "enunciado": "¿Cuál de las siguientes afirmaciones describe mejor la computación distribuida?",
              "opciones": [
                "Un único computador con varios procesadores que comparten la memoria principal y ejecutan las tareas bajo un mismo sistema operativo.",
                "Un servidor central que ejecuta todas las tareas mientras los clientes solo muestran los resultados.",
                "Un conjunto de procesadores idénticos y sincronizados por un reloj común que ejecutan siempre la misma instrucción.",
                "Un conjunto de elementos de procesamiento autónomos, no necesariamente homogéneos, interconectados por una red, que cooperan para realizar sus tareas."
              ],
              "correcta": 3,
              "explicacion": "Definición textual de Özsu & Valduriez: elementos de procesamiento autónomos, heterogéneos, interconectados por red que cooperan."
            },
            {
              "tipo": "matching",
              "enunciado": "Empareje cada tema relacionado con su descripción:",
              "pares": [
                { "item": "MapReduce y Spark", "respuesta": "Procesamiento paralelo de grandes volúmenes de datos" },
                { "item": "P2P moderno", "respuesta": "Nodos pares que comparten datos sin servidor central" },
                { "item": "NewSQL", "respuesta": "SQL y transacciones combinados con escalabilidad horizontal" },
                { "item": "Polystores", "respuesta": "Varios motores de datos accedidos bajo una misma capa" },
                { "item": "NoSQL", "respuesta": "Bases de datos no relacionales orientadas a la escalabilidad" }
              ],
              "explicacion": "MapReduce/Spark procesan Big Data en paralelo; Polystores integran múltiples motores heterogéneos bajo una capa común."
            },
            {
              "tipo": "matching",
              "enunciado": "Clasifique cada elemento según la categoría a la que pertenece:",
              "pares": [
                { "item": "Estudiante e Inscripción_Curso, donde un estudiante puede inscribirse en varios cursos y un curso tiene varios estudiantes.", "respuesta": "Cardinalidad N:M" },
                { "item": "Cliente y Factura, donde cada factura pertenece a un único cliente y un cliente puede tener muchas facturas.", "respuesta": "Cardinalidad 1:N" },
                { "item": "Factura y Detalle_Factura, donde el detalle no puede existir sin la factura a la que pertenece.", "respuesta": "Entidad débil y entidad fuerte" },
                { "item": "País y Capital, donde cada país tiene una única capital y cada capital pertenece a un único país.", "respuesta": "Cardinalidad 1:1" }
              ],
              "explicacion": "Detalle_Factura depende existencialmente de Factura (entidad débil)."
            },
            {
              "tipo": "fill",
              "enunciado": "La [___] se refiere a la separación de la semántica de alto nivel de un sistema de los problemas de implementación de bajo nivel.",
              "respuestasValidas": ["independencia de datos", "independencia de los datos"],
              "explicacion": "La independencia de datos (lógica y física) aísla las aplicaciones de cómo se almacenan y distribuyen los datos."
            },
            {
              "tipo": "multiple",
              "enunciado": "¿Cuáles afirmaciones sobre la fragmentación son correctas? Seleccione todas las que apliquen.",
              "opciones": [
                "La fragmentación vertical reparte las filas según un predicado",
                "La fragmentación horizontal corresponde a una selección de filas",
                "La fragmentación horizontal reparte los atributos de la tabla entre sitios",
                "La fragmentación vertical corresponde a una proyección de columnas",
                "Suele aplicarse por razones de rendimiento, disponibilidad y fiabilidad",
                "La fragmentación híbrida combina las dos anteriores"
              ],
              "correctas": [1, 3, 4, 5],
              "explicacion": "Horizontal = selección de filas; Vertical = proyección de columnas; Híbrida = combinación; se usa por rendimiento, disponibilidad y fiabilidad."
            },
            {
              "tipo": "fill",
              "enunciado": "En una base de datos distribuida, la condición que requiere que todos los valores de las múltiples copias de cada elemento de datos converjan al mismo valor se denomina [___] (ingresar dos palabras).",
              "respuestasValidas": ["consistencia mutua", "mutual consistency"],
              "explicacion": "La consistencia mutua exige que todas las réplicas de un mismo dato converjan al mismo valor."
            },
            {
              "tipo": "multiple",
              "enunciado": "En el procesamiento de datos distribuidos, se necesita dar respuesta a la siguiente pregunta: ¿Qué es lo que está siendo distribuido?, ¿cuáles opciones responden esta pregunta?",
              "opciones": [
                "Diseños.",
                "Control",
                "Datos.",
                "Función.",
                "Usuarios",
                "Lógica del procesamiento."
              ],
              "correctas": [1, 2, 3, 5],
              "explicacion": "Las 4 dimensiones que se pueden distribuir son: Lógica del procesamiento, Función, Datos y Control."
            },
            {
              "tipo": "multiple",
              "enunciado": "¿Qué temas se tratan en la replicación de datos? Seleccione todas las que apliquen.",
              "opciones": [
                "Gestión de bloqueos mutuos",
                "Protocolos centralizados frente a distribuidos",
                "Minimización del costo de transmisión en una consulta",
                "Frescura de las copias",
                "Replicación eager frente a lazy",
                "Consistencia mutua entre copias"
              ],
              "correctas": [1, 3, 4, 5],
              "explicacion": "En replicación se estudian protocolos centralizados vs distribuidos, frescura de copias, eager vs lazy y consistencia mutua."
            },
            {
              "tipo": "single",
              "enunciado": "Un servidor envía la misma actualización a 500 clientes mediante una sola operación de difusión. ¿Qué método de comunicación se está usando?",
              "opciones": ["Unicast", "Entrega periódica", "Uno-a-muchos", "Pull-only"],
              "correcta": 2,
              "explicacion": "La comunicación uno-a-muchos (multicast/broadcast) envía el mensaje a múltiples receptores en una operación."
            },
            {
              "tipo": "single",
              "enunciado": "Para transformar una relación recursiva (unaria) de cardinalidad 1:N, como Supervisa entre Empleado y Empleado, la regla estándar establece que:",
              "opciones": [
                "Se crea siempre una tabla de relación adicional, sin importar la cardinalidad de la relación recursiva.",
                "Se agrega a la tabla Empleado una clave foránea que referencia a la propia clave primaria de Empleado (p. ej., Supervisor_ID).",
                "La relación recursiva no puede representarse en el modelo relacional y debe eliminarse del diseño.",
                "Se crea obligatoriamente una segunda tabla llamada Empleado_2 para representar al supervisor."
              ],
              "correcta": 1,
              "explicacion": "En relaciones unarias 1:N se añade una clave foránea autorreferenciada en la misma tabla."
            },
            {
              "tipo": "matching",
              "enunciado": "Relacione cada descripción con el concepto correspondiente:",
              "pares": [
                { "item": "En una especialización, una ocurrencia de la superclase puede pertenecer a varias subclases a la vez.", "respuesta": "Solapada (overlapping)" },
                { "item": "En una especialización, puede haber ocurrencias de la superclase que no pertenezcan a ninguna subclase.", "respuesta": "Parcial (opcional)" },
                { "item": "En una especialización, cada ocurrencia de la superclase pertenece, como máximo, a una subclase.", "respuesta": "Disjunta (exclusiva)" },
                { "item": "En una especialización, toda ocurrencia de la superclase debe pertenecer a alguna subclase.", "respuesta": "Total (obligatoria)" }
              ],
              "explicacion": "Restricciones de especialización: disjunta vs solapada (exclusividad) y total vs parcial (obligatoriedad)."
            },
            {
              "tipo": "matching",
              "enunciado": "Empareje las características correctas de pull-only y push-only:",
              "pares": [
                { "item": "La llegada de nuevos elementos de datos o actualizaciones a los datos existentes se llevan a cabo en un servidor sin notificación a los clientes.", "respuesta": "Pull-only" },
                { "item": "La transferencia de datos de los servidores a los clientes es iniciada por un servidor en ausencia de una solicitud específica de los clientes.", "respuesta": "Push-only" },
                { "item": "Los servidores deben ser interrumpidos continuamente para atender las solicitudes de los clientes.", "respuesta": "Pull-only" },
                { "item": "La principal dificultad es decidir qué datos podrían ser de interés común.", "respuesta": "Push-only" }
              ],
              "explicacion": "En pull-only el cliente solicita e interrumpe al servidor; en push-only el servidor envía proactivamente y debe predecir el interés común."
            },
            {
              "tipo": "single",
              "enunciado": "Aumentar la capacidad de un sistema agregando más servidores se denomina:",
              "opciones": ["Scale-out", "Scale-up", "Fragmentación vertical", "Replicación eager"],
              "correcta": 0,
              "explicacion": "Scale-out (escalamiento horizontal) añade más nodos; scale-up (escalamiento vertical) potencia el hardware de un nodo existente."
            }
          ]
        }
      ]
    }
  ]
};

if (typeof window !== "undefined") {
  window.INITIAL_DATA = INITIAL_DATA;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { INITIAL_DATA };
}
