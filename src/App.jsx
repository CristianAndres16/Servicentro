import { useEffect, useState } from "react";
import { initialOrders } from "./data/orders.js";
import { catalogItems } from "./data/catalog.js";
import ConnectionStatus from "./components/ConnectionStatus.jsx";
import ProductForm from "./components/ProductForm.jsx";
import StatusMessage from "./components/StatusMessage.jsx";
import {
  addServiceOrderItem,
  createServiceOrder,
  fetchServiceOrders,
  removeServiceOrdersSubscription,
  saveServiceOrderSummary,
  subscribeToServiceOrders,
  updateServiceOrderStatus,
} from "./data/supabaseOrders.js";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";
import "./App.css";

const receptionServices = [
  "Sencilla", "Motor en seco", "Brillada", "Engrase", "Combustible", "Aceite",
  "Filtro de aceite", "Filtro de aire", "Filtro de gasolina",
  "Filtro de aire acondicionado", "Aceite de caja", "Alineación", "Balanceo",
  "Llantas", "Reparación de llantas", "Rotación", "Líquido de frenos",
  "Taller mecánico",
];

const profiles = {
  patio: { label: "Recepción · Patio" },
  mecanico: { label: "Taller · Mecánico" },
  facturacion: { label: "Recuento y facturación" },
  historial: { label: "Historial de servicios" },
};

const ordersStorageKey = "servicentro-orders-v1";

function readOrdersFromStorage() {
  try {
    const savedOrders = window.localStorage.getItem(ordersStorageKey);
    if (!savedOrders) return { orders: initialOrders, canSave: true, error: null };

    const parsedOrders = JSON.parse(savedOrders);
    if (!Array.isArray(parsedOrders) || parsedOrders.some(
      (order) => !order || !Array.isArray(order.itemsTaller),
    )) {
      throw new Error("El formato guardado no es válido.");
    }

    return { orders: parsedOrders, canSave: true, error: null };
  } catch (error) {
    console.error("No se pudo leer el historial local de la serviteca.", error);
    return {
      orders: initialOrders,
      canSave: false,
      error: "No pudimos leer el historial guardado en este dispositivo. Los cambios de esta sesión no se sincronizarán.",
    };
  }
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString("es-CO")}`;
}

function orderTotal(order) {
  return order.itemsTaller.reduce(
    (total, item) => total + Number(item.precio) * Number(item.cantidad),
    0,
  );
}

function OrderStatus({ order }) {
  const isReady = ["Listo para Cierre", "Listo para Facturación"].includes(order.estadoMecanico);
  const label = isReady
    ? "Listo para recuento"
    : order.estadoMecanico === "En Patio" ? "En patio" : "En taller";

  return (
    <span className={`status-badge ${isReady ? "status-ready" : "status-progress"}`}>
      {label}
    </span>
  );
}

function InvoicePreview({ order, onClose }) {
  return (
    <div className="modal-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="invoice-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
        <div className="invoice-heading">
          <span className="brand-mark" aria-hidden="true">P</span>
          <div>
            <h2 id="invoice-title">PRIMAX SERVITECA</h2>
            <p>Recuento de servicios y productos</p>
            <small>Documento de cobro · No es factura electrónica</small>
          </div>
        </div>
        <h3 className="invoice-title">Orden de servicio</h3>
        <dl className="invoice-details">
          <div><dt>Placa</dt><dd>{order.placa}</dd></div>
          <div><dt>Cliente</dt><dd>{order.cliente}</dd></div>
          {order.documentoCliente && <div><dt>C.C. / NIT</dt><dd>{order.documentoCliente}</dd></div>}
          {order.vehiculo && <div><dt>Vehículo</dt><dd>{order.vehiculo}</dd></div>}
          <div><dt>Teléfono</dt><dd>{order.telefono || "No registrado"}</dd></div>
          <div><dt>Fecha de ingreso</dt><dd>{order.fechaIngreso}</dd></div>
          {order.recibidoPor && <div><dt>Recibido por</dt><dd>{order.recibidoPor}</dd></div>}
        </dl>
        <div className="invoice-table-wrap">
          <table className="invoice-table">
            <thead><tr><th>Trabajo / producto</th><th>Cant.</th><th>Valor unitario</th><th>Subtotal</th></tr></thead>
            <tbody>
              {order.itemsTaller.map((item) => (
                <tr key={item.idItem}>
                  <td>{item.descripcion}</td>
                  <td>{item.cantidad}</td>
                  <td>{formatCurrency(item.precio)}</td>
                  <td>{formatCurrency(item.precio * item.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {order.nota && <p className="invoice-note"><strong>Observaciones:</strong> {order.nota}</p>}
        <div className="invoice-total">
          <span>Total para pagar en caja</span>
          <strong>{formatCurrency(orderTotal(order))}</strong>
        </div>
        <div className="invoice-actions">
          <button className="outline-button" type="button" onClick={onClose}>Cerrar</button>
          <button className="primary-button" type="button" onClick={() => window.print()}>
            Imprimir / Guardar PDF
          </button>
        </div>
      </section>
    </div>
  );
}

function OrderSummaryEditor({ order, onSave, onCancel }) {
  const [cliente, setCliente] = useState(order.cliente);
  const [telefono, setTelefono] = useState(order.telefono || "");
  const [documentoCliente, setDocumentoCliente] = useState(order.documentoCliente || "");
  const [vehiculo, setVehiculo] = useState(order.vehiculo || "");
  const [direccion, setDireccion] = useState(order.direccion || "");
  const [correo, setCorreo] = useState(order.correo || "");
  const [items, setItems] = useState(order.itemsTaller.map((item) => ({ ...item })));
  const [error, setError] = useState("");

  function updateItem(itemId, key, value) {
    setItems((currentItems) => currentItems.map((item) => (
      item.idItem === itemId ? { ...item, [key]: value } : item
    )));
  }

  function handleSave(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedItems = items.map((item, index) => ({
      ...item,
      descripcion: String(formData.get(`descripcion-${index}`) || "").trim(),
      cantidad: Number(formData.get(`cantidad-${index}`)),
      precio: Number(formData.get(`precio-${index}`)),
    }));
    const validItems = updatedItems.every((item) =>
      item.descripcion.trim() && Number(item.cantidad) > 0 &&
      Number.isFinite(Number(item.precio)) && Number(item.precio) >= 0,
    );
    if (!cliente.trim() || updatedItems.length === 0 || !validItems) {
      setError("Revisa el cliente y confirma que cada ítem tenga descripción, cantidad y valor válidos.");
      return;
    }
    onSave({
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      documentoCliente: documentoCliente.trim(),
      vehiculo: vehiculo.trim(),
      direccion: direccion.trim(),
      correo: correo.trim(),
      itemsTaller: updatedItems,
    });
  }

  return (
    <form className="summary-editor" onSubmit={handleSave}>
      <div className="summary-editor-fields">
        <label>Cliente<input value={cliente} onChange={(event) => setCliente(event.target.value)} required /></label>
        <label>Teléfono<input value={telefono} onChange={(event) => setTelefono(event.target.value)} /></label>
        <label>C.C. / NIT<input value={documentoCliente} onChange={(event) => setDocumentoCliente(event.target.value)} /></label>
        <label>Vehículo<input value={vehiculo} onChange={(event) => setVehiculo(event.target.value)} /></label>
        <label>Dirección<input value={direccion} onChange={(event) => setDireccion(event.target.value)} /></label>
        <label>Correo<input type="email" value={correo} onChange={(event) => setCorreo(event.target.value)} /></label>
      </div>
      <div className="summary-editor-list">
        {items.map((item, index) => (
          <div className="summary-editor-row" key={item.idItem}>
            <label>Trabajo o producto
              <input name={`descripcion-${index}`} value={item.descripcion} onChange={(event) => updateItem(item.idItem, "descripcion", event.target.value)} required />
            </label>
            <label>Cantidad
              <input name={`cantidad-${index}`} type="number" min="1" step="1" value={item.cantidad} onChange={(event) => updateItem(item.idItem, "cantidad", event.target.value)} required />
            </label>
            <label>Valor unitario
              <input name={`precio-${index}`} type="number" min="0" step="100" value={item.precio} onChange={(event) => updateItem(item.idItem, "precio", event.target.value)} required />
            </label>
            <button
              className="remove-item-button"
              type="button"
              onClick={() => setItems((currentItems) => currentItems.filter((currentItem) => currentItem.idItem !== item.idItem))}
              aria-label={`Quitar ${item.descripcion}`}
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
      {error && <StatusMessage type="error" message={error} />}
      <div className="summary-editor-actions">
        <button className="outline-button" type="button" onClick={onCancel}>Cancelar</button>
        <button className="primary-button" type="submit">Guardar recuento</button>
      </div>
    </form>
  );
}

function OrderQueue({ orders, role, onAddActivity, onUpdateStatus }) {
  if (orders.length === 0) {
    return (
      <div className="queue-empty">
        <span aria-hidden="true">{role === "patio" ? "🚘" : "🔧"}</span>
        <h3>{role === "patio" ? "Todo despejado" : "No hay vehículos en espera"}</h3>
        <p>{role === "patio" ? "Los vehículos recibidos aparecerán aquí." : "Las órdenes enviadas desde patio aparecerán aquí."}</p>
      </div>
    );
  }

  return (
    <div className="queue-order-list">
      {orders.map((order) => (
        <article className="queue-order-card" key={order.id}>
          <div className="queue-order-heading">
            <div className="queue-plate">
              <span aria-hidden="true">{role === "patio" ? "🚘" : "🔧"}</span>
              <div><strong>{order.placa}</strong><small>{order.cliente} · {order.telefono}</small></div>
            </div>
            <OrderStatus order={order} />
          </div>
          <div className="queue-order-details">
            {order.itemsTaller.length ? (
              <ul className="invoice-item-list">
                {order.itemsTaller.map((item) => (
                  <li key={item.idItem}><span>{item.descripcion} <small>× {item.cantidad}</small></span></li>
                ))}
              </ul>
            ) : <p className="no-activities">Aún no se han registrado trabajos.</p>}
            {order.nota && <p className="order-note"><strong>Observaciones:</strong> {order.nota}</p>}
          </div>
          <div className="queue-order-actions">
            <ProductForm
              onAddItem={(item) => onAddActivity(order, item)}
              title={role === "patio" ? "Registrar otro servicio o producto" : "Añadir trabajo o repuesto"}
              description={role === "patio" ? "Anota lo atendido en patio, incluso si luego requiere taller." : "Ve dejando el detalle de lo que vas haciendo."}
              submitLabel="Añadir al recuento"
            />
            {role === "patio" ? (
              <div className="queue-next-actions">
                <button className="outline-button" type="button" onClick={() => onUpdateStatus(order.id, "En Taller")}>Enviar al taller</button>
                <button className="success-button" type="button" onClick={() => onUpdateStatus(order.id, "Listo para Facturación")}>Servicio terminado</button>
              </div>
            ) : (
              <button className="success-button mechanic-close-button" type="button" onClick={() => onUpdateStatus(order.id, "Listo para Facturación")}>
                ✓ Terminar y enviar a recuento
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(normalizedUsername)) {
      setError("El usuario debe tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: `${normalizedUsername}@servicentro.com`,
        password,
      });
      if (loginError) setError("No fue posible iniciar sesión. Revisa tu usuario y contraseña.");
    } catch (loginError) {
      setError(`No se pudo conectar con Supabase: ${loginError.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="brand-mark" aria-hidden="true">P</span>
        <p className="section-eyebrow">PRIMAX SERVITECA</p>
        <h1>Iniciar sesión</h1>
        <p>Ingresa el usuario y la contraseña asignados para tu área de trabajo.</p>
        <form onSubmit={handleSubmit}>
          <label>Usuario
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength="3"
              maxLength="32"
              pattern="[A-Za-z0-9._-]+"
              autoCapitalize="none"
              spellCheck="false"
              required
            />
          </label>
          <label>Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <StatusMessage type="error" message={error} />}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Ingresando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AccessIssueScreen({ onSignOut, message }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="brand-mark" aria-hidden="true">P</span>
        <p className="section-eyebrow">PRIMAX SERVITECA</p>
        <h1>Acceso pendiente</h1>
        <p>Tu usuario aún no tiene un perfil activo. Solicita al administrador que lo habilite en Supabase.</p>
        {message && <StatusMessage type="error" message={message} />}
        <button className="outline-button" type="button" onClick={onSignOut}>Cerrar sesión</button>
      </section>
    </main>
  );
}

function App() {
  const [initialStore] = useState(() => isSupabaseConfigured
    ? { orders: [], canSave: false, error: null }
    : readOrdersFromStorage());
  const [orders, setOrders] = useState(isSupabaseConfigured ? [] : initialStore.orders);
  const [role, setRole] = useState("patio");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(isSupabaseConfigured);
  const [showHistory, setShowHistory] = useState(false);
  const [plate, setPlate] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [note, setNote] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [directToWorkshop, setDirectToWorkshop] = useState(false);
  const [status, setStatus] = useState(initialStore.error
    ? { type: "error", message: initialStore.error }
    : null);
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const sessionUserId = session?.user?.id;

  useEffect(() => {
    if (isSupabaseConfigured || !initialStore.canSave) return;
    try {
      window.localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
    } catch (error) {
      console.error("No se pudo guardar el historial local de la serviteca.", error);
    }
  }, [orders, initialStore.canSave]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setProfile(null);
      setProfileLoading(Boolean(nextSession));
      if (!nextSession) setOrders([]);
      setStatus(null);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setStatus({ type: "error", message: `No se pudo recuperar la sesión: ${error.message}` });
      }
      setSession(data.session);
      setAuthLoading(false);
      setProfileLoading(Boolean(data.session));
    }).catch((error) => {
      if (!active) return;
      setStatus({ type: "error", message: `No se pudo conectar con Supabase: ${error.message}` });
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !sessionUserId) return undefined;

    let active = true;
    let channel;
    async function loadProfileAndOrders() {
      setProfileLoading(true);
      try {
        const { data: userProfile, error } = await supabase
          .from("profiles")
          .select("id, full_name, role, active")
          .eq("id", sessionUserId)
          .eq("active", true)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;
        setProfile(userProfile);
        if (!userProfile) {
          setOrders([]);
          setStatus({ type: "error", message: "La cuenta inició sesión, pero todavía no tiene un perfil activo asignado." });
          return;
        }

        setRole(userProfile.role);
        setStatus(null);
        setOrders(await fetchServiceOrders());
        channel = subscribeToServiceOrders(async () => {
          try {
            const latestOrders = await fetchServiceOrders();
            if (active) setOrders(latestOrders);
          } catch (error) {
            if (active) setStatus({ type: "error", message: `No se pudo actualizar la lista compartida: ${error.message}` });
          }
        });
      } catch (error) {
        if (active) {
          setProfile(null);
          setStatus({ type: "error", message: `No se pudieron cargar los datos de Supabase: ${error.message}` });
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadProfileAndOrders();
    return () => {
      active = false;
      removeServiceOrdersSubscription(channel);
    };
  }, [sessionUserId]);

  const currentProfile = profiles[role];
  const showingHistory = role === "historial" || (isSupabaseConfigured && role === "facturacion" && showHistory);
  const currentOrders = orders.filter((order) => {
    if (order.estadoFacturacion === "Pagado") return false;
    if (role === "patio") return order.estadoMecanico === "En Patio";
    if (role === "mecanico") return order.estadoMecanico === "En Taller";
    if (role === "facturacion") return true;
    return false;
  });
  const archivedOrders = orders
    .filter((order) => order.estadoFacturacion === "Pagado")
    .filter((order) => `${order.placa} ${order.cliente} ${order.telefono} ${order.fechaIngreso} ${order.itemsTaller.map((item) => item.descripcion).join(" ")}`
      .toLowerCase()
      .includes(historySearch.trim().toLowerCase()));
  const activeRecountOrders = orders.filter((order) => order.estadoFacturacion !== "Pagado");
  const invoiceOrder = orders.find((order) => order.id === invoiceOrderId);

  async function handleCreateOrder(event) {
    event.preventDefault();
    if (!plate.trim() || !customer.trim()) {
      setStatus({ type: "error", message: "Escribe la placa y el nombre del cliente para recibir el vehículo." });
      return;
    }
    if (selectedServices.length === 0 && !directToWorkshop) {
      setStatus({ type: "error", message: "Marca los servicios solicitados o indica que el vehículo va directamente al taller." });
      return;
    }

    const selectedItems = selectedServices.map((name, index) => {
      const catalogItem = catalogItems.find((item) => item.name === name);
      return {
        idItem: `${Date.now()}-${index}`,
        descripcion: name,
        cantidad: 1,
        precio: catalogItem?.price ?? 0,
        tipo: "Servicio",
      };
    });
    const newOrder = {
      id: Date.now(),
      placa: plate.trim().toUpperCase(),
      cliente: customer.trim(),
      telefono: phone.trim() || "N/A",
      documentoCliente: documentId.trim(),
      vehiculo: vehicle.trim(),
      direccion: address.trim(),
      correo: email.trim(),
      recibidoPor: receivedBy.trim(),
      mecanico: mechanic.trim() || "Por asignar",
      fechaIngreso: new Date().toISOString().slice(0, 10),
      nota: note.trim(),
      itemsTaller: selectedItems,
      estadoMecanico: directToWorkshop ? "En Taller" : "En Patio",
      estadoFacturacion: "Pendiente de Cobro",
    };

    try {
      if (isSupabaseConfigured) {
        await createServiceOrder(newOrder);
        setOrders(await fetchServiceOrders());
      } else {
        setOrders((currentOrders) => [newOrder, ...currentOrders]);
      }
    } catch (error) {
      setStatus({ type: "error", message: `No se pudo guardar la orden: ${error.message}` });
      return;
    }
    setPlate("");
    setCustomer("");
    setPhone("");
    setMechanic("");
    setDocumentId("");
    setVehicle("");
    setAddress("");
    setEmail("");
    setReceivedBy("");
    setNote("");
    setSelectedServices([]);
    setDirectToWorkshop(false);
    setStatus({
      type: "success",
      message: directToWorkshop
        ? `Vehículo ${newOrder.placa} recibido y enviado directamente al taller.`
        : `Vehículo ${newOrder.placa} recibido en patio.`,
    });
  }

  async function addActivity(order, item) {
    const allowed = (role === "patio" && order.estadoMecanico === "En Patio") ||
      (role === "mecanico" && order.estadoMecanico === "En Taller");
    if (!allowed) {
      setStatus({ type: "error", message: "Esta etapa ya terminó; el detalle solo puede corregirse desde Recuento y facturación." });
      return false;
    }
    const activity = {
      idItem: `${order.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      descripcion: item.descripcion.trim(),
      cantidad: Number(item.cantidad),
      precio: Number(item.precio),
      tipo: item.tipo || "Producto",
    };
    try {
      if (isSupabaseConfigured) {
        await addServiceOrderItem(order.id, activity);
        setOrders(await fetchServiceOrders());
      } else {
        setOrders((currentOrders) => currentOrders.map((currentOrder) => (
          currentOrder.id === order.id
            ? { ...currentOrder, itemsTaller: [...currentOrder.itemsTaller, activity] }
            : currentOrder
        )));
      }
    } catch (error) {
      setStatus({ type: "error", message: `No se pudo agregar el ítem: ${error.message}` });
      return false;
    }
    setStatus({ type: "success", message: `${activity.descripcion} agregado a la orden ${order.placa}.` });
    return true;
  }

  async function updateOrderStatus(orderId, statusValue) {
    try {
      if (isSupabaseConfigured) {
        await updateServiceOrderStatus(orderId, statusValue);
        setOrders(await fetchServiceOrders());
      } else {
        setOrders((currentOrders) => currentOrders.map((order) => (
          order.id === orderId ? { ...order, estadoMecanico: statusValue } : order
        )));
      }
    } catch (error) {
      setStatus({ type: "error", message: `No se pudo actualizar la etapa de la orden: ${error.message}` });
      return;
    }
    setStatus({
      type: "success",
      message: statusValue === "En Taller"
        ? "Vehículo enviado al taller; ya aparece en la vista del mecánico."
        : "Servicio terminado; la orden ya aparece en Recuento y facturación.",
    });
  }

  async function saveOrderSummary(orderId, changes) {
    try {
      if (isSupabaseConfigured) {
        await saveServiceOrderSummary(orderId, changes);
        setOrders(await fetchServiceOrders());
      } else {
        setOrders((currentOrders) => currentOrders.map((order) => (
          order.id === orderId ? { ...order, ...changes } : order
        )));
      }
    } catch (error) {
      setStatus({ type: "error", message: `No se pudo guardar el recuento: ${error.message}` });
      return;
    }
    setEditingOrderId(null);
    setStatus({ type: "success", message: "Recuento actualizado. Ya puedes imprimir o guardar el PDF." });
  }

  async function markPaid(orderId) {
    const order = orders.find((currentOrder) => currentOrder.id === orderId);
    if (
      role !== "facturacion" ||
      !order ||
      !["Listo para Cierre", "Listo para Facturación"].includes(order.estadoMecanico) ||
      order.estadoFacturacion === "Pagado"
    ) {
      setStatus({ type: "error", message: "Solo se puede retirar a historial una orden terminada y pendiente de pago." });
      return;
    }
    try {
      if (isSupabaseConfigured) {
        await updateServiceOrderStatus(orderId, "Pagado");
        setOrders(await fetchServiceOrders());
      } else {
        setOrders((currentOrders) => currentOrders.map((order) => (
          order.id === orderId
            ? { ...order, estadoFacturacion: "Pagado", fechaPago: new Date().toISOString() }
            : order
        )));
      }
    } catch (error) {
      setStatus({ type: "error", message: `No se pudo registrar el pago: ${error.message}` });
      return;
    }
    setStatus({ type: "success", message: "Pago registrado. La orden se conserva en el historial y salió de las listas activas." });
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setStatus({ type: "error", message: `No se pudo cerrar la sesión: ${error.message}` });
  }

  if (isSupabaseConfigured && authLoading) {
    return <main className="auth-page"><p role="status">Conectando con Supabase…</p></main>;
  }
  if (isSupabaseConfigured && !session) return <LoginScreen />;
  if (isSupabaseConfigured && profileLoading) {
    return <main className="auth-page"><p role="status">Cargando perfil y órdenes…</p></main>;
  }
  if (isSupabaseConfigured && !profile) {
    return <AccessIssueScreen onSignOut={signOut} message={status?.message} />;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#inicio" aria-label="Primax Serviteca, inicio">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-copy"><strong>Primax Serviteca</strong><small>ÓRDENES Y SERVICIOS</small></span>
          </a>
          <div className="header-controls">
            <ConnectionStatus />
            {isSupabaseConfigured ? (
              <>
                <span className="signed-in-user">{profile.full_name} · {currentProfile.label}</span>
                {role === "facturacion" && (
                  <button className="outline-button" type="button" onClick={() => {
                    setShowHistory((visible) => !visible);
                    setEditingOrderId(null);
                    setStatus(null);
                  }}>
                    {showHistory ? "Ver activas" : "Historial"}
                  </button>
                )}
                <button className="outline-button" type="button" onClick={signOut}>Cerrar sesión</button>
              </>
            ) : (
              <label className="role-switcher"><span>Área (demo)</span>
                <select value={role} onChange={(event) => {
                  setRole(event.target.value);
                  setShowHistory(false);
                  setStatus(null);
                  setEditingOrderId(null);
                }}>
                  {Object.entries(profiles).map(([key, profileOption]) => (
                    <option key={key} value={key}>{profileOption.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard app-dashboard" id="inicio">
        {!isSupabaseConfigured && (
          <div className="demo-banner">
            Modo demostración: los perfiles y las órdenes solo se guardan en este dispositivo.
            Configura Supabase para habilitar inicio de sesión y datos compartidos.
          </div>
        )}
        <section className="module-heading">
          <div>
            <span className="section-eyebrow">SERVITECA · {(showingHistory ? profiles.historial.label : currentProfile.label).toUpperCase()}</span>
            <h1>
              {showingHistory && "Historial de servicios"}
              {role === "patio" && "Recibir un vehículo"}
              {role === "mecanico" && "Trabajo del taller"}
              {role === "facturacion" && !showHistory && "Recuento y facturación"}
            </h1>
            <p>
              {showingHistory && "Busca órdenes pagadas y consulta qué servicios y productos se registraron para cada vehículo."}
              {role === "patio" && "Registra lo que solicita el cliente. Si viene para mecánica, envíalo directamente al taller."}
              {role === "mecanico" && "Consulta lo solicitado y registra cada trabajo o repuesto que se vaya usando."}
              {role === "facturacion" && !showHistory && "Revisa el detalle, corrige el recuento y prepara el documento para caja."}
            </p>
          </div>
          <span className="module-step">
            {showingHistory ? "04" : role === "patio" ? "01" : role === "mecanico" ? "02" : "03"}
            <span> / 04</span>
          </span>
        </section>

        {role === "facturacion" && !showHistory && (
          <section className="metrics-grid invoice-metrics" aria-label="Resumen de órdenes">
            <article className="metric-card"><span className="metric-icon metric-blue" aria-hidden="true">▤</span><div><p>Órdenes recibidas</p><strong>{orders.length}</strong></div></article>
            <article className="metric-card"><span className="metric-icon metric-amber" aria-hidden="true">◷</span><div><p>Esperando recuento</p><strong>{orders.filter((order) => ["Listo para Cierre", "Listo para Facturación"].includes(order.estadoMecanico) && order.estadoFacturacion !== "Pagado").length}</strong></div></article>
            <article className="metric-card"><span className="metric-icon metric-green" aria-hidden="true">$</span><div><p>Pagos registrados</p><strong>{orders.filter((order) => order.estadoFacturacion === "Pagado").length}</strong></div></article>
          </section>
        )}

        <StatusMessage type={status?.type} message={status?.message} />

        {role === "patio" && (
          <div className="module-layout patio-layout">
            <section className="module-card reception-card">
              <div className="module-card-heading">
                <span className="module-icon" aria-hidden="true">🚘</span>
                <div><h2>Datos de recepción</h2><p>Campos básicos para abrir la orden.</p></div>
              </div>
              <form onSubmit={handleCreateOrder}>
                <div className="reception-fields">
                  <label>Placa *
                    <input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="Ej. BFX-228" required />
                  </label>
                  <label>Nombre del cliente *
                    <input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Nombre completo" required />
                  </label>
                  <label>Teléfono
                    <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Número de contacto" />
                  </label>
                  <label>Mecánico (si ya está asignado)
                    <input value={mechanic} onChange={(event) => setMechanic(event.target.value)} placeholder="Nombre del mecánico" />
                  </label>
                </div>
                <details className="optional-reception-fields">
                  <summary>Más datos (opcionales): documento, vehículo y contacto</summary>
                  <div className="reception-fields optional-fields-grid">
                    <label>C.C. / NIT del cliente
                      <input value={documentId} onChange={(event) => setDocumentId(event.target.value)} placeholder="Documento de identidad" />
                    </label>
                    <label>Vehículo
                      <input value={vehicle} onChange={(event) => setVehicle(event.target.value)} placeholder="Marca, modelo o color" />
                    </label>
                    <label>Dirección
                      <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Dirección del cliente" />
                    </label>
                    <label>Correo
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="cliente@correo.com" />
                    </label>
                    <label>Recibido por
                      <input value={receivedBy} onChange={(event) => setReceivedBy(event.target.value)} placeholder="Nombre de quien recibe" />
                    </label>
                  </div>
                </details>
                <fieldset className="reception-service-fieldset">
                  <legend>¿Qué servicios solicita?</legend>
                  <div className="reception-service-grid">
                    {receptionServices.map((service) => (
                      <label className="reception-service-option" key={service}>
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service)}
                          onChange={(event) => setSelectedServices((currentServices) => (
                            event.target.checked
                              ? [...currentServices, service]
                              : currentServices.filter((currentService) => currentService !== service)
                          ))}
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="direct-workshop-option">
                  <input type="checkbox" checked={directToWorkshop} onChange={(event) => setDirectToWorkshop(event.target.checked)} />
                  <span><strong>Va directamente al taller</strong><small>Para trabajos mecánicos sin servicios previos de patio.</small></span>
                </label>
                <label className="reception-note-field">Observaciones
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Detalles importantes del vehículo o lo solicitado por el cliente" rows="3" />
                </label>
                <button className="primary-button reception-submit" type="submit">Crear orden de servicio <span aria-hidden="true">→</span></button>
              </form>
            </section>
            <section className="module-card work-queue">
              <div className="module-card-heading queue-heading">
                <span className="module-icon patio-icon" aria-hidden="true">◷</span>
                <div><h2>Vehículos en patio</h2><p>Agrega lo realizado o envía el vehículo al taller.</p></div>
                <span className="count-badge">{currentOrders.length}</span>
              </div>
              <OrderQueue orders={currentOrders} role={role} onAddActivity={addActivity} onUpdateStatus={updateOrderStatus} />
            </section>
          </div>
        )}

        {role === "mecanico" && (
          <section className="module-card work-queue mechanic-queue">
            <div className="module-card-heading queue-heading">
              <span className="module-icon mechanic-icon" aria-hidden="true">🔧</span>
              <div><h2>Órdenes en taller</h2><p>Registra los trabajos realizados y repuestos utilizados.</p></div>
              <span className="count-badge">{currentOrders.length}</span>
            </div>
            <OrderQueue orders={currentOrders} role={role} onAddActivity={addActivity} onUpdateStatus={updateOrderStatus} />
          </section>
        )}

        {role === "facturacion" && !showHistory && (
          <section className="module-card recuento-queue">
            <div className="module-card-heading queue-heading">
              <span className="module-icon invoice-icon" aria-hidden="true">$</span>
              <div><h2>Órdenes de servicio</h2><p>Detalle completo de patio y taller, listo para revisión y cobro.</p></div>
              <span className="count-badge">{activeRecountOrders.length}</span>
            </div>
            {activeRecountOrders.length === 0 ? <p className="empty-state">No hay órdenes pendientes. Los servicios pagados están en Historial.</p> : (
              <div className="invoice-order-list">
                {activeRecountOrders.map((order) => (
                  <article className="invoice-order-card" key={order.id}>
                    <div className="invoice-order-heading">
                      <div>
                        <span className="panel-kicker">ORDEN · {order.fechaIngreso}</span>
                        <h3>{order.placa} <span>·</span> {order.cliente}</h3>
                        <p>
                          Tel. {order.telefono || "No registrado"}
                          {order.documentoCliente && <> <span>·</span> C.C. / NIT: {order.documentoCliente}</>}
                          {order.vehiculo && <> <span>·</span> {order.vehiculo}</>}
                          <span> · </span>Mecánico: {order.mecanico || "Por asignar"}
                        </p>
                      </div>
                      <div className="invoice-order-status">
                        <OrderStatus order={order} />
                        <span className={`status-badge ${order.estadoFacturacion === "Pagado" ? "status-ready" : "status-pending"}`}>{order.estadoFacturacion}</span>
                      </div>
                    </div>
                    {editingOrderId === order.id ? (
                      <OrderSummaryEditor
                        key={order.id}
                        order={order}
                        onSave={(changes) => saveOrderSummary(order.id, changes)}
                        onCancel={() => setEditingOrderId(null)}
                      />
                    ) : (
                      <>
                        <ul className="invoice-item-list">
                          {order.itemsTaller.map((item) => (
                            <li key={item.idItem}><span>{item.descripcion} <small>× {item.cantidad}</small></span><strong>{formatCurrency(item.precio * item.cantidad)}</strong></li>
                          ))}
                        </ul>
                        {order.nota && <p className="order-note"><strong>Observaciones:</strong> {order.nota}</p>}
                        <div className="invoice-order-footer">
                          <div className="sales-total"><small>Total del servicio</small><strong>{formatCurrency(orderTotal(order))}</strong></div>
                          <div className="invoice-order-actions">
                            <button className="outline-button" type="button" onClick={() => setEditingOrderId(order.id)}>Editar recuento</button>
                            <button className="outline-button" type="button" onClick={() => setInvoiceOrderId(order.id)}>Ver documento</button>
                            {order.estadoFacturacion !== "Pagado" && (
                              <button
                                className="primary-button"
                                type="button"
                                onClick={() => markPaid(order.id)}
                                disabled={!["Listo para Cierre", "Listo para Facturación"].includes(order.estadoMecanico)}
                                title={["En Taller", "En Patio"].includes(order.estadoMecanico) ? "El servicio debe terminar antes de registrar el pago." : undefined}
                              >
                                Registrar pago
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {showingHistory && (
          <section className="module-card history-queue">
            <div className="module-card-heading queue-heading">
              <span className="module-icon history-icon" aria-hidden="true">⌕</span>
              <div>
                <h2>Servicios cerrados y pagados</h2>
                <p>Las órdenes se conservan para futuras consultas; no se borran al salir de las listas activas.</p>
              </div>
              <span className="count-badge">{archivedOrders.length} encontradas</span>
            </div>
            <label className="history-search">
              Buscar por placa, cliente, teléfono, fecha o trabajo
              <input
                type="search"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Ej. BFX-228 o cambio de aceite"
              />
            </label>
            {archivedOrders.length === 0 ? (
              <div className="queue-empty">
                <span aria-hidden="true">▤</span>
                <h3>{orders.some((order) => order.estadoFacturacion === "Pagado") ? "No hay coincidencias" : "Aún no hay servicios pagados"}</h3>
                <p>{orders.some((order) => order.estadoFacturacion === "Pagado") ? "Prueba con otra placa, cliente o descripción." : "Cuando caja registre un pago, la orden quedará guardada aquí."}</p>
              </div>
            ) : (
              <div className="invoice-order-list">
                {archivedOrders.map((order) => (
                  <article className="invoice-order-card history-order-card" key={order.id}>
                    <div className="invoice-order-heading">
                      <div>
                        <span className="panel-kicker">INGRESO · {order.fechaIngreso}</span>
                        <h3>{order.placa} <span>·</span> {order.cliente}</h3>
                        <p>
                          Tel. {order.telefono || "No registrado"}
                          {order.documentoCliente && <> <span>·</span> C.C. / NIT: {order.documentoCliente}</>}
                          {order.vehiculo && <> <span>·</span> {order.vehiculo}</>}
                        </p>
                      </div>
                      <div className="invoice-order-status">
                        <span className="status-badge status-ready">Pagado</span>
                        {order.fechaPago && (
                          <span className="history-paid-date">
                            {new Date(order.fechaPago).toLocaleDateString("es-CO")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="invoice-item-list">
                      {order.itemsTaller.map((item) => (
                        <li key={item.idItem}>
                          <span>{item.descripcion} <small>× {item.cantidad}</small></span>
                          <strong>{formatCurrency(item.precio * item.cantidad)}</strong>
                        </li>
                      ))}
                    </ul>
                    {order.nota && <p className="order-note"><strong>Observaciones:</strong> {order.nota}</p>}
                    <div className="invoice-order-footer">
                      <div className="sales-total">
                        <small>Total pagado</small>
                        <strong>{formatCurrency(orderTotal(order))}</strong>
                      </div>
                      <button className="outline-button" type="button" onClick={() => setInvoiceOrderId(order.id)}>
                        Consultar orden / imprimir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="site-footer app-footer">
          <span>Primax Serviteca · Orden de servicio digital</span>
          <small>Un mismo recuento para Patio, Taller y Caja</small>
        </footer>
      </main>
      {invoiceOrder && <InvoicePreview order={invoiceOrder} onClose={() => setInvoiceOrderId(null)} />}
    </div>
  );
}

export default App;
