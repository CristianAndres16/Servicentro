create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('patio', 'mecanico', 'facturacion')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.service_orders (
  id uuid primary key default gen_random_uuid(),
  plate text not null check (length(trim(plate)) > 0),
  customer_name text not null check (length(trim(customer_name)) > 0),
  phone text,
  customer_document text,
  vehicle text,
  address text,
  email text,
  received_by text,
  mechanic_name text,
  date_received date not null default current_date,
  note text,
  status text not null default 'patio' check (status in ('patio', 'taller', 'listo', 'pagado')),
  paid_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'pagado') = (paid_at is not null))
);

create table public.service_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders (id),
  description text not null check (length(trim(description)) > 0),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  item_type text not null default 'Producto' check (item_type in ('Servicio', 'Producto')),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.service_order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.service_orders (id),
  actor_id uuid references auth.users (id),
  actor_role text,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index service_orders_status_created_idx
  on public.service_orders (status, created_at desc);
create index service_orders_plate_idx
  on public.service_orders (upper(plate));
create index service_order_items_order_idx
  on public.service_order_items (order_id);
create index service_order_events_order_created_idx
  on public.service_order_events (order_id, created_at desc);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
  from public.profiles
  where id = (select auth.uid()) and active;
$$;

create or replace function public.guard_service_order_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  actor_role text := public.current_profile_role();
begin
  if auth.uid() is null then
    return new;
  end if;

  if actor_role = 'patio' then
    if old.status <> 'patio' or new.status not in ('patio', 'taller', 'listo')
      or new.paid_at is not null
      or (to_jsonb(new) - 'status' - 'updated_at') is distinct from
         (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Patio solo puede enviar una orden a taller o finalizarla.';
    end if;
  elsif actor_role = 'mecanico' then
    if old.status <> 'taller' or new.status not in ('taller', 'listo')
      or new.paid_at is not null
      or (to_jsonb(new) - 'status' - 'updated_at') is distinct from
         (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Taller solo puede finalizar una orden asignada a esa etapa.';
    end if;
  elsif actor_role = 'facturacion' then
    if old.status = 'pagado'
      or (new.status <> old.status and not (old.status = 'listo' and new.status = 'pagado'))
      or (new.status = 'pagado' and new.paid_at is null)
      or (new.status <> 'pagado' and new.paid_at is not null) then
      raise exception 'La orden pagada es inmutable y solo se puede pagar una orden lista.';
    end if;
  else
    raise exception 'Perfil inactivo o sin permisos.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger service_orders_guard_update
before update on public.service_orders
for each row execute function public.guard_service_order_update();

create or replace function public.record_service_order_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_order_id uuid;
  event_name text;
  event_details jsonb;
begin
  if tg_table_name = 'service_orders' then
    target_order_id := coalesce(new.id, old.id);
    if tg_op = 'INSERT' then
      event_name := 'order_created';
      event_details := jsonb_build_object('after', to_jsonb(new));
    else
      event_name := case
        when old.status is distinct from new.status then 'order_status_changed'
        else 'order_updated'
      end;
      event_details := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));
    end if;
    else
      target_order_id := coalesce(new.order_id, old.order_id);
      event_name := 'item_' || lower(tg_op);
      event_details := case
        when tg_op = 'INSERT' then jsonb_build_object('after', to_jsonb(new))
        when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
        else jsonb_build_object('before', to_jsonb(old))
      end;
  end if;

  insert into public.service_order_events (order_id, actor_id, actor_role, event_type, details)
  values (
    target_order_id,
    auth.uid(),
    public.current_profile_role(),
    event_name,
    coalesce(event_details, '{}'::jsonb)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger service_orders_audit
after insert or update on public.service_orders
for each row execute function public.record_service_order_event();

create trigger service_order_items_audit
after insert or update or delete on public.service_order_items
for each row execute function public.record_service_order_event();

create or replace function public.guard_service_order_item_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null
    and (to_jsonb(new) - 'description' - 'quantity' - 'unit_price' - 'item_type') is distinct from
        (to_jsonb(old) - 'description' - 'quantity' - 'unit_price' - 'item_type') then
    raise exception 'No se puede mover ni reasignar un ítem entre órdenes.';
  end if;
  return new;
end;
$$;

create trigger service_order_items_guard_update
before update on public.service_order_items
for each row execute function public.guard_service_order_item_update();

alter table public.profiles enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_items enable row level security;
alter table public.service_order_events enable row level security;

create policy "Users read their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Patio creates service orders"
on public.service_orders for insert to authenticated
with check (
  public.current_profile_role() = 'patio'
  and status in ('patio', 'taller')
  and created_by = (select auth.uid())
);

create policy "Users read orders for their work area"
on public.service_orders for select to authenticated
using (
  public.current_profile_role() = 'facturacion'
  or (public.current_profile_role() = 'patio' and status = 'patio')
  or (public.current_profile_role() = 'mecanico' and status = 'taller')
);

create policy "Users update orders for their work area"
on public.service_orders for update to authenticated
using (
  (public.current_profile_role() = 'patio' and status = 'patio')
  or (public.current_profile_role() = 'mecanico' and status = 'taller')
  or (public.current_profile_role() = 'facturacion' and status <> 'pagado')
)
with check (
  (public.current_profile_role() = 'patio' and status in ('patio', 'taller', 'listo'))
  or (public.current_profile_role() = 'mecanico' and status in ('taller', 'listo'))
  or (public.current_profile_role() = 'facturacion' and status in ('patio', 'taller', 'listo', 'pagado'))
);

create policy "Users read order items for their work area"
on public.service_order_items for select to authenticated
using (
  public.current_profile_role() = 'facturacion'
  or exists (
    select 1 from public.service_orders order_row
    where order_row.id = order_id
      and (
        (public.current_profile_role() = 'patio' and order_row.status = 'patio')
        or (public.current_profile_role() = 'mecanico' and order_row.status = 'taller')
      )
  )
);

create policy "Patio and mechanics add order items"
on public.service_order_items for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (public.current_profile_role() = 'patio' and exists (
      select 1 from public.service_orders order_row
      where order_row.id = order_id and order_row.status = 'patio'
    ))
    or (public.current_profile_role() = 'mecanico' and exists (
      select 1 from public.service_orders order_row
      where order_row.id = order_id and order_row.status = 'taller'
    ))
    or (public.current_profile_role() = 'facturacion' and exists (
      select 1 from public.service_orders order_row
      where order_row.id = order_id and order_row.status <> 'pagado'
    ))
  )
);

create policy "Billing edits items on unpaid orders"
on public.service_order_items for update to authenticated
using (
  public.current_profile_role() = 'facturacion'
  and exists (
    select 1 from public.service_orders order_row
    where order_row.id = order_id and order_row.status <> 'pagado'
  )
)
with check (
  public.current_profile_role() = 'facturacion'
  and exists (
    select 1 from public.service_orders order_row
    where order_row.id = order_id and order_row.status <> 'pagado'
  )
);

create policy "Billing removes items on unpaid orders"
on public.service_order_items for delete to authenticated
using (
  public.current_profile_role() = 'facturacion'
  and exists (
    select 1 from public.service_orders order_row
    where order_row.id = order_id and order_row.status <> 'pagado'
  )
);

create policy "Users read audit events for their work area"
on public.service_order_events for select to authenticated
using (
  public.current_profile_role() = 'facturacion'
  or exists (
    select 1 from public.service_orders order_row
    where order_row.id = order_id
      and (
        (public.current_profile_role() = 'patio' and order_row.status = 'patio')
        or (public.current_profile_role() = 'mecanico' and order_row.status = 'taller')
      )
  )
);

create or replace function public.create_service_order(payload jsonb)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  new_order_id uuid;
  order_item jsonb;
begin
  if public.current_profile_role() is distinct from 'patio' then
    raise exception 'Solo el perfil de patio puede crear órdenes.';
  end if;

  insert into public.service_orders (
    plate, customer_name, phone, customer_document, vehicle, address, email,
    received_by, mechanic_name, date_received, note, status, created_by
  )
  values (
    upper(trim(payload->>'placa')),
    trim(payload->>'cliente'),
    nullif(payload->>'telefono', ''),
    nullif(payload->>'documentoCliente', ''),
    nullif(payload->>'vehiculo', ''),
    nullif(payload->>'direccion', ''),
    nullif(payload->>'correo', ''),
    nullif(payload->>'recibidoPor', ''),
    nullif(payload->>'mecanico', ''),
    coalesce(nullif(payload->>'fechaIngreso', '')::date, current_date),
    nullif(payload->>'nota', ''),
    'patio',
    auth.uid()
  )
  returning id into new_order_id;

  for order_item in
    select value from jsonb_array_elements(coalesce(payload->'itemsTaller', '[]'::jsonb))
  loop
    insert into public.service_order_items (
      order_id, description, quantity, unit_price, item_type, created_by
    )
    values (
      new_order_id,
      trim(order_item->>'descripcion'),
      (order_item->>'cantidad')::numeric,
      (order_item->>'precio')::numeric,
      case when order_item->>'tipo' = 'Servicio' then 'Servicio' else 'Producto' end,
      auth.uid()
    );
  end loop;

  if payload->>'estadoMecanico' = 'En Taller' then
    update public.service_orders set status = 'taller' where id = new_order_id;
  end if;

  return new_order_id;
end;
$$;

create or replace function public.update_service_order_recount(payload jsonb)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  target_order_id uuid := (payload->>'id')::uuid;
  order_item jsonb;
  item_id uuid;
begin
  if public.current_profile_role() is distinct from 'facturacion' then
    raise exception 'Solo facturación puede editar el recuento.';
  end if;

  update public.service_orders
  set customer_name = trim(payload->>'cliente'),
      phone = nullif(payload->>'telefono', ''),
      customer_document = nullif(payload->>'documentoCliente', ''),
      vehicle = nullif(payload->>'vehiculo', ''),
      address = nullif(payload->>'direccion', ''),
      email = nullif(payload->>'correo', '')
  where id = target_order_id and status <> 'pagado';

  if not found then
    raise exception 'La orden no existe o ya fue pagada.';
  end if;

  delete from public.service_order_items
  where order_id = target_order_id
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(payload->'itemsTaller', '[]'::jsonb)) as supplied(item)
      where supplied.item->>'idItem' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and (supplied.item->>'idItem')::uuid = service_order_items.id
    );

  for order_item in
    select value from jsonb_array_elements(coalesce(payload->'itemsTaller', '[]'::jsonb))
  loop
    if order_item->>'idItem' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      item_id := (order_item->>'idItem')::uuid;
      update public.service_order_items
      set description = trim(order_item->>'descripcion'),
          quantity = (order_item->>'cantidad')::numeric,
          unit_price = (order_item->>'precio')::numeric,
          item_type = case when order_item->>'tipo' = 'Servicio' then 'Servicio' else 'Producto' end
      where id = item_id and order_id = target_order_id;
      if not found then
        raise exception 'No se encontró un ítem de la orden.';
      end if;
    else
      insert into public.service_order_items (
        order_id, description, quantity, unit_price, item_type, created_by
      )
      values (
        target_order_id,
        trim(order_item->>'descripcion'),
        (order_item->>'cantidad')::numeric,
        (order_item->>'precio')::numeric,
        case when order_item->>'tipo' = 'Servicio' then 'Servicio' else 'Producto' end,
        auth.uid()
      );
    end if;
  end loop;
end;
$$;

create or replace function public.transition_service_order(target_order_id uuid, target_status text)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if target_status not in ('taller', 'listo', 'pagado') then
    raise exception 'Estado de orden no válido.';
  end if;

  update public.service_orders
  set status = target_status,
      paid_at = case when target_status = 'pagado' then now() else null end
  where id = target_order_id;

  if not found then
    raise exception 'La orden no existe o tu perfil no puede cambiar su estado.';
  end if;
end;
$$;

grant usage on schema public to authenticated;
grant select on public.profiles, public.service_orders, public.service_order_items, public.service_order_events to authenticated;
grant insert, update on public.service_orders to authenticated;
grant insert, update, delete on public.service_order_items to authenticated;
revoke all on function public.current_profile_role() from public, anon;
revoke all on function public.create_service_order(jsonb) from public, anon;
revoke all on function public.update_service_order_recount(jsonb) from public, anon;
revoke all on function public.transition_service_order(uuid, text) from public, anon;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.create_service_order(jsonb) to authenticated;
grant execute on function public.update_service_order_recount(jsonb) to authenticated;
grant execute on function public.transition_service_order(uuid, text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'service_orders'
  ) then
    alter publication supabase_realtime add table public.service_orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'service_order_items'
  ) then
    alter publication supabase_realtime add table public.service_order_items;
  end if;
end;
$$;
