import { useState } from "react";
import { initialOrders } from "./data/orders.js";
import "./App.css";

const quickServices = [
  { key: "lavadaSencilla", label: "Lavada sencilla" },
  { key: "brillada", label: "Brillada" },
  { key: "alineacion", label: "Alineación" },
  { key: "balanceo", label: "Balanceo" },
  { key: "cambioAceite", label: "Cambio de aceite" },
];

const emptyServices = {
  lavadaSencilla: false,
  brillada: false,
  alineacion: false,
  balanceo: false,
  cambioAceite: false,
};

function formatCurrency(value) {
  return `$${value.toLocaleString("es-CO")}`;
}

function App() {
  const [orders, setOrders] = useState(initialOrders);
  const [activeTab, setActiveTab] = useState("serviteca");
  const [placaInput, setPlacaInput] = useState("");
  const [clienteInput, setClienteInput] = useState("");
  const [telefonoInput, setTelefonoInput] = useState("");
  const [mecanicoInput, setMecanicoInput] = useState("");
  const [serviciosRapidos, setServiciosRapidos] = useState(emptyServices);
  const [descItem, setDescItem] = useState("");
  const [precioItem, setPrecioItem] = useState("");
  const [ordenFactura, setOrdenFactura] = useState(null);

  const activeOrders = orders.filter(
    (order) => order.estadoMecanico === "En Taller",
  ).length;
  const pendingPayments = orders.filter(
    (order) => !order.estadoFacturacion.includes("Pagado"),
  ).length;

  function handleCrearOrden(event) {
    event.preventDefault();

    if (!placaInput || !clienteInput || !mecanicoInput) {
      alert("Por favor completa la placa, el cliente y el mecánico asignado.");
      return;
    }

    const newOrder = {
      id: Date.now(),
      placa: placaInput.toUpperCase(),
      cliente: clienteInput,
      telefono: telefonoInput || "N/A",
      mecanico: mecanicoInput,
      fechaIngreso: new Date().toISOString().split("T")[0],
      serviciosServiteca: { ...serviciosRapidos },
      itemsTaller: [
        {
          idItem: Date.now() + 1,
          descripcion: "Mano de obra taller / Diagnóstico",
          cantidad: 1,
          precio: 0,
        },
      ],
      estadoMecanico: "En Taller",
      estadoFacturacion: "Pendiente de Cobro",
    };

    setOrders((currentOrders) => [newOrder, ...currentOrders]);
    setPlacaInput("");
    setClienteInput("");
    setTelefonoInput("");
    setMecanicoInput("");
    setServiciosRapidos(emptyServices);
    alert("¡Vehículo recibido en patio y asignado al taller con éxito!");
    setActiveTab("taller");
  }

  function handleAgregarItemTaller(event, order) {
    event.preventDefault();

    if (!descItem || !precioItem) {
      alert("Ingresa la descripción y el precio del ítem.");
      return;
    }

    const newItem = {
      idItem: `${order.id}-${order.itemsTaller.length + 1}`,
      descripcion: descItem,
      cantidad: 1,
      precio: Number(precioItem),
    };

    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id
          ? {
              ...currentOrder,
              itemsTaller: [...currentOrder.itemsTaller, newItem],
            }
          : currentOrder,
      ),
    );
    setDescItem("");
    setPrecioItem("");
  }

  function handleCerrarOrden(orderId) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? { ...order, estadoMecanico: "Listo para Cierre" }
          : order,
      ),
    );
  }

  function handleFacturarOrden(orderId) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? { ...order, estadoFacturacion: "Facturado y Pagado ✅" }
          : order,
      ),
    );
  }

  const tabs = [
    { id: "serviteca", label: "Recepción", icon: "🚗" },
    { id: "taller", label: "Taller mecánico", icon: "🔧" },
    { id: "ventas", label: "Ventas y facturación", icon: "📊" },
  ];

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#inicio" aria-label="Primax Serviteca, inicio">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-copy">
              <strong>Primax</strong>
              <small>SERVITECA · MEDELLÍN</small>
            </span>
          </a>

          <nav className="header-nav" aria-label="Navegación principal">
            <a href="#inicio">Inicio</a>
            <a href="#operacion">Operación</a>
            <a href="#resumen">Resumen</a>
          </nav>

          <button
            className="header-action"
            type="button"
            onClick={() => setActiveTab("serviteca")}
          >
            + Nueva orden
          </button>
        </div>
      </header>

      <main className="dashboard" id="inicio">
        <section className="hero-panel" aria-labelledby="hero-title">
          <div className="hero-content">
            <span className="eyebrow">CENTRO DE OPERACIONES</span>
            <h1 id="hero-title">Tu serviteca, en marcha.</h1>
            <p>
              Recibe vehículos, coordina el trabajo del taller y lleva cada
              servicio hasta su facturación desde un solo lugar.
            </p>
            <div className="hero-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => setActiveTab("serviteca")}
              >
                Registrar vehículo <span aria-hidden="true">↗</span>
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setActiveTab("taller")}
              >
                Ver órdenes del taller
              </button>
            </div>
          </div>
          <div className="hero-decoration" aria-hidden="true">
            <span className="hero-orbit orbit-one" />
            <span className="hero-orbit orbit-two" />
            <span className="hero-car">✦</span>
          </div>
          <div className="hero-caption">
            <span className="online-indicator" />
            Sistema operativo
          </div>
        </section>

        <section className="metrics-grid" id="resumen" aria-label="Resumen de operación">
          <article className="metric-card">
            <span className="metric-icon metric-blue" aria-hidden="true">▤</span>
            <div>
              <p>Órdenes registradas</p>
              <strong>{orders.length}</strong>
            </div>
            <span className="metric-note">en total</span>
          </article>
          <article className="metric-card">
            <span className="metric-icon metric-amber" aria-hidden="true">⚙</span>
            <div>
              <p>En taller</p>
              <strong>{activeOrders}</strong>
            </div>
            <span className="metric-note">por atender</span>
          </article>
          <article className="metric-card">
            <span className="metric-icon metric-green" aria-hidden="true">$</span>
            <div>
              <p>Pagos pendientes</p>
              <strong>{pendingPayments}</strong>
            </div>
            <span className="metric-note">por cobrar</span>
          </article>
        </section>

        <section className="workspace" id="operacion">
          <div className="workspace-heading">
            <div>
              <span className="section-eyebrow">GESTIÓN DIARIA</span>
              <h2>Panel de operación</h2>
            </div>
            <p>Administra el recorrido de cada vehículo en la serviteca.</p>
          </div>

          <div className="tabs" role="tablist" aria-label="Módulos de operación">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                className={`tab-button ${activeTab === tab.id ? "is-active" : ""}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="workspace-panel">
            {activeTab === "serviteca" && (
              <section
                id="serviteca-panel"
                role="tabpanel"
                aria-labelledby="serviteca-tab"
              >
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">01 · SERVITECA / PATIO</span>
                    <h3>Recepción de vehículos</h3>
                    <p>
                      Registra los datos del cliente y asigna los servicios de
                      patio y el mecánico responsable.
                    </p>
                  </div>
                </div>

                <form className="form-card" id="new-order-form" onSubmit={handleCrearOrden}>
                  <div className="form-card-heading">
                    <span className="form-heading-icon" aria-hidden="true">✎</span>
                    <div>
                      <h4>Datos de ingreso</h4>
                      <p>Los campos marcados con * son obligatorios.</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="plate">Placa <span>*</span></label>
                      <input
                        id="plate"
                        type="text"
                        placeholder="Ej. BFX-228"
                        value={placaInput}
                        onChange={(event) => setPlacaInput(event.target.value)}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="client">Nombre del cliente <span>*</span></label>
                      <input
                        id="client"
                        type="text"
                        placeholder="Ej. Marcela"
                        value={clienteInput}
                        onChange={(event) => setClienteInput(event.target.value)}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="phone">Teléfono</label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="Ej. 311 605 2556"
                        value={telefonoInput}
                        onChange={(event) => setTelefonoInput(event.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="mechanic">Mecánico asignado <span>*</span></label>
                      <input
                        id="mechanic"
                        type="text"
                        placeholder="Ej. Carlos Gómez"
                        value={mecanicoInput}
                        onChange={(event) => setMecanicoInput(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <fieldset className="services-fieldset">
                    <legend>Servicios rápidos de serviteca</legend>
                    <div className="service-options">
                      {quickServices.map((service) => (
                        <label className="service-option" key={service.key}>
                          <input
                            type="checkbox"
                            checked={serviciosRapidos[service.key]}
                            onChange={(event) =>
                              setServiciosRapidos((currentServices) => ({
                                ...currentServices,
                                [service.key]: event.target.checked,
                              }))
                            }
                          />
                          <span>{service.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="form-actions">
                    <button className="primary-button" type="submit">
                      Registrar y enviar al taller <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </form>

                <div className="list-heading">
                  <div>
                    <span className="panel-kicker">SEGUIMIENTO</span>
                    <h3>Órdenes en patio</h3>
                  </div>
                  <span className="count-badge">{orders.length} órdenes</span>
                </div>
                <div className="order-list">
                  {orders.length === 0 ? (
                    <p className="empty-state">Todavía no hay vehículos registrados.</p>
                  ) : (
                    orders.map((order) => (
                      <article className="order-card patio-card" key={order.id}>
                        <div className="order-icon" aria-hidden="true">🚘</div>
                        <div className="order-main">
                          <h4>{order.placa}</h4>
                          <p>{order.cliente} <span>·</span> {order.telefono}</p>
                          <small>Mecánico: <strong>{order.mecanico}</strong></small>
                          <div className="service-chips">
                            {quickServices
                              .filter((service) => order.serviciosServiteca[service.key])
                              .map((service) => (
                                <span key={service.key}>{service.label}</span>
                              ))}
                          </div>
                        </div>
                        <span
                          className={`status-badge ${
                            order.estadoMecanico === "En Taller" ? "status-progress" : "status-ready"
                          }`}
                        >
                          {order.estadoMecanico}
                        </span>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeTab === "taller" && (
              <section id="taller-panel" role="tabpanel" aria-labelledby="taller-tab">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">02 · TALLER MECÁNICO</span>
                    <h3>Órdenes de trabajo</h3>
                    <p>
                      Consulta el trabajo asignado, registra repuestos y mano
                      de obra, y actualiza el estado del vehículo.
                    </p>
                  </div>
                </div>

                <div className="order-list">
                  {orders.length === 0 ? (
                    <p className="empty-state">No hay órdenes pendientes en el taller.</p>
                  ) : (
                    orders.map((order) => (
                      <article className="order-card workshop-card" key={order.id}>
                        <div className="workshop-card-heading">
                          <div className="order-icon" aria-hidden="true">🔧</div>
                          <div className="order-main">
                            <span className="panel-kicker">ORDEN · {order.fechaIngreso}</span>
                            <h4>{order.placa} <span>·</span> {order.cliente}</h4>
                            <p>Mecánico responsable: <strong>{order.mecanico}</strong></p>
                          </div>
                          <span
                            className={`status-badge ${
                              order.estadoMecanico === "En Taller" ? "status-progress" : "status-ready"
                            }`}
                          >
                            {order.estadoMecanico}
                          </span>
                        </div>

                        <div className="items-section">
                          <h5>Ítems, repuestos e insumos</h5>
                          <ul className="item-list">
                            {order.itemsTaller.map((item) => (
                              <li key={item.idItem}>
                                <span>{item.descripcion} <small>× {item.cantidad}</small></span>
                                <strong>{formatCurrency(item.precio * item.cantidad)}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {order.estadoMecanico === "En Taller" ? (
                          <div className="workshop-actions">
                            <form
                              className="add-item-form"
                              onSubmit={(event) => handleAgregarItemTaller(event, order)}
                            >
                              <input
                                aria-label="Descripción del repuesto o insumo"
                                type="text"
                                placeholder="Repuesto o insumo"
                                value={descItem}
                                onChange={(event) => setDescItem(event.target.value)}
                                required
                              />
                              <input
                                aria-label="Precio del repuesto o insumo"
                                type="number"
                                min="0"
                                placeholder="Precio ($)"
                                value={precioItem}
                                onChange={(event) => setPrecioItem(event.target.value)}
                                required
                              />
                              <button className="outline-button" type="submit">
                                + Agregar ítem
                              </button>
                            </form>
                            <button
                              className="success-button"
                              type="button"
                              onClick={() => handleCerrarOrden(order.id)}
                            >
                              ✓ Marcar orden lista
                            </button>
                          </div>
                        ) : (
                          <div className="completed-note">
                            <span aria-hidden="true">✓</span> Trabajo finalizado; listo para facturación.
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeTab === "ventas" && (
              <section id="ventas-panel" role="tabpanel" aria-labelledby="ventas-tab">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">03 · VENTAS Y FACTURACIÓN</span>
                    <h3>Resumen de cobros</h3>
                    <p>
                      Revisa los totales de cada orden, registra el pago y
                      genera la factura para impresión.
                    </p>
                  </div>
                </div>

                <div className="order-list">
                  {orders.length === 0 ? (
                    <p className="empty-state">Aún no hay órdenes para facturar.</p>
                  ) : (
                    orders.map((order) => {
                      const totalOrder = order.itemsTaller.reduce(
                        (total, item) => total + item.precio * item.cantidad,
                        0,
                      );

                      return (
                        <article className="order-card sales-card" key={order.id}>
                          <div className="order-icon sales-icon" aria-hidden="true">＄</div>
                          <div className="order-main">
                            <span className="panel-kicker">ORDEN · {order.fechaIngreso}</span>
                            <h4>{order.placa} <span>·</span> {order.cliente}</h4>
                            <p>Mecánico: <strong>{order.mecanico}</strong></p>
                            <span
                              className={`status-badge ${
                                order.estadoFacturacion.includes("Pagado")
                                  ? "status-ready"
                                  : "status-pending"
                              }`}
                            >
                              {order.estadoFacturacion}
                            </span>
                          </div>
                          <div className="sales-total">
                            <small>Total de la orden</small>
                            <strong>{formatCurrency(totalOrder)}</strong>
                          </div>
                          <div className="sales-actions">
                            <button
                              className="outline-button"
                              type="button"
                              onClick={() => setOrdenFactura(order)}
                            >
                              Ver factura
                            </button>
                            {order.estadoFacturacion !== "Facturado y Pagado ✅" && (
                              <button
                                className="primary-button"
                                type="button"
                                onClick={() => handleFacturarOrden(order.id)}
                              >
                                Registrar pago
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>
        </section>

        <footer className="site-footer">
          <a className="brand footer-brand" href="#inicio">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-copy">
              <strong>Primax Serviteca</strong>
              <small>OPERACIÓN Y SERVICIO</small>
            </span>
          </a>
          <p>Servicio confiable para cada kilómetro.</p>
          <small>© 2026 · Panel de operaciones</small>
        </footer>
      </main>

      {ordenFactura && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOrdenFactura(null);
          }}
        >
          <section
            className="invoice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-title"
          >
            <div className="invoice-heading">
              <span className="brand-mark" aria-hidden="true">P</span>
              <div>
                <h2 id="invoice-title">ESTACIÓN DE SERVICIO PRIMAX</h2>
                <p>Serviteca, taller mecánico y lubricantes</p>
                <small>NIT: 900.123.456-1 · Medellín, Colombia</small>
              </div>
            </div>
            <h3 className="invoice-title">Factura de venta / servicio</h3>

            <dl className="invoice-details">
              <div><dt>Placa</dt><dd>{ordenFactura.placa}</dd></div>
              <div><dt>Cliente</dt><dd>{ordenFactura.cliente}</dd></div>
              <div><dt>Teléfono</dt><dd>{ordenFactura.telefono}</dd></div>
              <div><dt>Mecánico</dt><dd>{ordenFactura.mecanico}</dd></div>
              <div><dt>Fecha de ingreso</dt><dd>{ordenFactura.fechaIngreso}</dd></div>
            </dl>

            <div className="invoice-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>Precio unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenFactura.itemsTaller.map((item) => (
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

            <div className="invoice-total">
              <span>Total a pagar</span>
              <strong>
                {formatCurrency(
                  ordenFactura.itemsTaller.reduce(
                    (total, item) => total + item.precio * item.cantidad,
                    0,
                  ),
                )}
              </strong>
            </div>

            <div className="invoice-actions">
              <button
                className="outline-button"
                type="button"
                onClick={() => setOrdenFactura(null)}
              >
                Cerrar
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => window.print()}
              >
                Imprimir factura
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
