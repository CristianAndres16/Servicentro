# Servicentro

Panel web para la recepción de vehículos, el seguimiento del taller y el
recuento de servicios para caja.

## Funcionalidades

- Vistas separadas para Recepción/Patio, Taller/Mecánico y Recuento y facturación.
- Recepción táctil de placa y cliente, selección de servicios del formato impreso
  y opción de enviar el vehículo directamente al taller.
- Registro de trabajos, productos y repuestos por el personal de patio o taller
  mientras la orden se encuentre en su etapa.
- Recuento editable, resumen imprimible/guardable como PDF desde el navegador y
  registro del pago en caja.
- Las órdenes pagadas salen de las colas activas, quedan en un historial
  consultable por placa, cliente, teléfono, fecha o trabajo y conservan la opción
  de abrir e imprimir su recuento.
- Si Supabase no está configurado, la aplicación funciona en modo demostración:
  los datos se guardan en el almacenamiento local de ese dispositivo.
- Seguimiento de estados y avisos de conexión.

Con Supabase configurado, la aplicación usa inicio de sesión por usuario y
contraseña, perfiles de Patio, Mecánico y Facturación, órdenes compartidas,
actualización en tiempo real y políticas RLS en la base de datos. Supabase
requiere una identidad de correo internamente; el usuario escribe solo su nombre
de usuario y la aplicación lo transforma en una identidad técnica que no recibe
correos. El historial de eventos conserva las acciones sobre órdenes e ítems.
Las órdenes demostrativas locales no se importan automáticamente a Supabase.

La salida imprimible es un recuento/orden de cobro, no una factura electrónica.

## Requisitos

- Node.js
- npm

## Desarrollo

Desde esta carpeta, instala las dependencias y ejecuta el servidor local:

```bash
npm install
npm run dev
```

## Activar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/) desde tu cuenta.
2. En **SQL Editor**, ejecuta el contenido de
   `supabase/migrations/20261023120000_initial_servicentro.sql`.
3. En **Authentication → Users**, pulsa **Add user → Create new user**. Crea
   estas tres cuentas (puedes cambiar los nombres; conserva la relación con el
   perfil):

   | Usuario para iniciar sesión | Correo técnico que se crea en Supabase | Perfil |
   | --- | --- | --- |
   | `patio` | `patio@servicentro.com` | `patio` |
   | `mecanico` | `mecanico@servicentro.com` | `mecanico` |
   | `lineth` | `lineth@servicentro.com` | `facturacion` |

   Escribe una contraseña segura para cada cuenta y guárdala de forma privada.
   Si el formulario ofrece **Auto Confirm User**, actívalo para que puedan
   iniciar sesión sin confirmar un correo que no se usa. No habilites el
   registro público. Los empleados escribirán solo el nombre de usuario y su
   contraseña en la aplicación.
4. Después de crear las tres cuentas, ve a **SQL Editor → New query**, copia y
   ejecuta este bloque. Crea o actualiza los perfiles automáticamente; no
   necesitas buscar ni copiar UUID:

   ```sql
   do $$
   declare
     missing_users text;
   begin
     select string_agg(expected.email, ', ')
     into missing_users
     from (values
       ('patio@servicentro.com'),
       ('mecanico@servicentro.com'),
       ('lineth@servicentro.com')
     ) as expected(email)
     left join auth.users as auth_user
       on lower(auth_user.email) = expected.email
     where auth_user.id is null;

     if missing_users is not null then
       raise exception 'Primero crea estas cuentas en Authentication → Users: %', missing_users;
     end if;

     insert into public.profiles (id, full_name, role)
     select auth_user.id, profile.full_name, profile.role
     from (values
       ('patio@servicentro.com', 'Usuario de Patio', 'patio'),
       ('mecanico@servicentro.com', 'Mecánico', 'mecanico'),
       ('lineth@servicentro.com', 'Lineth', 'facturacion')
     ) as profile(email, full_name, role)
     join auth.users as auth_user
       on lower(auth_user.email) = profile.email
     on conflict (id) do update
       set full_name = excluded.full_name,
           role = excluded.role,
           active = true;
   end $$;
   ```

   Si quieres cambiar los nombres visibles, edita los valores de `full_name`
   (por ejemplo, `Usuario de Patio`) antes de ejecutar. Si prefieres otros
   nombres de usuario, cambia el correo técnico correspondiente tanto al crear
   la cuenta como en las dos listas del SQL.
5. Copia `.env.example` como `.env.local` y asigna la URL del proyecto y la
   clave pública **anon/publishable** que aparecen en la configuración/API de
   Supabase:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-publica
   ```

6. Reinicia `npm run dev`. Para publicar la app, configura esas mismas dos
   variables en el proveedor de hosting y vuelve a desplegar.

`.env.local` está excluido de Git. La clave pública está diseñada para usarse
desde el navegador y las políticas RLS limitan las operaciones por rol. Nunca
copies una clave `service_role` o secreta al frontend, al repositorio ni al
chat. Si se cambia un rol, debe hacerse desde un entorno administrativo seguro.
El nombre de usuario para iniciar sesión debe tener entre 3 y 32 caracteres y
usar solo letras sin tilde, números, punto, guion o guion bajo. Para recuperar
o cambiar una contraseña, el administrador debe actualizarla desde Supabase.

En modo conectado, las órdenes de demostración locales no aparecen ni se copian
a la base de datos. El perfil de Patio recibe vehículos, el de Mecánico registra
trabajos y cierra órdenes, y Facturación revisa, corrige, cobra y consulta el
historial. Las órdenes pagadas quedan protegidas contra cambios.

## Validación y compilación

```bash
npm run lint
npm run build
```
