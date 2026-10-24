export function ProductCard({ producto, onVender }) {
  return (
    <div style={{ background: "#1e293b", color: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <h3>{producto.nombre}</h3>
      <p style={{ color: "#38bdf8", fontWeight: "bold" }}>Precio: ${producto.precio.toLocaleString()}</p>
      <p>Stock disponible: {producto.stock} unidades</p>
      
      <button 
        onClick={() => onVender(producto.id)}
        style={{ 
          background: producto.stock > 0 ? "#10b981" : "#64748b", 
          color: "#fff", 
          border: "none", 
          padding: "8px 12px", 
          borderRadius: "4px", 
          cursor: producto.stock > 0 ? "pointer" : "not-allowed", 
          fontWeight: "bold" 
        }}
        disabled={producto.stock === 0}
      >
        {producto.stock > 0 ? "Vender" : "Agotado"}
      </button>
    </div>
  );
}