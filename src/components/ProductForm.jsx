import { useState } from "react";

function ProductForm({
  onAddItem,
  title = "¿No está en el catálogo?",
  description: helpText = "Agrega otro servicio, repuesto o insumo a esta orden.",
  submitLabel = "Agregar ítem",
}) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [type, setType] = useState("Producto");

  async function handleSubmit(event) {
    event.preventDefault();
    const added = await onAddItem({
      descripcion: description.trim(),
      cantidad: Number(quantity),
      precio: Number(price),
      tipo: type,
    });
    if (added === false) return;
    setDescription("");
    setPrice("");
    setQuantity("1");
    setType("Producto");
  }

  return (
    <form className="custom-item-form" onSubmit={handleSubmit}>
      <div className="custom-item-heading">
        <h4>{title}</h4>
        <p>{helpText}</p>
      </div>
      <label>
        Trabajo o producto
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ej. revisión de suspensión"
          required
        />
      </label>
      <label>
        Tipo
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="Servicio">Servicio / trabajo</option>
          <option value="Producto">Repuesto / producto</option>
        </select>
      </label>
      <label>
        Precio unitario
        <input
          type="number"
          min="0"
          step="100"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="$"
          required
        />
      </label>
      <label>
        Cantidad
        <input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />
      </label>
      <button className="outline-button custom-item-submit" type="submit">
        + {submitLabel}
      </button>
    </form>
  );
}

export default ProductForm;
