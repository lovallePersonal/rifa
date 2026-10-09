# Rifa

Aplicacion web para administrar una rifa de 999 numeros (001 a 999). Tiene dos vistas:

- **Vista publica** (`/`): abierta a todo el mundo. Muestra la grilla de numeros con su
  estado (disponible, reservado, pagado), contadores y un buscador. Al elegir un numero
  disponible, el comprador deja sus datos y se abre un mensaje de WhatsApp hacia un
  administrador para coordinar el pago.
- **Vista de administracion** (`/admin`): protegida con login de Google y limitada a los
  correos administradores. Permite ver los datos de cada comprador, filtrar por estado y
  vendedor, marcar pagos, liberar numeros, registrar el numero ganador y exportar a CSV.

El premio es **Nintendo Switch + AirPods 4**, la boleta cuesta **10 mil pesos** y se
sortea con los tres ultimos digitos de la **Loteria de Bogota**.

---

## Requisitos

- Node 20 (probado con 20.19.2)
- pnpm 10.17.0 (gestor de paquetes obligatorio del proyecto)

## Correr en local

```bash
pnpm install        # instala dependencias
pnpm dev            # servidor de desarrollo (http://localhost:5173)
pnpm build          # chequeo de tipos (tsc) + build de produccion (dist/)
pnpm preview        # sirve el build de produccion localmente
```

Antes de correr, copia `.env.example` a `.env.local` y completa las variables (ver abajo).

## Variables de entorno

| Variable | Descripcion |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (Project Settings -> API -> Project URL) |
| `VITE_SUPABASE_ANON_KEY` | Clave anon/public del proyecto |
| `VITE_APP_VERSION` | Version mostrada en el footer (`dev` en local) |

---

## Configurar Supabase (nube)

No hay Supabase local ni Docker: todo el backend vive en Supabase Cloud.

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. Abre el **SQL editor** y pega, **en orden**, el contenido de cada archivo de `supabase/`:
   1. `01_schema.sql` — tabla `tickets`, tabla `admin_emails`, trigger de `updated_at`.
   2. `02_views.sql` — vista `public_tickets` (solo columnas seguras).
   3. `03_rls.sql` — Row Level Security por correo administrador.
   4. `04_functions.sql` — RPC `reserve_ticket` (unico camino de escritura publico).
   5. `05_seed.sql` — carga los 999 numeros y los tres correos administradores.
   6. `07_reserve_multi.sql` — RPC `reserve_tickets` (reserva multiple atomica). Ver la
      seccion **Reserva multiple de numeros** mas abajo: este paso es **obligatorio** para
      que la compra de varios numeros a la vez funcione.
3. En **Project Settings -> API** copia la **Project URL** y la clave **anon public** a tu
   `.env.local` (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

## ⚠️ Reserva multiple de numeros (accion manual OBLIGATORIA)

La compra de **varios numeros a la vez** desde la vista publica usa el RPC
`reserve_tickets`, definido en `supabase/07_reserve_multi.sql`. **Esta funcionalidad no
funciona en produccion hasta que apliques ese archivo en Supabase.** Si no lo ejecutas, la
seleccion multiple fallara al reservar.

Pasos exactos:

1. Abre tu proyecto en [supabase.com](https://supabase.com).
2. Ve al **SQL editor**.
3. Pega el contenido completo de `supabase/07_reserve_multi.sql`.
4. Ejecuta (**Run**).

Notas:

- Debe ejecutarse **despues** de `04_functions.sql` (depende de la misma tabla `tickets` y
  del mismo patron de permisos que `reserve_ticket`).
- Es **aditivo e idempotente**: usa `CREATE OR REPLACE FUNCTION`, por lo que puedes
  volver a ejecutarlo sin romper nada ni perder datos.

## Configurar login de Google en Supabase

1. En Supabase ve a **Authentication -> Providers -> Google** y habilita el proveedor
   (necesitas un Client ID y Client Secret de Google Cloud Console).
2. En Google Cloud Console agrega la **callback URL** de Supabase
   (`https://<tu-proyecto>.supabase.co/auth/v1/callback`) como URI de redireccion autorizado.
3. En Supabase, en **Authentication -> URL Configuration**, agrega el **Site URL** y los
   **Redirect URLs** de tu entorno (por ejemplo `http://localhost:5173` en local y la URL de
   produccion cuando despliegues).

## Hook de autenticacion (bloqueo de no-administradores)

Ademas de las politicas RLS, el proyecto incluye una **barrera a nivel de autenticacion**
(`supabase/06_auth_hook.sql`) que impide que una cuenta de Google no autorizada obtenga
siquiera un token de acceso. Es una capa de defensa en profundidad: el usuario rechazado
nunca llega a tener sesion, antes de que RLS tenga que intervenir.

- **Tipo de hook:** *Custom Access Token* (se ejecuta antes de emitir cada token, tanto en
  el login inicial como en cada refresh, por lo que bloquea tambien a cuentas no-admin ya
  existentes).
- **Funcion:** `public.restrict_token_to_admins(event jsonb)`. Si el correo del evento no
  esta en `public.admin_emails` (comparacion insensible a mayusculas), devuelve un `error`
  y Supabase Auth aborta la emision del token.

**Pasos en el dashboard para habilitarlo** (accion manual, obligatoria):

1. Ejecuta `supabase/06_auth_hook.sql` en el **SQL editor** (despues de `05_seed.sql`).
2. Ve a **Authentication -> Hooks**.
3. En **Custom Access Token** selecciona la funcion `public.restrict_token_to_admins`.
4. Guarda y deja el hook **habilitado (Enable)**.

**Capa adicional opcional (nivel UI):** en **Authentication -> Providers -> Google** (o en
**Authentication -> Settings**) puedes restringir el registro con *allowed domains* o
desactivar sign-ups abiertos, como refuerzo extra. No reemplaza al hook ni a RLS.

## Gestionar los correos administradores

Los tres administradores ya estan configurados:

- `leandroovalle02@gmail.com`
- `jacoboovallegiraldo@gmail.com`
- `juan.feliperodriguezgarcia1508@gmail.com`

Para **agregar o quitar** un administrador hay que actualizar **dos lugares**:

1. La lista `ADMIN_EMAILS` en `src/config.ts` (control del frontend).
2. La tabla `admin_emails` en Supabase, con un `INSERT` (o borrando la fila):

   ```sql
   INSERT INTO public.admin_emails (email) VALUES ('nuevo@gmail.com')
   ON CONFLICT (email) DO NOTHING;
   ```

La comparacion de correos es **insensible a mayusculas/minusculas** tanto en el frontend
(`isAdminEmail`) como en las politicas RLS, asi que no importa como el usuario escriba su
correo al iniciar sesion.

---

## Privacidad de los datos

El modelo esta pensado para que los datos de contacto de los compradores nunca queden
expuestos al publico:

- La vista publica lee **unicamente** la vista `public_tickets`, que solo proyecta
  `number`, `status` e `is_winner`. Nunca se exponen nombre, telefono ni correo.
- La unica escritura publica es el RPC `reserve_ticket` (SECURITY DEFINER), que reserva un
  numero disponible de forma atomica y guarda los datos del comprador en la tabla base.
- La tabla base `tickets` tiene **RLS** activada: solo los correos presentes en
  `admin_emails` pueden leer y modificar las filas completas (incluyendo datos del comprador).

El codigo publico nunca consulta la tabla `tickets` directamente.

## Fase de pruebas (WhatsApp)

Los numeros reales de WhatsApp estan en `src/config.ts` (`WHATSAPP_NUMBERS`):

- Jaco: `573125556018`
- Pipe: `573115469638`
- Prueba: `573143933641`

Durante las pruebas el destino activo es el **numero de prueba** `573143933641`
(`WHATSAPP_ACTIVE_DESTINATION`). Para pasar a produccion cambia **una sola linea** en
`src/config.ts`:

```ts
export const WHATSAPP_ACTIVE_DESTINATION: string = WHATSAPP_NUMBERS.jaco // o .pipe
```

---

## Desplegar en Vercel

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com) importa el repositorio. Vercel detecta el framework
   **Vite** automaticamente.
3. Configura las variables de entorno del proyecto en Vercel:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_APP_VERSION`.
4. Despues del primer deploy, agrega la **URL de Vercel** a los Redirect URLs de Supabase
   (Authentication -> URL Configuration) y a los URIs de redireccion autorizados de Google,
   para que el login funcione en produccion.
