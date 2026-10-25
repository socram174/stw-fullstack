# STW Alerts — frontend

Frontend de alertas de pavos de Fortnite Save the World. React, TypeScript, Vite,
Tailwind CSS y shadcn/ui sobre Base UI.

## Desarrollo

```sh
npm install
npm run dev
```

Por defecto, las consultas a `/api` se envían al backend local en
`http://localhost:6001` mediante el proxy de Vite. El backend debe estar
ejecutándose y conectado a MongoDB. Para usar otra dirección, copia
`.env.example` a `.env.local` y cambia `VITE_BASE_APP_URL` por el origen del backend,
sin añadir `/api`. Déjalo vacío para usar el mismo origen. Reinicia Vite después
de editar variables de entorno. Esta variable es pública: no incluyas secretos.

```dotenv
VITE_BASE_APP_URL=https://tu-backend.example.com
```

## Estructura

```text
src/
  App.tsx                     # Rutas y carga diferida del historial
  components/
    layout/                   # Navegación, pie de página y selector de tema
    shared/                   # Encabezados, estadísticas y estados reutilizables
    ui/                       # Primitivas de shadcn
  features/
    alerts/
      api/                    # Consultas y adaptación del contrato del backend
      components/             # Listado de misiones, filtros, resumen y zonas
      hooks/                  # Carga, cancelación, reintentos y estados
      lib/                    # Filtros locales de las misiones de la portada
      types.ts                # Modelo de datos que consume la interfaz
    history/
      components/             # Tabla paginada y gráfico de recompensas
  lib/                        # Cliente HTTP y formatos compartidos
  pages/                      # Composición de alertas, historial y 404
tests/                        # Casos del contrato y reglas de datos
```

Las páginas componen la interfaz. Los componentes de presentación no hacen
consultas. `alerts/api` valida el contrato versionado del backend y los hooks
gestionan carga, cancelación y reintentos. El backend normaliza los datos y
calcula los totales; el frontend solo filtra localmente las misiones de la portada.

## Comportamiento y contrato

- `/`: `GET /api/v1/alerts/latest`, la última rotación registrada por el backend.
  Esta ruta consulta datos; no solicita una actualización al recolector.
  Se muestra la fecha real del registro, sin asumir que corresponde a hoy.
- `/history`: `GET /api/v1/alerts`, con búsqueda, zona, fechas inclusivas,
  ordenamiento y paginación de 15 registros en el servidor. Los filtros y la
  página se guardan en la URL. Edita los filtros y pulsa **Apply filters** o Enter.
  La tabla recibe una página; los totales y el gráfico incluyen toda la selección.
- El gráfico muestra hasta 30 fechas **registradas**; los huecos entre fechas
  no se interpretan como días sin recompensas.
- Los registros de cero pavos se conservan para el historial, pero no cuentan
  como misiones. El backend convierte las fechas `MM/DD/YYYY` y las antiguas `MM/DD/YY`
  a `YYYY-MM-DD` sin desplazamientos de zona horaria. Los años de dos dígitos
  del archivo se interpretan como años de los 2000.
- Las respuestas HTTP fallidas o con formato inválido muestran un error con
  reintento. No se reemplazan por datos ficticios ni por una recompensa de cero.
- Las solicitudes se cancelan al abandonar la página y tienen un límite de
  15 segundos. El historial y su gráfico se cargan al navegar a esa página.
- Tema claro/oscuro, preferencia del sistema, botón de tema y atajo `D`.

El contrato y las limitaciones del almacenamiento antiguo se describen en
[`server/README.md`](../server/README.md).

## Verificación

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Las pruebas usan el ejecutor de Node, sin otro framework; requieren Node 22.18+
o 24+. Cubren el contrato versionado, respuestas inválidas, filtros y ordenamiento
local. Las pruebas del backend cubren fechas antiguas, consultas, paginación,
resúmenes, registros sin pavos y errores HTTP.

## Producción

Despliega primero el backend para habilitar las rutas nuevas. Define
`VITE_BASE_APP_URL` con el origen público del backend (sin `/api`) **antes** de ejecutar
`npm run build`. El proxy de `/api` funciona únicamente en el servidor de
desarrollo; si mantienes `/api` en producción, configura un proxy equivalente
en tu alojamiento. Cuando front y back usen orígenes distintos, el backend debe
permitir el origen del frontend mediante CORS.

Publica `dist/` y configura el alojamiento para servir `index.html` en las rutas
de la SPA (por ejemplo `/history`). Las rutas desconocidas muestran una pantalla
404 del frontend; el estado HTTP lo determina el alojamiento.
