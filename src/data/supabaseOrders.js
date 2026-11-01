import { supabase } from "../lib/supabase.js";

const statusToDatabase = {
  "En Patio": "patio",
  "En Taller": "taller",
  "Listo para Cierre": "listo",
  "Listo para Facturación": "listo",
  Pagado: "pagado",
};

const statusFromDatabase = {
  patio: "En Patio",
  taller: "En Taller",
  listo: "Listo para Facturación",
  pagado: "Listo para Facturación",
};

function assertSupabase() {
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }
}

function mapOrder(row) {
  return {
    id: row.id,
    placa: row.plate,
    cliente: row.customer_name,
    telefono: row.phone || "",
    documentoCliente: row.customer_document || "",
    vehiculo: row.vehicle || "",
    direccion: row.address || "",
    correo: row.email || "",
    recibidoPor: row.received_by || "",
    mecanico: row.mechanic_name || "",
    fechaIngreso: row.date_received,
    nota: row.note || "",
    estadoMecanico: statusFromDatabase[row.status],
    estadoFacturacion: row.status === "pagado" ? "Pagado" : "Pendiente de Cobro",
    fechaPago: row.paid_at,
    itemsTaller: (row.service_order_items || []).map((item) => ({
      idItem: item.id,
      descripcion: item.description,
      cantidad: Number(item.quantity),
      precio: Number(item.unit_price),
      tipo: item.item_type,
    })),
  };
}

function mapOrderPayload(order) {
  return {
    placa: order.placa,
    cliente: order.cliente,
    telefono: order.telefono === "N/A" ? "" : order.telefono,
    documentoCliente: order.documentoCliente,
    vehiculo: order.vehiculo,
    direccion: order.direccion,
    correo: order.correo,
    recibidoPor: order.recibidoPor,
    mecanico: order.mecanico,
    fechaIngreso: order.fechaIngreso,
    nota: order.nota,
    estadoMecanico: order.estadoMecanico,
    itemsTaller: order.itemsTaller.map((item) => ({
      idItem: item.idItem,
      descripcion: item.descripcion,
      cantidad: Number(item.cantidad),
      precio: Number(item.precio),
      tipo: item.tipo || "Producto",
    })),
  };
}

export async function fetchServiceOrders() {
  assertSupabase();
  const { data, error } = await supabase
    .from("service_orders")
    .select("*, service_order_items(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapOrder);
}

export async function createServiceOrder(order) {
  assertSupabase();
  const { data, error } = await supabase.rpc("create_service_order", {
    payload: mapOrderPayload(order),
  });

  if (error) throw error;
  return data;
}

export async function addServiceOrderItem(orderId, item) {
  assertSupabase();
  const { error } = await supabase.from("service_order_items").insert({
    order_id: orderId,
    description: item.descripcion,
    quantity: Number(item.cantidad),
    unit_price: Number(item.precio),
    item_type: item.tipo || "Producto",
  });

  if (error) throw error;
}

export async function updateServiceOrderStatus(orderId, status) {
  assertSupabase();
  const { error } = await supabase.rpc("transition_service_order", {
    target_order_id: orderId,
    target_status: statusToDatabase[status],
  });

  if (error) throw error;
}

export async function saveServiceOrderSummary(orderId, changes) {
  assertSupabase();
  const { error } = await supabase.rpc("update_service_order_recount", {
    payload: {
      id: orderId,
      ...mapOrderPayload({ ...changes, itemsTaller: changes.itemsTaller }),
    },
  });

  if (error) throw error;
}

export function subscribeToServiceOrders(onChange) {
  assertSupabase();
  return supabase
    .channel("service-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "service_orders" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "service_order_items" }, onChange)
    .subscribe();
}

export function removeServiceOrdersSubscription(channel) {
  if (channel && supabase) supabase.removeChannel(channel);
}

export { mapOrderPayload };
