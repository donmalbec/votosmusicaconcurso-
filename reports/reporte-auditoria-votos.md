# Reporte preliminar de auditoria de votos

Fecha: 19 de mayo de 2026  
Proyecto Supabase: `pizza-music-vote` (`migquiivlhupijgmlbup`)

## Resumen ejecutivo

Se reviso la base de datos de votos en modo solo lectura. No se modificaron votos, tablas, politicas ni configuraciones.

La revision muestra que el sistema actual permite votos publicos desde el navegador y que existen senales de posible abuso o, al menos, de votos duplicados.

Punto clave: hoy la base de datos permite un voto por correo/dispositivo por cada cancion, no necesariamente un solo voto por persona para todo el concurso. Si la regla oficial era "un voto total por persona", entonces hay votos historicos que necesitan revision.

Decision operativa recomendada para no alterar el concurso en curso: no modificar votos historicos y endurecer el sistema solo hacia adelante. Esto significa que los votos ya emitidos quedan como estan, pero los nuevos votos deben pasar por verificacion de correo y controles anti-abuso del lado servidor.

## Datos revisados

La auditoria se hizo con una copia analitica redacted: correos, IPs y dispositivos fueron transformados con hashes temporales. No se guardaron datos personales crudos en el repositorio.

Totales observados:

- Votos totales: 966
- Correos unicos: 960
- Dispositivos unicos: 926
- IPs unicas: 761
- Grupos de correos duplicados: 6
- Votos extra por correos duplicados: 6
- Grupos de dispositivos duplicados: 32
- Votos extra por dispositivos duplicados: 40
- Registros con formato de dispositivo invalido: 140
- Primer voto registrado: 2026-05-16 17:57 UTC
- Ultimo voto revisado: 2026-05-19 03:39 UTC

## Ranking observado

Top 10 al momento de la revision:

| Puesto | Cancion | Artista | Votos |
|---:|---|---|---:|
| 1 | Pizza Day | Keleven ft. Sielo | 187 |
| 2 | Cariddi Records #1 | Cariddi Crypto | 175 |
| 3 | Pizza X | Brauxelion ft. YoungBleak | 150 |
| 4 | Pizza DA0 | FVST | 120 |
| 5 | Tango, Pizza y Amigos | RGabrielDiaz | 82 |
| 6 | Bitcoin Legend | Joan Barbosa | 67 |
| 7 | Pizza Gratis | La Macabrita | 54 |
| 8 | Solo unas Pizzas | Marco Crypto | 37 |
| 9 | Masa Y Fuego | Sebastian Ceciliano | 31 |
| 10 | Global Pizza Party | Herimax | 18 |

## Hallazgos de seguridad

1. La tabla `votes` tiene RLS activado, pero actualmente existen politicas publicas que permiten:
   - `SELECT` publico sobre los votos.
   - `INSERT` publico de votos.

2. Los roles `anon` y `authenticated` tienen permisos amplios sobre la tabla, incluyendo permisos como `SELECT`, `INSERT`, `UPDATE`, `DELETE` y `TRUNCATE`. Aunque RLS limita parte del acceso, esta configuracion no es recomendable para una votacion publica.

3. Las restricciones actuales permiten duplicados por concurso:
   - Existe unicidad para `(email, video_id)`.
   - Existe unicidad para `(device_id, video_id)`.
   - Eso significa que un mismo correo o dispositivo puede votar por varias canciones distintas.

4. Hay 140 filas con `device_id` en formato inesperado. Esto no prueba fraude por si solo, pero indica que los controles de dispositivo no han sido consistentes durante toda la votacion.

5. Hay clusters por IP con muchos votos. Esto puede significar abuso, pero tambien puede corresponder a redes compartidas, comunidades, eventos, oficinas, VPNs o familias. No debe usarse como unica prueba para eliminar votos.

## Senales de posible abuso

Las senales mas relevantes son:

- 32 dispositivos aparecen votando mas de una vez.
- 40 votos son "extra" si se aplica una regla estricta de un voto por dispositivo.
- 6 correos aparecen votando mas de una vez.
- Algunos grupos de IP concentran varios votos en ventanas relativamente cortas.

Interpretacion prudente: hay evidencia suficiente para endurecer el sistema desde ahora. No hay evidencia suficiente, solo con estos datos, para borrar votos masivamente sin una regla aprobada.

## Decisiones que necesita tomar la organizacion

1. Regla oficial de voto:
   - Opcion A: Un correo/dispositivo puede votar una vez por cancion.
   - Opcion B: Un correo/dispositivo puede votar una sola vez en todo el concurso.
   - Opcion C: Otra regla, por ejemplo un voto por correo y revision manual por dispositivo/IP.

2. Tratamiento de votos historicos duplicados:
   - Mantener todos los votos ya emitidos y endurecer solo hacia adelante.
   - Conservar solo el primer voto de cada correo/dispositivo.
   - Conservar solo el ultimo voto de cada correo/dispositivo.
   - Hacer revision manual de los grupos sospechosos antes de decidir.

3. Tratamiento de los 140 `device_id` invalidos:
   - Mantenerlos por ser datos historicos.
   - Marcarlos para revision.
   - Invalidarlos si la regla exige dispositivo verificable.

4. Nivel de transparencia:
   - Publicar solo el resultado final.
   - Publicar una nota breve indicando que hubo auditoria anti-abuso.
   - Publicar criterios de invalidacion antes de aplicar cambios.

Si la organizacion decide "hacer vista hacia adelante" para no alterar votos existentes, la opcion practica es mantener el historico y aplicar controles estrictos solo para votos nuevos.

## Recomendacion tecnica

Recomiendo separar el problema en dos etapas.

Etapa 1: Congelar y auditar

- No borrar votos todavia.
- Definir la regla oficial.
- Exportar una lista redacted de clusters sospechosos para revision manual.
- Si se decide invalidar votos, crear una tabla o columna de estado en vez de borrar fisicamente registros.

Etapa 2: Endurecer el sistema hacia adelante

- Mover los inserts de votos al servidor, no al cliente.
- Verificar el correo con codigo OTP o magic link antes de registrar el voto.
- Crear un identificador de dispositivo firmado por el servidor, no aceptado directamente desde el navegador.
- Usar service role solo en backend.
- Quitar permisos directos de `anon` y `authenticated` sobre `votes`.
- Eliminar politicas publicas de `SELECT` e `INSERT` sobre votos crudos.
- Agregar rate limiting del lado servidor.
- Activar hCaptcha o verificacion equivalente.
- Agregar guardrails en base de datos para bloquear nuevos duplicados sin editar filas historicas.
- Definir constraints segun la regla oficial:
  - Si es un voto total por persona: indice unico por correo normalizado y por dispositivo.
  - Si es un voto por cancion: mantener unicidad por `(email, video_id)` y `(device_id, video_id)`, pero agregar protecciones contra abuso.

## Recomendacion organizativa

Mi recomendacion practica actual es:

1. Mantener todos los votos historicos ya emitidos.
2. Publicar o comunicar internamente que desde ahora se exige correo verificable.
3. Aplicar el nuevo flujo de voto con codigo de correo, rate limiting y hCaptcha.
4. Cerrar el acceso directo publico a la tabla `votes` para que nadie pueda saltarse la web.
5. Conservar la auditoria redacted para documentar por que se hizo el cambio.

## Riesgo de aplicar cambios sin decidir criterio

Si se aplica ahora una restriccion unica global por correo/dispositivo, la migracion fallaria porque ya existen duplicados historicos. Si se borran duplicados sin criterio aprobado, se puede alterar el resultado del concurso de forma dificil de justificar.

Por eso, la opcion mas segura es forward-only: no tocar historicos, pero impedir que nuevos votos entren sin correo verificado y sin pasar por el servidor.
