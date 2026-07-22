# Infraestructura y regiones

Este documento registra la ubicacion de los servicios que participan en el camino critico de las rutas privadas y define como verificar que no exista latencia evitable entre la aplicacion, autenticacion y PostgreSQL.

## Configuracion confirmada

Estado verificado el 2026-07-22 a partir de la configuracion visible en los paneles de Vercel y Neon.

| Componente | Proveedor | Region configurada | Identificador | Estado |
|---|---|---|---|---|
| Next.js y Vercel Functions | Vercel sobre AWS | Washington, D.C., USA (East) | `us-east-1` / `iad1` | Confirmado |
| PostgreSQL | Neon sobre AWS | US East 1 (N. Virginia) | `us-east-1` | Confirmado |
| Datos de Neon Auth | Neon PostgreSQL | US East 1 (N. Virginia) | Schema gestionado `neon_auth` | Confirmado por la arquitectura del proyecto |
| API gestionada de Neon Auth | Neon | No expuesta en la evidencia disponible | `NEON_AUTH_BASE_URL` | Pendiente de medir |

La aplicacion y la base de datos estan en la misma region de AWS, `us-east-1`. No existe un cruce continental en el camino normal Vercel Function -> Neon PostgreSQL. La decision actual es mantener Vercel Functions en `iad1`; moverlas a una region occidental aumentaria la distancia hacia Neon sin evidencia de una mejora compensatoria.

La misma evidencia de Neon muestra PostgreSQL 18, compute por defecto entre 0.25 y 2 CU y seis horas de retencion de historial. Estos valores deben conservarse junto con las futuras mediciones porque un cambio de capacidad o un arranque de compute puede alterar la latencia aunque la region no cambie.

La seleccion de region de Vercel se administra actualmente en el panel del proyecto. No se duplica en `vercel.json` para evitar dos fuentes de verdad. Todo cambio en el panel requiere un nuevo deployment para entrar en vigor.

## Topologia del camino critico

```text
Usuario
  -> Vercel Edge
  -> Vercel Function: iad1 / AWS us-east-1
       -> Neon Auth API: ubicacion de servicio por medir
       -> Neon PostgreSQL: AWS us-east-1 (N. Virginia)
```

El punto pendiente no es la alineacion Vercel -> PostgreSQL, sino medir por separado:

1. Resolucion de sesion contra Neon Auth.
2. Round trip de una consulta trivial desde una funcion desplegada.
3. Consultas reales del DAL.
4. TTFB de home y detalle con una sesion autenticada.
5. Arranques frios, que deben analizarse aparte de las solicitudes calientes.

## Presupuesto inicial

Estos objetivos son la linea de partida de PERF-006. Deben revisarse con al menos 100 solicitudes calientes por flujo en staging o produccion controlada.

| Metrica | Objetivo p75 |
|---|---:|
| Resolucion de sesion | < 100 ms |
| Consulta trivial a Neon | < 50 ms |
| TTFB de home autenticada | < 300 ms |
| TTFB de detalle autenticado | < 400 ms |

## Linea base externa

Muestra tomada el 2026-07-22 con ocho solicitudes HTTPS secuenciales por ruta al deployment publico. Los percentiles usan nearest-rank.

| Ruta | Contexto | HTTP | TTFB p50 | TTFB p75 | TTFB p95 |
|---|---|---:|---:|---:|---:|
| `/es` | Pagina publica | 200 | 365 ms | 409 ms | 1,002 ms |
| `/es/home` | Sin cookie autenticada | 200 | 320 ms | 369 ms | 1,542 ms |

Esta muestra incluye red del cliente, DNS, TLS, edge y cualquier arranque frio. No mide el RTT Vercel -> Neon y no valida el presupuesto de una ruta autenticada. Sirve unicamente como referencia reproducible desde el exterior.

Comando de referencia:

```bash
for i in 1 2 3 4 5 6 7 8; do
  curl -sS -o /dev/null \
    -w "$i %{http_code} %{time_starttransfer} %{time_total}\n" \
    https://www.quinielafutve.com/es/home
done
```

## Procedimiento para cerrar PERF-006

### 1. Confirmar regiones despues de cada cambio

- En Vercel, abrir `Project Settings -> Functions -> Function Region` y comprobar `iad1`.
- Confirmar que existe un deployment posterior al ultimo cambio de region.
- En Neon, abrir `Project settings` y comprobar `AWS US East 1 (N. Virginia)`.
- Guardar fecha, ambiente, deployment y capturas en la evidencia del hallazgo.

Resultado esperado: Vercel Functions y Neon PostgreSQL continuan en AWS `us-east-1`.

### 2. Medir desde la funcion desplegada

Instrumentar spans server-side para:

- request completo;
- `auth.getSession()`;
- lectura de usuario de aplicacion;
- cada llamada publica del DAL;
- consulta trivial `SELECT 1`.

Cada muestra debe registrar ambiente, deployment, region de ejecucion disponible en los metadatos de plataforma, ruta, estado de autenticacion, duracion y si hubo arranque frio. No se debe crear un endpoint diagnostico publico ni registrar cookies, tokens, URLs de conexion, SQL con valores sensibles o datos personales.

Para la consulta trivial se puede usar temporalmente una ruta interna protegida en staging o una prueba ejecutada dentro del mismo runtime desplegado. Debe eliminarse al terminar la medicion.

### 3. Ejecutar la muestra

- Usar una cuenta de prueba y datos no productivos.
- Ejecutar al menos 100 solicitudes calientes a home y 100 al detalle de una quiniela.
- Medir por separado una primera solicitud fria; no mezclarla con el percentil caliente.
- Informar p50, p75 y p95 para sesion, `SELECT 1`, DAL y TTFB completo.
- Comparar los resultados con el presupuesto inicial.

### 4. Decidir con datos

- Si `SELECT 1` cumple pero las rutas no, optimizar sesion, consultas y renderizado antes de mover regiones.
- Si `SELECT 1` incumple de forma sostenida desde `iad1`, revisar el endpoint de conexion, pooling y proyecto de Neon antes de cambiar la region de Vercel.
- Si la sesion incumple y PostgreSQL cumple, investigar por separado Neon Auth y su endpoint configurado.
- Una region solo se cambia con una medicion antes/despues usando el mismo deployment, datos y carga.

## Checklist operativo

- [x] Region de Vercel Functions documentada.
- [x] Region de Neon PostgreSQL documentada.
- [x] Alineacion AWS `us-east-1` confirmada.
- [x] No hay cruce continental Vercel Function -> Neon PostgreSQL.
- [ ] Region o latencia efectiva de la API de Neon Auth medida.
- [ ] RTT de `SELECT 1` medido desde `iad1`.
- [ ] Resolucion de sesion p75 medida con trazas.
- [ ] Home autenticada cumple su presupuesto p75.
- [ ] Detalle autenticado cumple su presupuesto p75.
- [x] Evidencia parcial registrada en `performance-security-audit.md`.
