import ProductCard from "./ProductCard.jsx";

function ProductGrid({ items, onAdd }) {
  if (items.length === 0) {
    return <p className="empty-state">No encontramos servicios o repuestos con esa búsqueda.</p>;
  }

  return (
    <div className="catalog-grid">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} onAdd={onAdd} />
      ))}
    </div>
  );
}

export default ProductGrid;
