# Gulliver frontend
React, Zustand e IndexedDB. Node 22+ y API v2. npm ci; configurar VITE_API_URL=http://localhost:8000/api/v1; npm run dev. Para apertura offline: npm run build y npm run preview o servir dist mediante HTTPS. El service worker nunca guarda respuestas API en Cache Storage.

## Flujo
Iniciar sesión con red, elegir línea y preparar plan. IndexedDB conserva plan, catálogos, formulario y pendientes por usuario/turno. El operador captura y envía sin red; el supervisor cierra con conexión. UUID estable y Web Locks impiden duplicar reintentos/procesadores entre pestañas. 401 requiere la misma cuenta; 403/409/422 conservan pendientes. Conciliar requiere comparar con el servidor y explicar motivo; los originales se archivan localmente.

El aislamiento por cuenta no es cifrado frente al administrador local del dispositivo. Administrar tabletas con bloqueo de sistema y sin limpieza mientras haya pendientes. El navegador puede denegar almacenamiento persistente; la UI lo informa. Sincronizar o exportar pendientes antes de retirar una tableta.

Demostración anterior sólo para administradores; contiene módulos con mocks. Las escrituras productivas v1 están retiradas.

## Verificación
npm run typecheck; npm run lint:operational; npm run lint (incluye deuda anterior); npm test; npm run build; npm run test:e2e. El test de navegador necesita gulliver-api hermano, su entorno Python y PostgreSQL desechable. Inicia API en 8009 y preview en 4179; verifica offline, recarga, sincronización, cierre, accesibilidad y orientaciones.

En Windows detecta ../gulliver-api/.venv/Scripts/python.exe. Puede configurarse GULLIVER_PYTHON. GULLIVER_TEST_DATABASE_URL debe terminar en _test. Los tests no usan la base del .env del proyecto. Artefactos: test-results.

Las actualizaciones del service worker esperan para no recargar capturas activas; cerrar pestañas después de sincronizar permite activar la versión nueva. Confirmado por servidor es distinto de guardado local.

## CI entre repositorios
El job verify ejecuta tipos, lint del flujo operativo, pruebas unitarias, build y auditoría. El job browser se habilita al configurar GULLIVER_API_REPOSITORY (owner/repo), GULLIVER_API_REF (ref compatible; main por defecto) y, si el backend es privado, el secreto GULLIVER_CI_TOKEN con permiso de lectura. No se cambiaron configuraciones remotas desde esta implementación.

El lint global de la demostración conserva deuda anterior. La línea base tenía 204 errores; la revisión posterior registró 122. No se deshabilitaron reglas globales para simular una validación completa.
