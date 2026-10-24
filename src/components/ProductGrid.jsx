import { ProductCard } from "./ProductCard";

export function ProductGrid({ productos, onVender }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", padding: "20px" }}>
      {productos.map((prod) => (
        <ProductCard key={prod.id} producto={prod} onVender={onVender} />
      ))}
    </div>
  );
}