function SearchBar({ search, onSearchChange }) {
  return (
    <label className="catalog-search">
      <span>Buscar servicios y repuestos</span>
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Ej. cambio de aceite, pastas de freno..."
      />
    </label>
  );
}

export default SearchBar;
