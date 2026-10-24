import { useState } from "react";

export function ProductForm({ onAgregarProducto }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue por defecto

    // Validación básica exigida en las fichas del curso
    if (!nombre || precio <= 0 || stock < 0) {
      alert("Por favor completa todos los campos correctamente.");
      return;
    }

    // Creamos el nuevo objeto producto (con la estructura de tus fichas)
    const nuevoProducto = {
      id: Date.now(),
      nombre: nombre,
      precio: Number(precio),
      stock: Number(stock),
    };

    // Enviamos el producto al componente principal
    onAgregarProducto(nuevoProducto);

    // Limpiamos el formulario después de enviar
    setNombre("");
    setPrecio("");
    setStock("");
  };

  return (
    <div style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", border: "1px solid #334155", boxShadow: "0 4px 6px rgba(0,0,0,0.2)", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, color: "#38bdf8", borderBottom: "2px solid #334155", paddingBottom: "10px" }}>
        ➕ Agregar Nuevo Producto
      </h3>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "4px" }}>Nombre del producto:</label>
          <input 
            type="text" 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            placeholder="Ej. Gaseosa 1.5L"
            style={{ width: "100%", padding: "8px", borderRadius: "4px", background: "#0f172a", border: "1px solid #334155", color: "#fff", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "4px" }}>Precio ($):</label>
          <input 
            type="number" 
            value={precio} 
            onChange={(e) => setPrecio(e.target.value)} 
            placeholder="Ej. 4000"
            style={{ width: "100%", padding: "8px", borderRadius: "4px", background: "#0f172a", border: "1px solid #334155", color: "#fff", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "4px" }}>Stock inicial (Unidades):</label>
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(e.target.value)} 
            placeholder="Ej. 20"
            style={{ width: "100%", padding: "8px", borderRadius: "4px", background: "#0f172a", border: "1px solid #334155", color: "#fff", boxSizing: "border-box" }}
          />
        </div>

        <button 
          type="submit"
          style={{ background: "#38bdf8", color: "#0f172a", border: "none", padding: "10px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", marginTop: "5px" }}
        >
          Guardar Producto
        </button>
      </form>
    </div>
  );
}