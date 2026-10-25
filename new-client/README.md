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
`.env.example` a `.env.local` y cambia `VITE_BASE_APP_URL`. Reinicia Vite después
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
      lib/                    # Normalización, filtros, agrupación y estadísticas
      types.ts                # Modelo de datos que consume la interfaz
    history/
      components/             # Tabla paginada y gráfico de recompensas
  lib/                        # Cliente HTTP y formatos compartidos
  pages/                      # Composición de alertas, historial y 404
tests/                        # Casos del contrato y reglas de datos
```

Las páginas componen la interfaz. Los componentes de presentación no hacen
consultas. `alerts/api` adapta la respuesta antigua a un modelo tipado, para que
los componentes no dependan de campos como `zone.mission` o `_id`.
Los filtros y las estadísticas son funciones puras compartidas por ambas páginas.

## Comportamiento y contrato

- `/`: `POST /alerts/update`, la última rotación registrada por el backend.
  Esta ruta consulta datos; no solicita una actualización al recolector.
  Se muestra la fecha real del registro, sin asumir que corresponde a hoy.
- `/history`: `GET /alerts`, con búsqueda, zona, fechas inclusivas,
  ordenamiento y paginación de 15 registros. Los filtros y la página se
  guardan en la URL. Edita los filtros y pulsa **Aplicar filtros** o Enter.
  La tabla, los totales y el gráfico usan la misma selección.
- El gráfico muestra hasta 30 fechas **registradas**; los huecos entre fechas
  no se interpretan como días sin recompensas.
- Los registros de cero pavos se conservan para el historial, pero no cuentan
  como misiones. Las fechas `MM/DD/YYYY` y las antiguas `MM/DD/YY` se convierten
  a `YYYY-MM-DD` sin desplazamientos de zona horaria. Los años de dos dígitos
  del archivo se interpretan como años de los 2000.
- Las respuestas HTTP fallidas o con formato inválido muestran un error con
  reintento. No se reemplazan por datos ficticios ni por una recompensa de cero.
- Las solicitudes se cancelan al abandonar la página y tienen un límite de
  15 segundos. El historial y su gráfico se cargan al navegar a esa página.
- Tema claro/oscuro, preferencia del sistema, botón de tema y atajo `D`.

El backend actual devuelve el historial completo. El filtrado y la paginación
ocurren en el cliente. Para un volumen mucho mayor, la siguiente mejora sería
agregar filtros y paginación en el servidor conservando estos componentes.

## Verificación

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Las pruebas usan el ejecutor de Node, sin otro framework; requieren Node 22.18+
o 24+. Cubren fechas, respuestas inválidas, registros sin pavos, búsqueda,
ordenamiento, filtros combinados y totales diarios.

## Producción

Define `VITE_BASE_APP_URL` con la URL pública del backend **antes** de ejecutar
`npm run build`. El proxy de `/api` funciona únicamente en el servidor de
desarrollo; si mantienes `/api` en producción, configura un proxy equivalente
en tu alojamiento. Cuando front y back usen orígenes distintos, el backend debe
permitir el origen del frontend mediante CORS.

Publica `dist/` y configura el alojamiento para servir `index.html` en las rutas
de la SPA (por ejemplo `/history`). Las rutas desconocidas muestran una pantalla
404 del frontend; el estado HTTP lo determina el alojamiento.
