function ProductCard({ item, onAdd }) {
  return (
    <article className="catalog-card">
      <div className="catalog-card-top">
        <span className="catalog-card-icon" aria-hidden="true">
          {item.type === "Servicio" ? "⚙" : "▣"}
        </span>
        <span className="catalog-card-category">{item.category}</span>
      </div>
      <h4>{item.name}</h4>
      <p>{item.description}</p>
      <div className="catalog-card-footer">
        <strong>{item.price === 0 ? "Por definir" : `$${item.price.toLocaleString("es-CO")}`}</strong>
        <button type="button" className="outline-button" onClick={() => onAdd(item)}>
          + Agregar
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
