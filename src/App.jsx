import { useState } from "react";
import { initialOrders } from "./data/orders.js";

export default function App() {
  const [orders, setOrders] = useState(initialOrders);
  const [activeTab, setActiveTab] = useState("serviteca"); // 'serviteca' | 'taller' | 'ventas'

  // Estados para el formulario de Creación en Serviteca
  const [placaInput, setPlacaInput] = useState("");
  const [clienteInput, setClienteInput] = useState("");
  const [telefonoInput, setTelefonoInput] = useState("");
  const [mecanicoInput, setMecanicoInput] = useState("");
  const [serviciosRapidos, setServiciosRapidos] = useState({
    lavadaSencilla: false,
    brillada: false,
    alineacion: false,
    balanceo: false,
    cambioAceite: false,
  });

  // Estados temporales para el Taller Mecánico
  const [descItem, setDescItem] = useState("");
  const [precioItem, setPrecioItem] = useState("");

  // Estado para la Factura Modal (Lineth)
  const [ordenFactura, setOrdenFactura] = useState(null);

  // 1. CREAR NUEVA ORDEN
  const handleCrearOrden = (e) => {
    e.preventDefault();
    if (!placaInput || !clienteInput || !mecanicoInput) {
      alert("Por favor completa la Placa, el Cliente y el Mecánico asignado.");
      return;
    }

    const nuevaOrden = {
      id: Date.now(),
      placa: placaInput.toUpperCase(),
      cliente: clienteInput,
      telefono: telefonoInput || "N/A",
      mecanico: mecanicoInput,
      fechaIngreso: new Date().toISOString().split("T")[0],
      serviciosServiteca: { ...serviciosRapidos },
      itemsTaller: [
        { idItem: Date.now() + 1, descripcion: "Mano de obra taller / Diagnóstico", cantidad: 1, precio: 0 }
      ],
      estadoMecanico: "En Taller",
      estadoFacturacion: "Pendiente de Cobro"
    };

    setOrders([nuevaOrden, ...orders]);
    setPlacaInput("");
    setClienteInput("");
    setTelefonoInput("");
    setMecanicoInput("");
    setServiciosRapidos({
      lavadaSencilla: false,
      brillada: false,
      alineacion: false,
      balanceo: false,
      cambioAceite: false,
    });

    alert("¡Vehículo recibido en patio y asignado al taller con éxito!");
    setActiveTab("taller");
  };

  // 2. AGREGAR ÍTEM EN TALLER
  const handleAgregarItemTaller = (e, orderId) => {
    e.preventDefault();
    if (!descItem || !precioItem) {
      alert("Ingresa la descripción y el precio del ítem.");
      return;
    }

    const nuevasOrdenes = orders.map((ord) => {
      if (ord.id === orderId) {
        const nuevoItem = {
          idItem: Date.now(),
          descripcion: descItem,
          cantidad: 1,
          precio: Number(precioItem),
        };
        return { ...ord, itemsTaller: [...ord.itemsTaller, nuevoItem] };
      }
      return ord;
    });

    setOrders(nuevasOrdenes);
    setDescItem("");
    setPrecioItem("");
  };

  // 3. CERRAR ORDEN EN TALLER
  const handleCerrarOrden = (orderId) => {
    const nuevasOrdenes = orders.map((ord) => {
      if (ord.id === orderId) {
        return { ...ord, estadoMecanico: "Listo para Cierre" };
      }
      return ord;
    });
    setOrders(nuevasOrdenes);
  };

  // 4. FACTURAR Y PAGAR
  const handleFacturarOrden = (orderId) => {
    const nuevasOrdenes = orders.map((ord) => {
      if (ord.id === orderId) {
        return { ...ord, estadoFacturacion: "Facturado y Pagado ✅" };
      }
      return ord;
    });
    setOrders(nuevasOrdenes);
  };

  return (
    <div style={{ background: "#090d16", minHeight: "100vh", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif", padding: "24px" }}>
      
      {/* Encabezado Principal Estilizado */}
      <header style={{ textAlign: "center", marginBottom: "30px", borderBottom: "1px solid #1e293b", paddingBottom: "20px" }}>
        <h1 style={{ color: "#38bdf8", fontSize: "2.8rem", margin: 0, fontWeight: "800", letterSpacing: "-0.5px" }}>⛽ Primax Service Control</h1>
        <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "1.05rem" }}>Plataforma Integral de Operaciones: Serviteca, Taller Mecánico y Ventas</p>
      </header>

      {/* Menú de Navegación por Pestañas */}
      <nav style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "30px" }}>
        {[
          { id: "serviteca", label: "🚗 1. Serviteca / Patio" },
          { id: "taller", label: "🔧 2. Taller Mecánico" },
          { id: "ventas", label: "📊 3. Ventas y Facturación" }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              background: activeTab === tab.id ? "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)" : "#1e293b", 
              color: activeTab === tab.id ? "#090d16" : "#cbd5e1", 
              border: activeTab === tab.id ? "none" : "1px solid #334155", 
              padding: "12px 24px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", 
              boxShadow: activeTab === tab.id ? "0 4px 14px rgba(56, 189, 248, 0.4)" : "0 2px 4px rgba(0,0,0,0.2)",
              transition: "all 0.2s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Contenedor Principal */}
      <main style={{ maxWidth: "1050px", margin: "0 auto", background: "#111827", padding: "30px", borderRadius: "16px", border: "1px solid #1f2937", boxShadow: "0 10px 25px rgba(0,0,0,0.4)" }}>
        
        {/* --- VISTA 1: SERVITECA / PATIO --- */}
        {activeTab === "serviteca" && (
          <div>
            <div style={{ marginBottom: "25px" }}>
              <h2 style={{ color: "#38bdf8", margin: "0 0 5px 0", fontSize: "1.6rem" }}>🚗 Recepción y Servicios Rápidos (Patio)</h2>
              <p style={{ color: "#94a3b8", margin: 0 }}>Captura inicial de datos del vehículo, selección de servicios rápidos y asignación de mecánico.</p>
            </div>
            
            {/* Formulario de Registro */}
            <form onSubmit={handleCrearOrden} style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151", marginBottom: "35px" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#fbbf24", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                📝 Formulario de Ingreso de Vehículo
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>Placa:</label>
                  <input 
                    type="text" placeholder="Ej. BFX-228" value={placaInput} onChange={(e) => setPlacaInput(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#111827", border: "1px solid #4b5563", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>Cliente:</label>
                  <input 
                    type="text" placeholder="Ej. Marcela" value={clienteInput} onChange={(e) => setClienteInput(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#111827", border: "1px solid #4b5563", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>Teléfono:</label>
                  <input 
                    type="text" placeholder="Ej. 3116052556" value={telefonoInput} onChange={(e) => setTelefonoInput(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#111827", border: "1px solid #4b5563", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px", fontWeight: "600" }}>Mecánico Asignado:</label>
                  <input 
                    type="text" placeholder="Ej. Carlos Gómez" value={mecanicoInput} onChange={(e) => setMecanicoInput(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#111827", border: "1px solid #4b5563", color: "#fff", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Checkboxes de Servicios Rápidos */}
              <div style={{ marginBottom: "25px", background: "#111827", padding: "16px", borderRadius: "8px", border: "1px solid #374151" }}>
                <label style={{ display: "block", fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "12px", fontWeight: "600" }}>Servicios Rápidos de Serviteca (Ticket Físico):</label>
                <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
                  {[
                    { key: "lavadaSencilla", label: "Lavada Sencilla" },
                    { key: "brillada", label: "Brillada" },
                    { key: "alineacion", label: "Alineación" },
                    { key: "balanceo", label: "Balanceo" },
                    { key: "cambioAceite", label: "Cambio de Aceite" }
                  ].map((srv) => (
                    <label key={srv.key} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#e2e8f0" }}>
                      <input 
                        type="checkbox" checked={serviciosRapidos[srv.key]}
                        onChange={(e) => setServiciosRapidos({...serviciosRapidos, [srv.key]: e.target.checked})}
                        style={{ width: "16px", height: "16px", accentColor: "#38bdf8" }}
                      /> {srv.label}
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                style={{ background: "#38bdf8", color: "#090d16", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                🚀 Registrar y Enviar al Taller
              </button>
            </form>

            <h3 style={{ color: "#38bdf8", fontSize: "1.3rem", marginBottom: "15px" }}>📋 Órdenes Activas en Patio</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {orders.map((ord) => (
                <div key={ord.id} style={{ background: "#1f2937", padding: "18px", borderRadius: "10px", border: "1px solid #374151", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", color: "#38bdf8", fontSize: "1.1rem" }}>🚗 Placa: {ord.placa} — Cliente: {ord.cliente}</h4>
                    <p style={{ margin: "3px 0", color: "#94a3b8", fontSize: "0.85rem" }}>Teléfono: {ord.telefono} | Mecánico: <strong style={{ color: "#fbbf24" }}>{ord.mecanico}</strong></p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ background: ord.estadoMecanico === "En Taller" ? "#ca8a04" : "#16a34a", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700" }}>
                      {ord.estadoMecanico}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VISTA 2: TALLER MECÁNICO --- */}
        {activeTab === "taller" && (
          <div>
            <div style={{ marginBottom: "25px" }}>
              <h2 style={{ color: "#38bdf8", margin: "0 0 5px 0", fontSize: "1.6rem" }}>🔧 Módulo de Taller (Mecánico)</h2>
              <p style={{ color: "#94a3b8", margin: 0 }}>Supervisa los vehículos asignados, añade repuestos o mano de obra con los días y marca cuando esté listo.</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {orders.map((ord) => (
                <div key={ord.id} style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #374151", paddingBottom: "12px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", color: "#38bdf8", fontSize: "1.2rem" }}>🚗 Placa: {ord.placa} ({ord.cliente})</h3>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                        Mecánico responsable: <strong style={{ color: "#fbbf24" }}>{ord.mecanico}</strong> | Estado: <span style={{ color: ord.estadoMecanico === "En Taller" ? "#facc15" : "#4ade80", fontWeight: "bold" }}>{ord.estadoMecanico}</span>
                      </p>
                    </div>

                    {ord.estadoMecanico === "En Taller" ? (
                      <button 
                        onClick={() => handleCerrarOrden(ord.id)}
                        style={{ background: "#16a34a", color: "#fff", border: "none", padding: "9px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        ✅ Marcar Orden Lista
                      </button>
                    ) : (
                      <span style={{ background: "#065f46", color: "#34d399", padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700" }}>
                        ✔ Trabajo Finalizado
                      </span>
                    )}
                  </div>
                  
                  <h4 style={{ margin: "10px 0 6px 0", color: "#fbbf24", fontSize: "0.95rem" }}>📦 Ítems, Repuestos e Insumos en Taller:</h4>
                  <ul style={{ margin: "0 0 15px 0", paddingLeft: "20px", color: "#cbd5e1", fontSize: "0.9rem" }}>
                    {ord.itemsTaller.map((item) => (
                      <li key={item.idItem} style={{ marginBottom: "4px" }}>
                        {item.descripcion} (Cant: {item.cantidad}) — <strong style={{ color: "#4ade80" }}>${(item.precio * item.cantidad).toLocaleString()}</strong>
                      </li>
                    ))}
                  </ul>

                  {ord.estadoMecanico === "En Taller" && (
                    <form onSubmit={(e) => handleAgregarItemTaller(e, ord.id)} style={{ background: "#111827", padding: "12px", borderRadius: "8px", border: "1px dashed #4b5563", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                      <input 
                        type="text" placeholder="Repuesto / Insumo (Ej. Pastas de freno)" value={descItem} onChange={(e) => setDescItem(e.target.value)}
                        style={{ flex: 2, padding: "8px 12px", borderRadius: "6px", background: "#1f2937", border: "1px solid #4b5563", color: "#fff", fontSize: "0.85rem" }}
                      />
                      <input 
                        type="number" placeholder="Precio ($)" value={precioItem} onChange={(e) => setPrecioItem(e.target.value)}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", background: "#1f2937", border: "1px solid #4b5563", color: "#fff", fontSize: "0.85rem" }}
                      />
                      <button 
                        type="submit"
                        style={{ background: "#38bdf8", color: "#090d16", border: "none", padding: "9px 14px", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        + Agregar Ítem
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VISTA 3: VENTAS Y FACTURACIÓN --- */}
        {activeTab === "ventas" && (
          <div>
            <div style={{ marginBottom: "25px" }}>
              <h2 style={{ color: "#38bdf8", margin: "0 0 5px 0", fontSize: "1.6rem" }}>📊 Módulo de Ventas y Facturación (Lineth)</h2>
              <p style={{ color: "#94a3b8", margin: 0 }}>Consolidado financiero, auditoría de órdenes y emisión de factura detallada para impresión.</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {orders.map((ord) => {
                const totalOrden = ord.itemsTaller.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
                
                return (
                  <div key={ord.id} style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 5px 0", color: "#38bdf8", fontSize: "1.15rem" }}>Placa: {ord.placa} | Cliente: {ord.cliente}</h3>
                      <p style={{ margin: "3px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                        Mecánico: <strong style={{ color: "#fbbf24" }}>{ord.mecanico}</strong> | Estado Taller: <span style={{ color: ord.estadoMecanico === "En Taller" ? "#facc15" : "#4ade80", fontWeight: "bold" }}>{ord.estadoMecanico}</span>
                      </p>
                      <p style={{ margin: "3px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                        Pago: <span style={{ color: ord.estadoFacturacion.includes("Pagado") ? "#34d399" : "#fbbf24", fontWeight: "bold" }}>{ord.estadoFacturacion}</span>
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.8rem" }}>Total Consolidado:</p>
                        <h3 style={{ margin: "2px 0 0 0", color: "#4ade80", fontSize: "1.3rem" }}>${totalOrden.toLocaleString()}</h3>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        {/* Botón para abrir la Factura Imprimible */}
                        <button 
                          onClick={() => setOrdenFactura(ord)}
                          style={{ background: "#38bdf8", color: "#090d16", border: "none", padding: "9px 14px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          🖨️ Ver Factura
                        </button>

                        {ord.estadoFacturacion !== "Facturado y Pagado ✅" && (
                          <button 
                            onClick={() => handleFacturarOrden(ord.id)}
                            style={{ background: "#f59e0b", color: "#090d16", border: "none", padding: "9px 14px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" }}
                          >
                            💳 Cobrar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL DE FACTURA / TICKET IMPRIMIBLE PARA LINETH --- */}
      {ordenFactura && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", color: "#0f172a", width: "100%", maxWidth: "600px", borderRadius: "12px", padding: "30px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            
            {/* Cabecera Factura */}
            <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "15px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#0284c7", fontSize: "1.8rem" }}>⛽ ESTACIÓN DE SERVICIO PRIMAX</h2>
              <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#64748b" }}>Serviteca, Taller Mecánico y Lubricantes</p>
              <p style={{ margin: "2px 0", fontSize: "0.8rem", color: "#64748b" }}>NIT: 900.123.456-1 | Medellín, Colombia</p>
              <h3 style={{ margin: "10px 0 0 0", color: "#334155", fontSize: "1.1rem" }}>FACTURA DE VENTA / SERVICIO</h3>
            </div>

            {/* Datos del Cliente y Carro */}
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "4px 0" }}><strong>Placa:</strong> {ordenFactura.placa}</p>
              <p style={{ margin: "4px 0" }}><strong>Cliente:</strong> {ordenFactura.cliente}</p>
              <p style={{ margin: "4px 0" }}><strong>Teléfono:</strong> {ordenFactura.telefono}</p>
              <p style={{ margin: "4px 0" }}><strong>Mecánico Encargado:</strong> {ordenFactura.mecanico}</p>
              <p style={{ margin: "4px 0" }}><strong>Fecha de Ingreso:</strong> {ordenFactura.fechaIngreso}</p>
            </div>

            {/* Tabla Detallada */}
            <h4 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "1rem" }}>Desglose de Ítems y Servicios:</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ textAlign: "left", padding: "8px" }}>Descripción</th>
                  <th style={{ textAlign: "center", padding: "8px" }}>Cant.</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>Precio Unit.</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {ordenFactura.itemsTaller.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px" }}>{item.descripcion}</td>
                    <td style={{ textAlign: "center", padding: "8px" }}>{item.cantidad}</td>
                    <td style={{ textAlign: "right", padding: "8px" }}>${item.precio.toLocaleString()}</td>
                    <td style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>${(item.precio * item.cantidad).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Factura */}
            <div style={{ textAlign: "right", marginBottom: "30px", borderTop: "2px solid #0f172a", paddingTop: "10px" }}>
              <h2 style={{ margin: 0, color: "#16a34a", fontSize: "1.6rem" }}>
                Total a Pagar: ${ordenFactura.itemsTaller.reduce((acc, i) => acc + (i.precio * i.cantidad), 0).toLocaleString()}
              </h2>
            </div>

            {/* Botones de Acción Modal */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={() => setOrdenFactura(null)}
                style={{ background: "#64748b", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
              >
                Cerrar
              </button>
              <button 
                onClick={() => window.print()}
                style={{ background: "#0284c7", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
              >
                🖨️ Imprimir Factura
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}